import { useEffect } from 'react';
import './ModalConfirmarEliminacion.css';

/**
 * ModalConfirmarEliminacion - Modal de confirmación destructiva personalizado
 * Reemplaza el uso de window.confirm() para prácticas odontológicas y pacientes.
 *
 * @param {boolean} isOpen - Controla la visibilidad del modal
 * @param {function} onClose - Callback al cancelar o cerrar el diálogo
 * @param {function} onConfirm - Callback al confirmar la eliminación
 * @param {string} [nombrePractica] - Nombre de la práctica a eliminar
 * @param {string} [titulo='Eliminar Práctica'] - Título del encabezado
 * @param {React.ReactNode|string} [mensaje] - Mensaje personalizado
 * @param {string} [subtexto='Esta acción quitará la práctica del catálogo activo y no podrá deshacerse.'] - Subtexto explicativo
 * @param {string} [textoConfirmar='Eliminar Práctica'] - Texto del botón de confirmación
 * @param {string} [textoCancelar='Cancelar'] - Texto del botón de cancelación
 * @param {boolean} [isLoading=false] - Indica si la acción está en proceso
 */
export const ModalConfirmarEliminacion = ({
  isOpen,
  onClose,
  onConfirm,
  nombrePractica,
  titulo = 'Eliminar Práctica',
  mensaje,
  subtexto = 'Esta acción quitará la práctica del catálogo activo y no podrá deshacerse.',
  textoConfirmar = 'Eliminar Práctica',
  textoCancelar = 'Cancelar',
  isLoading = false
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-eliminar-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-eliminar-title"
      onClick={isLoading ? undefined : onClose}
    >
      <div
        className="modal-eliminar-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-eliminar-header">
          <div className="modal-eliminar-title-group">
            <div className="modal-eliminar-icon-badge" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h2 id="modal-eliminar-title" className="modal-eliminar-title">
              {titulo}
            </h2>
          </div>

          <button
            type="button"
            className="modal-eliminar-close-btn"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Cerrar ventana de confirmación"
          >
            ✕
          </button>
        </div>

        <div className="modal-eliminar-body">
          <div className="modal-eliminar-texto-group">
            <p className="modal-eliminar-pregunta">
              {mensaje || (
                <>
                  ¿Estás seguro de que deseas eliminar la práctica{' '}
                  {nombrePractica ? <strong>"{nombrePractica}"</strong> : 'seleccionada'}?
                </>
              )}
            </p>
            {subtexto && (
              <p className="modal-eliminar-subtexto">
                {subtexto}
              </p>
            )}
          </div>
        </div>

        <div className="modal-eliminar-actions">
          <button
            type="button"
            className="btn-modal-eliminar-cancelar"
            onClick={onClose}
            disabled={isLoading}
          >
            {textoCancelar}
          </button>

          <button
            type="button"
            className="btn-modal-eliminar-confirmar"
            onClick={onConfirm}
            disabled={isLoading}
            autoFocus
          >
            {isLoading ? 'Eliminando...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmarEliminacion;
