import { useEffect } from 'react';
import './ModalConfirmacion.css';

/**
 * ModalConfirmacion - Diálogo modal de confirmación obligatorio para acciones críticas
 * (Inasistencia, Cancelar Turno, Liberar Horario).
 *
 * @param {boolean} isOpen - Controla la visibilidad del modal
 * @param {function} onClose - Callback al cancelar o cerrar el diálogo
 * @param {function} onConfirm - Callback al confirmar la acción
 * @param {string} [titulo='¿Confirmar acción?'] - Título del modal
 * @param {string|React.ReactNode} mensaje - Texto explicativo con datos del turno/paciente
 * @param {'peligro'|'petroleo'|'exito'|'advertencia'} [tipo='peligro'] - Variante de estilo y color
 * @param {string} [textoConfirmar='Sí, confirmar'] - Etiqueta del botón de confirmación
 * @param {string} [textoCancelar='Volver / No'] - Etiqueta del botón de cancelación
 * @param {function} [onSecondaryAction] - Callback para acción alternativa (ej: Inasistencia y Reprogramar)
 * @param {string} [textoSecondaryAction] - Etiqueta del botón de acción alternativa
 * @param {'peligro'|'petroleo'|'exito'|'advertencia'|'primario'} [tipoSecondaryAction='petroleo'] - Variante de color de la acción secundaria
 * @param {boolean} [isLoading=false] - Estado de carga mientras se procesa la acción
 */
export const ModalConfirmacion = ({
  isOpen,
  onClose,
  onConfirm,
  titulo = '¿Confirmar acción?',
  mensaje,
  tipo = 'peligro',
  icono = null,
  textoConfirmar = 'Sí, confirmar',
  textoCancelar = 'Volver / No',
  onSecondaryAction,
  textoSecondaryAction,
  tipoSecondaryAction = 'petroleo',
  isLoading = false
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const renderIcon = () => {
    switch (tipo) {
      case 'peligro':
      case 'alerta':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'petroleo':
      case 'advertencia':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'exito':
      default:
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
    }
  };

  return (
    <div
      className="modal-confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-confirm-title"
      onClick={isLoading ? undefined : onClose}
    >
      <div
        className="modal-confirm-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-confirm-header">
          <div className="modal-confirm-title-group">
            <div className={`modal-confirm-icon-badge ${tipo}`}>
              {icono || renderIcon()}
            </div>
            <h2 id="modal-confirm-title" className="modal-confirm-title">
              {titulo}
            </h2>
          </div>

          <button
            type="button"
            className="modal-confirm-close-btn"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Cerrar ventana de confirmación"
          >
            ✕
          </button>
        </div>

        <div className="modal-confirm-body">
          <div className="modal-confirm-mensaje">
            {typeof mensaje === 'string' ? <p>{mensaje}</p> : mensaje}
          </div>
        </div>

        <div className="modal-confirm-actions">
          <button
            type="button"
            className="btn-modal-cancelar-neutro btn-secondary bg-[#f87171] hover:bg-[#ef4444] text-white font-medium rounded-xl transition-all shadow-sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {textoCancelar}
          </button>

          <button
            type="button"
            className={`btn-modal-confirmar-accion ${tipo} ${tipo === 'peligro' || tipo === 'alerta' ? 'btn-danger' : 'btn-primary'}`}
            onClick={async (e) => {
              if (e && e.preventDefault) e.preventDefault();
              if (isLoading) return;
              try {
                if (onConfirm) {
                  await onConfirm();
                }
              } finally {
                if (onClose) {
                  onClose();
                }
              }
            }}
            disabled={isLoading}
            autoFocus={!onSecondaryAction}
          >
            {isLoading ? 'Procesando...' : textoConfirmar}
          </button>

          {onSecondaryAction && (
            <button
              type="button"
              className={`btn-modal-secundaria-accion ${tipoSecondaryAction || 'petroleo'}`}
              onClick={onSecondaryAction}
              disabled={isLoading}
              autoFocus
            >
              {textoSecondaryAction}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacion;
