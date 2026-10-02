import { useEffect } from 'react';
import ToothLogo from './ToothLogo';
import './ModalFichaPaciente.css';

/**
 * ModalFichaPaciente - Ficha de Consulta de Datos del Paciente (Solo Lectura)
 *
 * Muestra detalladamente los datos registrados en el sistema:
 * - Datos Personales: Nombre completo, DNI, Fecha de Nacimiento y Edad calculada
 * - Contacto: Teléfono, Correo Electrónico y Domicilio
 * - Cobertura Médica: Obra Social / Prepaga y N° de Afiliado
 *
 * @param {boolean} isOpen - Visibilidad del modal
 * @param {function} onClose - Handler para cerrar el modal
 * @param {Object} paciente - Registro del paciente seleccionado
 * @param {function} onEditar - Handler para abrir el formulario de edición
 */
export const ModalFichaPaciente = ({
  isOpen,
  onClose,
  paciente,
  onEditar
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
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
  }, [isOpen, onClose]);

  if (!isOpen || !paciente) return null;

  const calcularEdad = (fechaNacStr) => {
    if (!fechaNacStr) return null;
    const fechaNac = new Date(fechaNacStr);
    if (isNaN(fechaNac.getTime())) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const m = hoy.getMonth() - fechaNac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    return edad >= 0 ? edad : null;
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'No especificada';
    const partes = String(fechaStr).split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaStr;
  };

  const edad = calcularEdad(paciente.fecha_nacimiento);
  const fechaNacTexto = paciente.fecha_nacimiento
    ? (edad !== null
        ? `${formatearFecha(paciente.fecha_nacimiento)} (${edad} años)`
        : formatearFecha(paciente.fecha_nacimiento))
    : 'No registrada';

  const obraSocialNombre = paciente.obra_social?.nombre || 'Particular';
  const esParticular =
    !paciente.obra_social ||
    obraSocialNombre.toLowerCase() === 'particular' ||
    Number(paciente.obra_social?.id_obra_social) === 1;

  const nroAfiliado = esParticular
    ? 'Particular / Sin cobertura'
    : (paciente.obra_social?.nro_afiliado && paciente.obra_social.nro_afiliado !== 'S/N'
        ? paciente.obra_social.nro_afiliado
        : 'Sin número registrado');

  const domicilioTexto = paciente.domicilio || paciente.direccion || 'No especificado';
  const emailTexto = paciente.email || 'No registrado';
  const telefonoTexto = paciente.telefono || 'No registrado';

  const handleModificar = () => {
    onClose();
    if (onEditar) {
      onEditar(paciente);
    }
  };

  return (
    <div
      className="modal-ficha-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-ficha-title"
      onClick={onClose}
    >
      <div
        className="modal-ficha-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-ficha-header">
          <div className="modal-ficha-branding">
            <div className="modal-ficha-logo-badge" aria-hidden="true">
              <ToothLogo size={36} />
            </div>
            <div>
              <h2 id="modal-ficha-title" className="modal-ficha-title">
                Ficha del Paciente
              </h2>
              <p className="modal-ficha-subtitle">
                ID #{paciente.id_paciente} &bull; Registro Clínico Oficial
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-ficha-close-btn"
            onClick={onClose}
            aria-label="Cerrar ficha"
          >
            ✕
          </button>
        </div>

        <div className="modal-ficha-body">
          <div className="ficha-patient-banner">
            <div className="ficha-avatar-initials" aria-hidden="true">
              {(paciente.nombre?.[0] || 'P').toUpperCase()}
              {(paciente.apellido?.[0] || '').toUpperCase()}
            </div>
            <div className="ficha-banner-info">
              <h3 className="ficha-patient-fullname">
                {paciente.apellido ? `${paciente.apellido}, ${paciente.nombre}` : paciente.nombre}
              </h3>
              <div className="ficha-banner-badges">
                <span className="ficha-dni-badge">
                  DNI: {paciente.dni}
                </span>
                <span className={`ficha-os-badge ${esParticular ? 'badge-particular' : 'badge-prepaga'}`}>
                  {obraSocialNombre}
                </span>
                {paciente.datos_completos === false && (
                  <span className="badge-paciente-incompleto" title="Ficha con datos pendientes de completar">
                    • Incompleto
                  </span>
                )}
              </div>
            </div>
          </div>

          <section className="ficha-section">
            <div className="ficha-section-header">
              <span className="ficha-section-icon" aria-hidden="true">👤</span>
              <h4 className="ficha-section-title">Datos Personales</h4>
            </div>
            <div className="ficha-grid">
              <div className="ficha-field-item">
                <span className="ficha-field-label">Nombre y Apellido</span>
                <span className="ficha-field-val">
                  {paciente.nombre} {paciente.apellido}
                </span>
              </div>
              <div className="ficha-field-item">
                <span className="ficha-field-label">DNI / Documento</span>
                <span className="ficha-field-val font-tabular">
                  {paciente.dni}
                </span>
              </div>
              <div className="ficha-field-item ficha-field-full">
                <span className="ficha-field-label">Fecha de Nacimiento y Edad</span>
                <span className="ficha-field-val">
                  {fechaNacTexto}
                </span>
              </div>
            </div>
          </section>

          <section className="ficha-section">
            <div className="ficha-section-header">
              <span className="ficha-section-icon" aria-hidden="true">📞</span>
              <h4 className="ficha-section-title">Contacto</h4>
            </div>
            <div className="ficha-grid">
              <div className="ficha-field-item">
                <span className="ficha-field-label">Teléfono / WhatsApp</span>
                <span className="ficha-field-val font-tabular">
                  {telefonoTexto}
                </span>
              </div>
              <div className="ficha-field-item">
                <span className="ficha-field-label">Correo Electrónico</span>
                <span className="ficha-field-val">
                  {emailTexto}
                </span>
              </div>
              <div className="ficha-field-item ficha-field-full">
                <span className="ficha-field-label">Domicilio</span>
                <span className="ficha-field-val">
                  {domicilioTexto}
                </span>
              </div>
            </div>
          </section>

          <section className="ficha-section">
            <div className="ficha-section-header">
              <span className="ficha-section-icon" aria-hidden="true">🛡️</span>
              <h4 className="ficha-section-title">Cobertura Médica</h4>
            </div>
            <div className="ficha-grid">
              <div className="ficha-field-item">
                <span className="ficha-field-label">Obra Social / Prepaga</span>
                <span className="ficha-field-val font-semibold">
                  {obraSocialNombre}
                </span>
              </div>
              <div className="ficha-field-item">
                <span className="ficha-field-label">N° de Afiliado / Credencial</span>
                <span className="ficha-field-val font-tabular">
                  {nroAfiliado}
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="modal-ficha-footer">
          <button
            type="button"
            className="btn-ficha-cerrar btn-secondary"
            onClick={onClose}
          >
            Cerrar
          </button>

          <button
            type="button"
            className="btn-ficha-modificar btn-primary"
            onClick={handleModificar}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>Modificar Datos</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalFichaPaciente;
