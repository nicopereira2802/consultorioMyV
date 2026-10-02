import { useState, useEffect } from 'react';
import ToothLogo from './ToothLogo';
import ModalConfirmacion from './ModalConfirmacion';
import { crearPaciente, actualizarPaciente, existePacienteConDni } from '../services/pacientes.service';
import { getObrasSociales } from '../services/obras_sociales.service';
import './ModalPaciente.css';

/**
 * ModalPaciente - Modal para Crear y Editar Pacientes Odontológicos
 * Sincronizado con el esquema relacional de base de datos:
 * PACIENTE: id_paciente, nombre, apellido, dni, fecha_nacimiento, telefono, email, direccion/domicilio
 * PACIENTE_OBRA_SOCIAL: id_obra_social, nro_afiliado
 *
 * @param {boolean} isOpen - Estado de visibilidad del modal
 * @param {function} onClose - Cierre del modal
 * @param {Object|null} paciente - Objeto del paciente a editar, o null para alta nueva
 * @param {function} [onPacienteGuardado] - Callback ejecutado tras guardar con éxito
 */
export const ModalPaciente = ({
  isOpen,
  onClose,
  paciente = null,
  onPacienteGuardado
}) => {
  const esEdicion = Boolean(paciente && paciente.id_paciente);

  const [obrasSociales, setObrasSociales] = useState([]);
  const [isLoadingCatalogos, setIsLoadingCatalogos] = useState(true);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    fecha_nacimiento: '',
    telefono: '',
    email: '',
    direccion: '',
    id_obra_social: 1,
    nro_afiliado: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorAlerta, setErrorAlerta] = useState('');
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [dniDuplicado, setDniDuplicado] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const cargarCatalogos = async () => {
      try {
        setIsLoadingCatalogos(true);
        const listaOS = await getObrasSociales();
        if (isMounted) {
          setObrasSociales(listaOS);
        }
      } catch (err) {
        console.error('Error al cargar obras sociales en ModalPaciente:', err);
      } finally {
        if (isMounted) setIsLoadingCatalogos(false);
      }
    };

    cargarCatalogos();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (esEdicion && paciente) {
      const idOS = paciente.obra_social?.id_obra_social || 1;
      const esPart = Number(idOS) === 1;

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        nombre: paciente.nombre || '',
        apellido: paciente.apellido || '',
        dni: paciente.dni || '',
        fecha_nacimiento: paciente.fecha_nacimiento || '',
        telefono: paciente.telefono || '',
        email: paciente.email || '',
        direccion: paciente.direccion || paciente.domicilio || '',
        id_obra_social: Number(idOS),
        nro_afiliado: esPart ? '' : (paciente.obra_social?.nro_afiliado || '')
      });
    } else {
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
        fecha_nacimiento: '',
        telefono: '',
        email: '',
        direccion: '',
        id_obra_social: 1,
        nro_afiliado: ''
      });
    }

    setErrors({});
    setErrorAlerta('');
    setDniDuplicado(false);
    setIsSubmitting(false);
  }, [isOpen, paciente, esEdicion]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting && !mostrarConfirmacion) {
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
  }, [isOpen, isSubmitting, mostrarConfirmacion, onClose]);

  if (!isOpen) return null;

  const esParticular = Number(formData.id_obra_social) === 1;

  const verificarUnicidadDni = (dniValor) => {
    const cleanDni = String(dniValor || '').trim();
    if (!cleanDni) {
      setDniDuplicado(false);
      setErrors((prev) => {
        if (prev.dni) {
          const next = { ...prev };
          delete next.dni;
          return next;
        }
        return prev;
      });
      return false;
    }

    const idExcluir = esEdicion ? paciente?.id_paciente : null;
    const yaExiste = existePacienteConDni(cleanDni, idExcluir);

    if (yaExiste) {
      setDniDuplicado(true);
      setErrors((prev) => ({
        ...prev,
        dni: `Ya existe un paciente registrado con el DNI ${cleanDni}.`
      }));
      return true;
    } else {
      setDniDuplicado(false);
      setErrors((prev) => {
        if (prev.dni && prev.dni.includes('Ya existe un paciente')) {
          const next = { ...prev };
          delete next.dni;
          return next;
        }
        return prev;
      });
      return false;
    }
  };

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === 'dni' || name === 'telefono') {
      value = value.replace(/\D/g, '');
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'id_obra_social' && Number(value) === 1) {
        updated.nro_afiliado = '';
      }

      return updated;
    });

    if (name === 'dni') {
      verificarUnicidadDni(value);
    } else if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }

    if (errorAlerta) {
      setErrorAlerta('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio.';
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio.';
    }

    if (!formData.telefono || !formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio.';
    }

    const dniLimpio = formData.dni ? formData.dni.replace(/\D/g, '').trim() : '';
    if (dniLimpio) {
      if (dniLimpio.length < 6 || dniLimpio.length > 10) {
        newErrors.dni = 'El DNI debe tener entre 6 y 10 dígitos.';
      }
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'El formato de correo electrónico no es válido.';
      }
    }

    if (!esParticular && !formData.nro_afiliado.trim()) {
      newErrors.nro_afiliado = 'Ingrese el N° de credencial o afiliado.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorAlerta('');

    const dniLimpio = formData.dni ? String(formData.dni).trim() : '';
    const idExcluir = esEdicion ? paciente?.id_paciente : null;

    if (dniLimpio && existePacienteConDni(dniLimpio, idExcluir)) {
      setDniDuplicado(true);
      const msgDuplicado = `Ya existe un paciente registrado con el DNI ${dniLimpio}.`;
      setErrors((prev) => ({ ...prev, dni: msgDuplicado }));
      setErrorAlerta(msgDuplicado);
      return;
    }

    if (!validateForm()) {
      return;
    }

    setMostrarConfirmacion(true);
  };

  const ejecutarGuardado = async () => {
    const dniLimpio = formData.dni ? formData.dni.replace(/\D/g, '').trim() : '';

    try {
      setIsSubmitting(true);
      setErrorAlerta('');

      const telLimpio = (formData.telefono || '').trim();
      const tieneTelefono = Boolean(telLimpio && telLimpio !== 'S/D');

      const payload = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        dni: dniLimpio,
        fecha_nacimiento: formData.fecha_nacimiento || '',
        telefono: telLimpio,
        email: formData.email.trim(),
        direccion: formData.direccion.trim(),
        domicilio: formData.direccion.trim(),
        id_obra_social: Number(formData.id_obra_social),
        nro_afiliado: esParticular ? 'S/N' : formData.nro_afiliado.trim(),
        datos_completos: tieneTelefono
      };

      let pacienteResultado;
      if (esEdicion) {
        pacienteResultado = await actualizarPaciente(paciente.id_paciente, payload);
      } else {
        pacienteResultado = await crearPaciente(payload);
      }

      setMostrarConfirmacion(false);

      if (onPacienteGuardado) {
        await onPacienteGuardado(pacienteResultado, esEdicion ? 'editado' : 'creado');
      }

      onClose();
    } catch (err) {
      console.error('Error al guardar paciente:', err);
      const msg = err?.message || 'Ocurrió un error al guardar los datos del paciente.';
      setErrorAlerta(msg);
      setMostrarConfirmacion(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-paciente-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-paciente-titulo"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="modal-paciente-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-paciente-header">
          <div className="modal-paciente-title-group">
            <div className="modal-paciente-icon-badge" aria-hidden="true">
              <ToothLogo size={36} />
            </div>
            <div>
              <h2 id="modal-paciente-titulo" className="modal-paciente-title">
                {esEdicion ? 'Editar Paciente' : 'Nuevo Paciente'}
              </h2>
              {esEdicion && (
                <p className="modal-paciente-subtitle">
                  {paciente.apellido}, {paciente.nombre} (DNI: {paciente.dni})
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            className="modal-paciente-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-paciente-form" noValidate>
          <div className="modal-paciente-body">
            {esEdicion && paciente?.datos_completos === false && (
              <div className="modal-paciente-banner-incompleto" role="status">
                Paciente con ficha incompleta. Completa su teléfono o datos de contacto para consolidar su ficha.
              </div>
            )}

            {errorAlerta && (
              <div className="modal-paciente-alerta-error" role="alert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorAlerta}</span>
              </div>
            )}

            <div className="modal-paciente-row">
              <div className="modal-paciente-field">
                <label htmlFor="input-paciente-nombre">
                  Nombre <span className="asterisco-obligatorio">*</span>
                </label>
                <input
                  type="text"
                  id="input-paciente-nombre"
                  name="nombre"
                  className={`modal-paciente-input ${errors.nombre ? 'is-invalid' : ''}`}
                  placeholder="Ej: Valeria"
                  value={formData.nombre}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.nombre && <span className="campo-error-msg">{errors.nombre}</span>}
              </div>

              <div className="modal-paciente-field">
                <label htmlFor="input-paciente-apellido">
                  Apellido <span className="asterisco-obligatorio">*</span>
                </label>
                <input
                  type="text"
                  id="input-paciente-apellido"
                  name="apellido"
                  className={`modal-paciente-input ${errors.apellido ? 'is-invalid' : ''}`}
                  placeholder="Ej: Rossi"
                  value={formData.apellido}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.apellido && <span className="campo-error-msg">{errors.apellido}</span>}
              </div>
            </div>

            <div className="modal-paciente-row">
              <div className="modal-paciente-field">
                <label htmlFor="input-paciente-dni">
                  DNI
                </label>
                <input
                  type="text"
                  id="input-paciente-dni"
                  name="dni"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={`modal-paciente-input ${errors.dni || dniDuplicado ? 'is-invalid' : ''}`}
                  style={dniDuplicado ? { borderColor: '#ef4444' } : undefined}
                  placeholder="Ej: 38452190"
                  value={formData.dni}
                  onChange={handleChange}
                  onBlur={() => verificarUnicidadDni(formData.dni)}
                  disabled={isSubmitting}
                />
                {errors.dni && (
                  <span
                    className="campo-error-msg"
                    style={dniDuplicado ? { color: '#ef4444', fontWeight: 600 } : undefined}
                  >
                    {errors.dni}
                  </span>
                )}
              </div>

              <div className="modal-paciente-field">
                <label htmlFor="input-paciente-nacimiento">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  id="input-paciente-nacimiento"
                  name="fecha_nacimiento"
                  className="modal-paciente-input"
                  value={formData.fecha_nacimiento}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="modal-paciente-row">
              <div className="modal-paciente-field">
                <label htmlFor="input-paciente-telefono">
                  Teléfono <span className="asterisco-obligatorio">*</span>
                </label>
                <input
                  type="tel"
                  id="input-paciente-telefono"
                  name="telefono"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={`modal-paciente-input ${errors.telefono ? 'is-invalid' : ''}`}
                  placeholder="Ej: 1145238899"
                  value={formData.telefono}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.telefono && <span className="campo-error-msg">{errors.telefono}</span>}
              </div>

              <div className="modal-paciente-field">
                <label htmlFor="input-paciente-email">
                  Email
                </label>
                <input
                  type="email"
                  id="input-paciente-email"
                  name="email"
                  className={`modal-paciente-input ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="Ej: paciente@correo.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.email && <span className="campo-error-msg">{errors.email}</span>}
              </div>
            </div>

            <div className="modal-paciente-field">
              <label htmlFor="input-paciente-direccion">
                Domicilio
              </label>
              <input
                type="text"
                id="input-paciente-direccion"
                name="direccion"
                className="modal-paciente-input"
                placeholder="Ej: Av. Colón 1234, CABA"
                value={formData.direccion}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="modal-paciente-row">
              <div className="modal-paciente-field">
                <label htmlFor="select-paciente-os">
                  Obra Social <span className="asterisco-obligatorio">*</span>
                </label>
                <select
                  id="select-paciente-os"
                  name="id_obra_social"
                  className="modal-paciente-select"
                  value={formData.id_obra_social}
                  onChange={handleChange}
                  disabled={isSubmitting || isLoadingCatalogos}
                  required
                >
                  {obrasSociales.map((os) => (
                    <option key={os.id_obra_social} value={os.id_obra_social}>
                      {os.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-paciente-field">
                <label htmlFor="input-paciente-afiliado">
                  N° de Afiliado {!esParticular && <span className="asterisco-obligatorio">*</span>}
                </label>
                <input
                  type="text"
                  id="input-paciente-afiliado"
                  name="nro_afiliado"
                  className={`modal-paciente-input ${errors.nro_afiliado ? 'is-invalid' : ''}`}
                  placeholder={esParticular ? 'S/N' : 'Ej: 12345678-01'}
                  value={esParticular ? 'S/N' : formData.nro_afiliado}
                  onChange={handleChange}
                  disabled={isSubmitting || esParticular}
                />
                {errors.nro_afiliado && !esParticular && (
                  <span className="campo-error-msg">{errors.nro_afiliado}</span>
                )}
              </div>
            </div>
          </div>

          <div className="modal-paciente-actions">
            <button
              type="button"
              className="btn-modal-paciente-cancelar btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-modal-paciente-confirmar btn-primary"
              disabled={isSubmitting || isLoadingCatalogos || dniDuplicado}
            >
              {isSubmitting
                ? 'Guardando...'
                : (esEdicion ? 'Guardar Cambios' : 'Registrar Paciente')}
            </button>
          </div>
        </form>
      </div>

      <ModalConfirmacion
        isOpen={mostrarConfirmacion}
        onClose={() => setMostrarConfirmacion(false)}
        onConfirm={ejecutarGuardado}
        titulo={esEdicion ? "¿Deseas guardar las modificaciones?" : "¿Deseas registrar este nuevo paciente?"}
        mensaje={
          esEdicion
            ? "Se actualizarán los datos de contacto y cobertura médica del paciente en el sistema."
            : `Se dará de alta la ficha clínica para ${formData.nombre.trim()} ${formData.apellido.trim()} (DNI: ${formData.dni.replace(/\D/g, '').trim()}) en el sistema.`
        }
        textoCancelar={esEdicion ? "Cancelar / Seguir editando" : "Cancelar / Revisar datos"}
        textoConfirmar={esEdicion ? "Confirmar y Guardar" : "Confirmar y Registrar"}
        tipo="exito"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default ModalPaciente;
