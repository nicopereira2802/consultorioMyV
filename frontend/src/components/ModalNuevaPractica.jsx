import { useState, useEffect } from 'react';
import { ModalConfirmacion } from './ModalConfirmacion';
import './ModalNuevaPractica.css';

const ESPECIALIDADES = [
  'Diagnóstico',
  'Operatoria',
  'Periodoncia',
  'Endodoncia',
  'Cirugía',
  'Prótesis',
  'Preventiva',
  'General'
];

export const ModalNuevaPractica = ({
  isOpen,
  onClose,
  onGuardar,
  practica = null
}) => {
  const [formData, setFormData] = useState(() => ({
    codigo_nomenclador: practica?.codigo_nomenclador || '',
    nombre_referencia: practica?.nombre_referencia || '',
    nombre_nomenclador: practica?.nombre_nomenclador || '',
    especialidad: practica?.especialidad || 'General',
    precio_referencia:
      practica?.precio_referencia !== undefined && practica?.precio_referencia !== null
        ? String(practica.precio_referencia)
        : ''
  }));

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        codigo_nomenclador: practica?.codigo_nomenclador || '',
        nombre_referencia: practica?.nombre_referencia || '',
        nombre_nomenclador: practica?.nombre_nomenclador || '',
        especialidad: practica?.especialidad || 'General',
        precio_referencia:
          practica?.precio_referencia !== undefined && practica?.precio_referencia !== null
            ? String(practica.precio_referencia)
            : ''
      });
      setErrorMsg('');
      setMostrarConfirmacion(false);
      setIsSubmitting(false);
    }
  }, [isOpen, practica]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        if (mostrarConfirmacion) {
          setMostrarConfirmacion(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, isSubmitting, mostrarConfirmacion]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const codigo = formData.codigo_nomenclador.trim();
    const nombreRef = formData.nombre_referencia.trim();
    const precioStr = String(formData.precio_referencia).trim();

    if (!codigo) {
      setErrorMsg('El código del nomenclador es obligatorio.');
      return;
    }

    if (!nombreRef) {
      setErrorMsg('El nombre de referencia (nombre habitual) es obligatorio.');
      return;
    }

    if (!precioStr || isNaN(Number(precioStr)) || Number(precioStr) < 0) {
      setErrorMsg('El precio de referencia es obligatorio y debe ser un valor numérico válido.');
      return;
    }

    setMostrarConfirmacion(true);
  };

  const ejecutarGuardado = async () => {
    const codigo = formData.codigo_nomenclador.trim();
    const nombreRef = formData.nombre_referencia.trim();
    const precioStr = String(formData.precio_referencia).trim();

    const payload = {
      codigo_nomenclador: codigo,
      nombre_referencia: nombreRef,
      nombre_nomenclador: formData.nombre_nomenclador.trim() || nombreRef,
      especialidad: formData.especialidad || 'General',
      precio_referencia: Number(precioStr),
      activo: true
    };

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onGuardar(payload);
      setMostrarConfirmacion(false);
    } catch (err) {
      console.error('Error al guardar práctica:', err);
      setErrorMsg(err?.userMessage || err?.message || 'Ocurrió un error al registrar la práctica.');
      setMostrarConfirmacion(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const esEdicion = Boolean(practica && practica.id_practica);

  return (
    <div
      className="modal-practica-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-practica-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="modal-practica-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-practica-header">
          <div className="modal-practica-title-group">
            <div className="modal-practica-icon-badge" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 12h6" />
                <path d="M9 16h6" />
                <path d="M9 8h2" />
              </svg>
            </div>
            <div>
              <h2 id="modal-practica-title" className="modal-practica-title">
                {esEdicion ? 'Editar Práctica' : 'Nueva Práctica'}
              </h2>
              <p className="modal-practica-subtitle">
                {esEdicion
                  ? 'Modificación de valores en el catálogo oficial'
                  : 'Registrar nueva práctica en el catálogo odontológico'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-practica-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-practica-form">
          <div className="modal-practica-body">
            {errorMsg && (
              <div className="modal-practica-alerta-error" role="alert">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="modal-practica-form-grid">
              <div className="modal-practica-field modal-practica-col-half">
                <label htmlFor="codigo_nomenclador">
                  Código Nomenclador <span className="campo-requerido">*</span>
                </label>
                <input
                  type="text"
                  id="codigo_nomenclador"
                  name="codigo_nomenclador"
                  placeholder="Ej: 01.01"
                  value={formData.codigo_nomenclador}
                  onChange={handleChange}
                  className="modal-practica-input"
                  maxLength={20}
                  required
                  autoFocus
                />
              </div>

              <div className="modal-practica-field modal-practica-col-half">
                <label htmlFor="precio_referencia">
                  Precio de Referencia <span className="campo-requerido">*</span>
                </label>
                <div className="input-precio-wrapper">
                  <span className="precio-simbolo" aria-hidden="true">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="precio_referencia"
                    name="precio_referencia"
                    placeholder="15000.00"
                    value={formData.precio_referencia}
                    onChange={handleChange}
                    className="modal-practica-input input-precio"
                    required
                  />
                </div>
              </div>

              <div className="modal-practica-field modal-practica-col-full">
                <label htmlFor="nombre_referencia">
                  Nombre de Referencia (Nombre habitual) <span className="campo-requerido">*</span>
                </label>
                <input
                  type="text"
                  id="nombre_referencia"
                  name="nombre_referencia"
                  placeholder="Ej: Consulta / Diagnóstico"
                  value={formData.nombre_referencia}
                  onChange={handleChange}
                  className="modal-practica-input"
                  required
                />
              </div>

              <div className="modal-practica-field modal-practica-col-full">
                <label htmlFor="nombre_nomenclador">
                  Nombre Nomenclador (Oficial descriptivo)
                </label>
                <input
                  type="text"
                  id="nombre_nomenclador"
                  name="nombre_nomenclador"
                  placeholder="Ej: Examen bucal completo, diagnóstico, pronóstico y plan de tratamiento"
                  value={formData.nombre_nomenclador}
                  onChange={handleChange}
                  className="modal-practica-input"
                />
              </div>

              <div className="modal-practica-field modal-practica-col-full">
                <label htmlFor="especialidad">
                  Especialidad
                </label>
                <select
                  id="especialidad"
                  name="especialidad"
                  value={formData.especialidad}
                  onChange={handleChange}
                  className="modal-practica-select"
                >
                  {ESPECIALIDADES.map((esp) => (
                    <option key={esp} value={esp}>
                      {esp}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="modal-practica-actions">
            <button
              type="button"
              className="btn-modal-practica-cancelar bg-[#f87171] hover:bg-[#ef4444] text-white font-medium rounded-xl transition-all shadow-sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-modal-practica-guardar"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Guardando...'
                : esEdicion
                ? 'Guardar Cambios'
                : 'Guardar Práctica'}
            </button>
          </div>
        </form>
      </div>

      <ModalConfirmacion
        isOpen={mostrarConfirmacion}
        onClose={() => !isSubmitting && setMostrarConfirmacion(false)}
        onConfirm={ejecutarGuardado}
        titulo="Confirmar Práctica Odontológica"
        mensaje={`¿Estás seguro de que deseas guardar la práctica "${formData.nombre_referencia.trim()}" con un valor de $ ${Number(formData.precio_referencia || 0).toLocaleString('es-AR')}?`}
        textoCancelar="Cancelar"
        textoConfirmar="Confirmar y Guardar"
        tipo="exito"
        icono={
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2eb086"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <path d="M9 12h6" />
            <path d="M9 16h6" />
            <path d="M9 8h2" />
          </svg>
        }
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default ModalNuevaPractica;
