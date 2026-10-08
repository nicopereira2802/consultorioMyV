import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ModalConfirmacion from './ModalConfirmacion';
import api from '../services/api';
import { crearPaciente, actualizarPaciente, existePacienteConDni } from '../services/pacientes.service';
import { getObrasSociales } from '../services/obras_sociales.service';
import pacienteSchema from '../schemas/paciente.schema';
import './ModalPaciente.css';

/**
 * ModalPaciente - Modal para Crear y Editar Pacientes Odontológicos
 * Sincronizado con el esquema relacional de base de datos:
 * PACIENTE: id_paciente, nombre, apellido, dni, fecha_nacimiento, telefono, direccion/domicilio
 * PACIENTE_OBRA_SOCIAL: id_obra_social, nro_afiliado
 *
 * @param {boolean} isOpen - Estado de visibilidad del modal
 * @param {function} onClose - Cierre del modal
 * @param {Object|null} paciente - Objeto del paciente a editar, o null para alta nueva
 * @param {function} [onPacienteGuardado] - Callback ejecutado tras guardar con éxito
 * @param {function} [onSuccess] - Callback opcional tras éxito
 */
export const ModalPaciente = ({
  isOpen,
  onClose,
  paciente = null,
  onPacienteGuardado,
  onSuccess
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
    direccion: '',
    obras_sociales: [],
    id_obra_social: 1,
    nro_afiliado: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorAlerta, setErrorAlerta] = useState('');
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [dniDuplicado, setDniDuplicado] = useState(false);
  const [idPacienteInactivo, setIdPacienteInactivo] = useState(null);
  const [pacienteInactivoData, setPacienteInactivoData] = useState(null);
  const [showModalReactivar, setShowModalReactivar] = useState(false);

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
      let initialObrasSociales = [];
      const rawList =
        Array.isArray(paciente.obras_sociales) && paciente.obras_sociales.length > 0
          ? paciente.obras_sociales
          : Array.isArray(paciente.ObraSocials) && paciente.ObraSocials.length > 0
            ? paciente.ObraSocials
            : [];

      if (rawList.length > 0) {
        initialObrasSociales = rawList
          .filter((os) => {
            const activoGeneral = os.activo !== false && os.activo !== 0;
            const activoIntermedia =
              os.PacienteObraSocial?.activo !== false && os.PacienteObraSocial?.activo !== 0;
            return activoGeneral && activoIntermedia && Number(os.id_obra_social) > 1;
          })
          .map((os) => ({
            id_obra_social: Number(os.id_obra_social),
            nro_afiliado: os.nro_afiliado || os.PacienteObraSocial?.nro_afiliado || ''
          }));
      } else if (paciente.obra_social && typeof paciente.obra_social === 'object') {
        const idOS = Number(paciente.obra_social.id_obra_social);
        if (idOS && idOS > 1) {
          initialObrasSociales = [
            {
              id_obra_social: idOS,
              nro_afiliado:
                paciente.obra_social.nro_afiliado ||
                paciente.obra_social.PacienteObraSocial?.nro_afiliado ||
                ''
            }
          ];
        }
      } else if (paciente.id_obra_social && Number(paciente.id_obra_social) > 1) {
        initialObrasSociales = [
          {
            id_obra_social: Number(paciente.id_obra_social),
            nro_afiliado: paciente.nro_afiliado || ''
          }
        ];
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        nombre: paciente.nombre || '',
        apellido: paciente.apellido || '',
        dni: paciente.dni || '',
        fecha_nacimiento: paciente.fecha_nacimiento || '',
        telefono: paciente.telefono || '',
        direccion: paciente.direccion || paciente.domicilio || '',
        obras_sociales: initialObrasSociales,
        id_obra_social: initialObrasSociales.length > 0 ? initialObrasSociales[0].id_obra_social : 1,
        nro_afiliado: initialObrasSociales.length > 0 ? initialObrasSociales[0].nro_afiliado : ''
      });
    } else {
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
        fecha_nacimiento: '',
        telefono: '',
        direccion: '',
        obras_sociales: [],
        id_obra_social: 1,
        nro_afiliado: ''
      });
    }

    setErrors({});
    setErrorAlerta('');
    setDniDuplicado(false);
    setIdPacienteInactivo(null);
    setPacienteInactivoData(null);
    setShowModalReactivar(false);
    setIsSubmitting(false);
  }, [isOpen, paciente, esEdicion]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === 'Escape' &&
        isOpen &&
        !isSubmitting &&
        !mostrarConfirmacion &&
        !showModalReactivar
      ) {
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
  }, [isOpen, isSubmitting, mostrarConfirmacion, showModalReactivar, onClose]);

  if (!isOpen) return null;

  const catalogoObrasSociales = obrasSociales.filter(
    (os) => Number(os.id_obra_social) > 1 && os.activo !== false
  );

  const handleAgregarObraSocial = () => {
    const idsSeleccionados = new Set(
      formData.obras_sociales.map((os) => Number(os.id_obra_social))
    );
    const siguienteDisponible = catalogoObrasSociales.find(
      (os) => !idsSeleccionados.has(Number(os.id_obra_social))
    );

    if (!siguienteDisponible) return;

    setFormData((prev) => {
      const nuevasOS = [
        ...prev.obras_sociales,
        {
          id_obra_social: siguienteDisponible.id_obra_social,
          nro_afiliado: ''
        }
      ];
      return {
        ...prev,
        obras_sociales: nuevasOS,
        id_obra_social: nuevasOS[0]?.id_obra_social || 1,
        nro_afiliado: nuevasOS[0]?.nro_afiliado || ''
      };
    });
  };

  const handleCambiarObraSocial = (index, nuevoId) => {
    setFormData((prev) => {
      const actualizadas = [...prev.obras_sociales];
      actualizadas[index] = {
        ...actualizadas[index],
        id_obra_social: Number(nuevoId)
      };
      return {
        ...prev,
        obras_sociales: actualizadas,
        id_obra_social: actualizadas[0]?.id_obra_social || 1,
        nro_afiliado: actualizadas[0]?.nro_afiliado || ''
      };
    });
  };

  const handleCambiarNroAfiliado = (index, valor) => {
    setFormData((prev) => {
      const actualizadas = [...prev.obras_sociales];
      actualizadas[index] = {
        ...actualizadas[index],
        nro_afiliado: valor
      };
      return {
        ...prev,
        obras_sociales: actualizadas,
        nro_afiliado: actualizadas[0]?.nro_afiliado || ''
      };
    });
  };

  const handleEliminarObraSocial = (indexParaEliminar) => {
    setFormData((prev) => {
      const actualizadas = prev.obras_sociales.filter((_, index) => index !== indexParaEliminar);
      return {
        ...prev,
        obras_sociales: actualizadas,
        id_obra_social: actualizadas[0]?.id_obra_social || 1,
        nro_afiliado: actualizadas[0]?.nro_afiliado || ''
      };
    });
  };

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorAlerta('');

    const validacion = pacienteSchema.safeParse(formData);
    if (!validacion.success) {
      const nuevosErrores = {};
      const mensajes = [];
      validacion.error.issues.forEach((issue) => {
        const campo = issue.path[0];
        if (campo && !nuevosErrores[campo]) {
          nuevosErrores[campo] = issue.message;
        }
        mensajes.push(issue.message);
      });
      setErrors((prev) => ({ ...prev, ...nuevosErrores }));
      setErrorAlerta(mensajes[0] || 'Por favor verifica los datos ingresados.');
      return;
    }

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
        direccion: formData.direccion.trim(),
        domicilio: formData.direccion.trim(),
        obras_sociales: formData.obras_sociales,
        id_obra_social: formData.obras_sociales.length > 0 ? Number(formData.obras_sociales[0].id_obra_social) : 1,
        nro_afiliado: formData.obras_sociales.length > 0 ? (formData.obras_sociales[0].nro_afiliado || 'S/N') : 'S/N',
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
      const status = err?.response?.status;
      const resData = err?.response?.data;

      if (status === 409 && (resData?.puedeReactivar || resData?.id_paciente)) {
        setMostrarConfirmacion(false);
        const idParaReactivar = err.response?.data?.id_paciente;
        setIdPacienteInactivo(idParaReactivar);
        setPacienteInactivoData(resData);
        setErrorAlerta('');
        setShowModalReactivar(true);
        return;
      }

      const msg = err?.userMessage || err?.message || 'Ocurrió un error al guardar los datos del paciente.';
      setErrorAlerta(msg);
      setMostrarConfirmacion(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmarReactivacion = async () => {
    try {
      setIsSubmitting(true);
      const cleanDni = formData.dni ? formData.dni.replace(/\D/g, '').trim() : '';
      const telLimpio = (formData.telefono || '').trim();
      const tieneTelefono = Boolean(telLimpio && telLimpio !== 'S/D');

      const payload = {
        ...formData,
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        dni: cleanDni,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        telefono: telLimpio,
        direccion: formData.direccion.trim(),
        domicilio: formData.direccion.trim(),
        obras_sociales: formData.obras_sociales,
        id_obra_social: formData.obras_sociales.length > 0 ? Number(formData.obras_sociales[0].id_obra_social) : 1,
        nro_afiliado: formData.obras_sociales.length > 0 ? (formData.obras_sociales[0].nro_afiliado || 'S/N') : 'S/N',
        datos_completos: tieneTelefono
      };

      // Llamada con el id correcto y los datos del formulario actualizados
      await api.patch(`/pacientes/${idPacienteInactivo}/reactivar`, payload);

      // Cerrar el diálogo de confirmación y el modal principal
      setShowModalReactivar(false);
      if (onSuccess) await onSuccess(payload, 'reactivado');
      if (onPacienteGuardado) await onPacienteGuardado(payload, 'reactivado');
      if (onClose) onClose();
    } catch (error) {
      console.error("Error al reactivar:", error);
      alert("No se pudo reactivar el paciente. Revisa la consola.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-paciente-overlay min-h-screen w-full flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-paciente-titulo"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="modal-paciente-card bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-paciente-header">
          <div className="modal-paciente-title-group">
            <div className="modal-paciente-icon-badge" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2eb086"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
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

            <div className="modal-paciente-coberturas-seccion">
              <div className="modal-paciente-coberturas-header">
                <div>
                  <label className="modal-paciente-coberturas-label">
                    Obras Sociales / Coberturas
                  </label>
                  <p className="modal-paciente-coberturas-subtexto">
                    {formData.obras_sociales.length === 0
                      ? 'Sin cobertura cargada (Atención Particular)'
                      : `${formData.obras_sociales.length} cobertura${formData.obras_sociales.length > 1 ? 's' : ''} asignada${formData.obras_sociales.length > 1 ? 's' : ''}`}
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-paciente-btn-agregar-os"
                  onClick={handleAgregarObraSocial}
                  disabled={isSubmitting || isLoadingCatalogos || formData.obras_sociales.length >= catalogoObrasSociales.length}
                  title={
                    formData.obras_sociales.length >= catalogoObrasSociales.length
                      ? 'Todas las obras sociales disponibles ya fueron agregadas'
                      : 'Agregar nueva cobertura médica'
                  }
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Agregar Obra Social</span>
                </button>
              </div>

              {formData.obras_sociales.length === 0 ? (
                <div className="modal-paciente-coberturas-vacio">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="18" y1="8" x2="23" y2="13" />
                    <line x1="23" y1="8" x2="18" y2="13" />
                  </svg>
                  <span>Sin cobertura cargada (Atención Particular)</span>
                </div>
              ) : (
                <div className="modal-paciente-coberturas-lista">
                  {formData.obras_sociales.map((osItem, index) => {
                    const idsSeleccionados = new Set(
                      formData.obras_sociales
                        .filter((_, i) => i !== index)
                        .map((os) => Number(os.id_obra_social))
                    );

                    return (
                      <div key={index} className="modal-paciente-cobertura-fila flex items-center gap-2 sm:gap-3 w-full">
                        <div className="modal-paciente-cobertura-campo-os flex-1 min-w-0">
                          <label htmlFor={`select-os-${index}`} className="sr-only">
                            Obra Social {index + 1}
                          </label>
                          <select
                            id={`select-os-${index}`}
                            className="modal-paciente-select modal-paciente-select-os w-full"
                            value={osItem.id_obra_social}
                            onChange={(e) => handleCambiarObraSocial(index, e.target.value)}
                            disabled={isSubmitting}
                          >
                            {catalogoObrasSociales.map((os) => {
                              const yaElegida = idsSeleccionados.has(Number(os.id_obra_social));
                              return (
                                <option
                                  key={os.id_obra_social}
                                  value={os.id_obra_social}
                                  disabled={yaElegida}
                                >
                                  {os.nombre} {yaElegida ? '(Ya agregada)' : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="modal-paciente-cobertura-campo-afiliado flex-1 min-w-0">
                          <label htmlFor={`input-afiliado-${index}`} className="sr-only">
                            N° de Afiliado {index + 1}
                          </label>
                          <input
                            type="text"
                            id={`input-afiliado-${index}`}
                            className="modal-paciente-input modal-paciente-input-afiliado w-full"
                            placeholder="N° de afiliado / credencial"
                            value={osItem.nro_afiliado}
                            onChange={(e) => handleCambiarNroAfiliado(index, e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEliminarObraSocial(index)}
                          title="Quitar obra social"
                          disabled={isSubmitting}
                          className="shrink-0 h-11 w-11 flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 border border-rose-200/80 transition-all duration-150 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-5 h-5 stroke-[2.2]"/>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="modal-paciente-actions">
            <button
              type="button"
              className="btn-modal-paciente-cancelar btn-secondary bg-[#f87171] hover:bg-[#ef4444] text-white font-medium rounded-xl transition-all shadow-sm"
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

      <ModalConfirmacion
        isOpen={showModalReactivar}
        onClose={() => setShowModalReactivar(false)}
        onConfirm={handleConfirmarReactivacion}
        titulo="Reactivar Paciente Inactivo"
        mensaje={`El paciente ${pacienteInactivoData?.apellido || ''}, ${pacienteInactivoData?.nombre || ''} (DNI: ${formData.dni}) se encuentra registrado en el historial como inactivo. ¿Deseas reactivar su ficha y actualizar sus datos?`}
        textoCancelar="Cancelar / No reactivar"
        textoConfirmar="Confirmar y Reactivar"
        tipo="petroleo"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default ModalPaciente;
