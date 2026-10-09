import { useEffect, useState } from 'react';
import './ModalConfirmacion.css';
export const ModalConfirmacion = ({
  isOpen,
  onClose,
  onConfirm,
  titulo = '¿Confirmar acción?',
  mensaje,
  tipo = 'peligro',
  icono = null,
  textoConfirmar = 'Sí, cancelar turno',
  textoCancelar = 'Volver',
  isLoading = false
}) => {
  // Estado local para almacenar el motivo opcional escrito por el odontologo
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setMotivo('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const esCancelacion = titulo.toLowerCase().includes('cancelar');
  
  const handleConfirmarSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isLoading) return;

    try {
      if (onConfirm) {
        // Enviamos el motivo procesado al callback onConfirm
        await onConfirm(motivo.trim());
      }
    } finally {
      if (onClose) {
        onClose();
      }
    }
  };

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
      onClick={isLoading ? undefined : onClose}
    >
      <div className="modal-confirm-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-confirm-header">
          <div className="modal-confirm-title-group">
            <div className={`modal-confirm-icon-badge ${tipo}`}>
              {icono || renderIcon()}
            </div>
            <h2 className="modal-confirm-title">{titulo}</h2>
          </div>

          <button
            type="button"
            className="modal-confirm-close-btn"
            onClick={onClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleConfirmarSubmit}>
          <div className="modal-confirm-body">
            <div className="modal-confirm-mensaje">
              {typeof mensaje === 'string' ? <p>{mensaje}</p> : mensaje}
            </div>

            {/* Renderizado del área de texto para el motivo opcional */}
            {esCancelacion && (
              <div style={{ marginTop: '16px', textAlign: 'left' }}>
                <label 
                  style={{ 
                    display: 'block', 
                    fontSize: '0.9rem', 
                    fontWeight: '600', 
                    color: '#334155', 
                    marginBottom: '8px',
                    fontFamily: 'inherit' 
                  }}
                >
                  Motivo de la cancelación <span style={{ color: '#94a3b8', fontWeight: '400', fontSize: '0.85rem' }}>(Opcional)</span>
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Motivo de la cancelación..."
                  rows={3}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    color: '#1e293b',
                    fontFamily: 'inherit', 
                    lineHeight: '1.5',
                    resize: 'none',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
          </div>

          <div className="modal-confirm-actions" style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="btn-modal-cancelar-neutro btn-secondary bg-[#f87171] hover:bg-[#ef4444] text-white font-medium rounded-xl transition-all shadow-sm"
              onClick={onClose}
              disabled={isLoading}
              style={{ fontFamily: 'inherit' }} 
            >
              {textoCancelar}
            </button>

            <button
              type="submit"
              className={`btn-modal-confirmar-accion ${tipo} ${tipo === 'peligro' ? 'btn-danger' : 'btn-primary'}`}
              disabled={isLoading}
              style={{ fontFamily: 'inherit' }} 
            >
              {isLoading ? 'Procesando...' : textoConfirmar}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalConfirmacion;