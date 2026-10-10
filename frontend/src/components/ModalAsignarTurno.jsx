import { useState, useEffect } from 'react';
import ToothLogo from './ToothLogo';
import { getPacientes } from '../services/pacientes.service';
import { getPracticas } from '../services/practicas.service';
import ModalPaciente from './ModalPaciente';
import turnoSchema from '../schemas/turno.schema';
import {
  getTurnosDia,
  getHorasOcupadasDia,
  haySuperposicionTurnos,
  sumarMinutosAHora,
  horaAMinutos
} from '../services/turnos.service';
import './ModalAsignarTurno.css';

const HORA_MINIMA = '08:00';
const HORA_MAXIMA = '20:00';

const formatearHora = (hora) => {
  if (!hora) return '09:00';
  const partes = String(hora).trim().split(':');
  if (partes.length < 2) return '09:00';
  const hh = String(partes[0]).padStart(2, '0');
  const mm = String(partes[1]).padStart(2, '0');
  return `${hh}:${mm}`;
};

/**
 * ModalAsignarTurno - Modal para agendar y registrar turnos odontológicos
 * Soporta dos modalidades:
 * 1. Desde un hueco específico de la grilla (slotData preconfigurado)
 * 2. Desde el acceso global "+ Nuevo Turno" (modo libre con selector dinámico de horarios)
 */
export const ModalAsignarTurno = ({
  isOpen,
  onClose,
  onAsignarTurno,
  slotData = null,
  fechaSeleccionada = '',
  modoLibre = false
}) => {
  const esModoLibre = Boolean(modoLibre || !slotData);
  const fechaHoyStr = new Date().toLocaleDateString('en-CA');

  const [pacientes, setPacientes] = useState([]);
  const [practicas, setPracticas] = useState([]);
  const [isLoadingCatalogos, setIsLoadingCatalogos] = useState(true);

  const [fechaTurno, setFechaTurno] = useState(fechaHoyStr);
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [duracionMinutos, setDuracionMinutos] = useState(30);
  const [duracionMaxIntervalo, setDuracionMaxIntervalo] = useState(null);
  const [turnosDelDia, setTurnosDelDia] = useState([]);
  const [horariosOcupados, setHorariosOcupados] = useState(new Set());
  const [isLoadingHorarios, setIsLoadingHorarios] = useState(false);

  const [idPacienteSeleccionado, setIdPacienteSeleccionado] = useState('');
  const [idPracticaSeleccionada, setIdPracticaSeleccionada] = useState('');
  const [notasConsulta, setNotasConsulta] = useState('');

  const [isModalCrearPacienteOpen, setIsModalCrearPacienteOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const today = new Date().toLocaleDateString('en-CA');
    const fInicial = slotData?.fecha || fechaSeleccionada || today;
    const fVal = fInicial >= today ? fInicial : today;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFechaTurno(fVal);

    if (slotData?.hora) {
      setHoraInicio(formatearHora(slotData.hora));
    } else {
      setHoraInicio('09:00');
    }

    const maxIntervalo = slotData?.duracionMaxIntervalo
      ? Number(slotData.duracionMaxIntervalo)
      : (slotData?.horaFin && slotData?.hora
          ? horaAMinutos(slotData.horaFin) - horaAMinutos(slotData.hora)
          : null);
    setDuracionMaxIntervalo(maxIntervalo);

    let durInicial = 30;
    if (slotData?.duracionMinutos) {
      durInicial = Number(slotData.duracionMinutos);
    } else if (slotData?.duracion) {
      durInicial = Number(slotData.duracion);
    }
    if (maxIntervalo && durInicial > maxIntervalo) {
      durInicial = maxIntervalo;
    }
    durInicial = Math.max(15, durInicial);
    setDuracionMinutos(durInicial);

    setErrorMsg('');
    setIsModalCrearPacienteOpen(false);
  }, [isOpen, slotData, fechaSeleccionada]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const cargarCatalogos = async () => {
      try {
        setIsLoadingCatalogos(true);
        const [pacList, pracList] = await Promise.all([
          getPacientes(true),
          getPracticas(true)
        ]);

        if (!isMounted) return;
        const practicasActivas = (Array.isArray(pracList) ? pracList : []).filter(
          (p) => p.activo !== false && p.activo !== 0 && p.estado !== 'INACTIVO'
        );
        setPacientes(pacList);
        setPracticas(practicasActivas);

        if (pacList.length > 0) {
          setIdPacienteSeleccionado(pacList[0].id_paciente);
        }

        if (practicasActivas.length > 0) {
          const defaultPrac = practicasActivas[0];
          setIdPracticaSeleccionada(defaultPrac.id_practica);
          if (!slotData?.duracionMinutos && !slotData?.duracion && defaultPrac.duracion_minutos) {
            setDuracionMinutos(defaultPrac.duracion_minutos);
          }
        }
      } catch (err) {
        console.error('Error al inicializar catálogos:', err);
      } finally {
        if (isMounted) setIsLoadingCatalogos(false);
      }
    };

    cargarCatalogos();

    return () => {
      isMounted = false;
    };
  }, [isOpen, slotData]);

  useEffect(() => {
    if (!isOpen || !fechaTurno) return;

    let isMounted = true;
    const consultarDisponibilidad = async () => {
      try {
        setIsLoadingHorarios(true);
        const turnos = await getTurnosDia(fechaTurno);
        if (!isMounted) return;
        setTurnosDelDia(turnos);

        const ocupados = getHorasOcupadasDia(turnos);
        setHorariosOcupados(ocupados);
      } catch (err) {
        console.error('Error al consultar disponibilidad horaria:', err);
      } finally {
        if (isMounted) setIsLoadingHorarios(false);
      }
    };

    consultarDisponibilidad();

    return () => {
      isMounted = false;
    };
  }, [isOpen, fechaTurno]);

  const maxDuracionPermitida = (() => {
    const diffConFin = slotData?.horaFin && horaInicio
      ? horaAMinutos(slotData.horaFin) - horaAMinutos(horaInicio)
      : null;
    const caps = [180];
    if (duracionMaxIntervalo) caps.push(duracionMaxIntervalo);
    if (diffConFin !== null && diffConFin > 0) caps.push(diffConFin);
    return Math.min(...caps);
  })();

  const handlePracticaChange = (e) => {
    const idPrac = Number(e.target.value);
    setIdPracticaSeleccionada(idPrac);
    const pracObj = practicas.find((p) => Number(p.id_practica) === idPrac);
    if (pracObj && pracObj.duracion_minutos) {
      setDuracionMinutos(Math.min(pracObj.duracion_minutos, maxDuracionPermitida));
    }
  };

  const handleRestar15Min = () => {
    const minsActuales = horaAMinutos(horaInicio);
    const minPermitido = horaAMinutos(HORA_MINIMA);
    if (minsActuales <= minPermitido) return;
    const nuevosMins = Math.max(minPermitido, minsActuales - 15);
    setHoraInicio(sumarMinutosAHora('00:00', nuevosMins));
    if (slotData?.horaFin) {
      const diffConFin = horaAMinutos(slotData.horaFin) - nuevosMins;
      const caps = [180];
      if (duracionMaxIntervalo) caps.push(duracionMaxIntervalo);
      if (diffConFin > 0) caps.push(diffConFin);
      const nuevoMax = Math.min(...caps);
      if (duracionMinutos > nuevoMax) {
        setDuracionMinutos(Math.max(15, nuevoMax));
      }
    }
  };

  const handleSumar15Min = () => {
    const minsActuales = horaAMinutos(horaInicio);
    const maxPermitido = horaAMinutos(HORA_MAXIMA);
    if (minsActuales >= maxPermitido) return;
    const nuevosMins = Math.min(maxPermitido, minsActuales + 15);
    setHoraInicio(sumarMinutosAHora('00:00', nuevosMins));
    if (slotData?.horaFin) {
      const diffConFin = horaAMinutos(slotData.horaFin) - nuevosMins;
      const caps = [180];
      if (duracionMaxIntervalo) caps.push(duracionMaxIntervalo);
      if (diffConFin > 0) caps.push(diffConFin);
      const nuevoMax = Math.min(...caps);
      if (duracionMinutos > nuevoMax) {
        setDuracionMinutos(Math.max(15, nuevoMax));
      }
    }
  };

  const isRestarDisabled = horaAMinutos(horaInicio) <= horaAMinutos(HORA_MINIMA);
  const isSumarDisabled = horaAMinutos(horaInicio) >= horaAMinutos(HORA_MAXIMA);

  const handleRestarDuracion = () => {
    setDuracionMinutos((prev) => Math.max(15, prev - 15));
  };

  const handleSumarDuracion = () => {
    setDuracionMinutos((prev) => Math.min(maxDuracionPermitida, prev + 15));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting && !isModalCrearPacienteOpen) {
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
  }, [isOpen, isSubmitting, isModalCrearPacienteOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
  }, [isOpen, isModalCrearPacienteOpen]);

  if (!isOpen) return null;

  const horaFinCalculada = horaInicio ? sumarMinutosAHora(horaInicio, duracionMinutos) : '';

  const tieneConflicto = Boolean(
    horaInicio && (
      horariosOcupados.has(horaInicio) ||
      (duracionMinutos && haySuperposicionTurnos(turnosDelDia, horaInicio, duracionMinutos))
    )
  );

  const handlePacienteCreado = async (nuevoPac) => {
    if (!nuevoPac) return;

    setPacientes((prev) => {
      const existe = prev.some((p) => Number(p.id_paciente) === Number(nuevoPac.id_paciente));
      return existe ? prev : [nuevoPac, ...prev];
    });
    setIdPacienteSeleccionado(nuevoPac.id_paciente);
    setIsModalCrearPacienteOpen(false);

    try {
      const listaActualizada = await getPacientes();
      if (Array.isArray(listaActualizada) && listaActualizada.length > 0) {
        setPacientes(listaActualizada);
        setIdPacienteSeleccionado(nuevoPac.id_paciente);
      }
    } catch (err) {
      console.warn('Error al actualizar catálogo de pacientes:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const fechaHoyActual = new Date().toLocaleDateString('en-CA');
    if (fechaTurno < fechaHoyActual) {
      setErrorMsg('No es posible registrar ni reprogramar turnos en fechas pasadas');
      return;
    }

    if (!horaInicio) {
      setErrorMsg('Por favor selecciona un horario de inicio.');
      return;
    }

    if (tieneConflicto) {
      setErrorMsg(`Horario no disponible / Ocupado (${horaInicio} a ${horaFinCalculada} hs).`);
      return;
    }

    try {
      setIsSubmitting(true);
      const idPacienteFinal = idPacienteSeleccionado;

      if (!idPacienteFinal) {
        setErrorMsg('Debes seleccionar o registrar un paciente.');
        setIsSubmitting(false);
        return;
      }

      if (!idPracticaSeleccionada) {
        setErrorMsg('Debes seleccionar una práctica odontológica.');
        setIsSubmitting(false);
        return;
      }

      const fechaHoraInicio = `${fechaTurno} ${horaInicio}:00`;
      const fechaHoraFin = `${fechaTurno} ${horaFinCalculada}:00`;

      const formData = {
        id_paciente: Number(idPacienteFinal),
        id_practica: Number(idPracticaSeleccionada),
        fecha_hora_inicio: fechaHoraInicio,
        fecha_hora_fin: fechaHoraFin,
        duracion_minutos: duracionMinutos,
        motivo_consulta: notasConsulta.trim(),
        notas_consulta: notasConsulta.trim(),
        hora: horaInicio,
        fecha: fechaTurno
      };

      const validacion = turnoSchema.safeParse(formData);
      if (!validacion.success) {
        const errorMsg = validacion.error.issues?.[0]?.message || 'Datos del turno inválidos.';
        setErrorMsg(errorMsg);
        setIsSubmitting(false);
        return;
      }

      await onAsignarTurno(validacion.data);

      onClose();
    } catch (err) {
      console.error('Error al confirmar asignación:', err);
      const msg = err?.message || 'No se pudo agendar el turno. Por favor intente nuevamente.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="modal-asignar-overlay min-h-screen w-full flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-asignar-titulo"
        onClick={isSubmitting ? undefined : onClose}
      >
        <div
          className="modal-asignar-card bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-asignar-header">
            <div className="modal-asignar-title-group">
              <div className="modal-asignar-icon-badge" aria-hidden="true">
                <ToothLogo size={36} />
              </div>
              <div>
                <h2 id="modal-asignar-titulo" className="modal-asignar-title">
                  {esModoLibre ? 'Nuevo Turno' : `Asignar Turno (${horaInicio} hs)`}
                </h2>
              </div>
            </div>

            <button
              type="button"
              className="modal-asignar-close-btn"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Cerrar formulario de asignación"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-asignar-form">
            <div className="modal-asignar-body">
              {errorMsg && (
                <div className="modal-asignar-feedback" role="alert">
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="modal-asignar-field">
                <label htmlFor="input-fecha-turno">
                  Fecha del Turno <span className="asterisco-obligatorio">*</span>
                </label>
                <input
                  type="date"
                  id="input-fecha-turno"
                  className="modal-asignar-input"
                  value={fechaTurno}
                  min={fechaHoyStr}
                  onChange={(e) => setFechaTurno(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="modal-asignar-steppers-grid">
                <div className="selector-horario-stepper">
                  <label className="horario-label">Hora de Inicio:</label>

                  <div className="stepper-contenedor">
                    <div className="input-hora-display">
                      {formatearHora(horaInicio)}
                    </div>

                    <button 
                      type="button" 
                      className="btn-stepper btn-restar" 
                      onClick={handleRestar15Min}
                      disabled={isSubmitting || isRestarDisabled}
                      aria-label="Restar 15 minutos"
                    >
                      -
                    </button>

                    <button 
                      type="button" 
                      className="btn-stepper btn-sumar" 
                      onClick={handleSumar15Min}
                      disabled={isSubmitting || isSumarDisabled}
                      aria-label="Sumar 15 minutos"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="selector-horario-stepper">
                  <label className="horario-label">Duración:</label>
                  <div className="stepper-contenedor">
                    <div className="input-hora-display">
                      {duracionMinutos} min
                    </div>
                    <button 
                      type="button" 
                      className="btn-stepper btn-restar" 
                      onClick={handleRestarDuracion}
                      disabled={duracionMinutos <= 15 || isSubmitting}
                      aria-label="Restar 15 minutos de duración"
                    >
                      -
                    </button>
                    <button 
                      type="button" 
                      className="btn-stepper btn-sumar" 
                      onClick={handleSumarDuracion}
                      disabled={duracionMinutos >= maxDuracionPermitida || isSubmitting}
                      aria-label="Sumar 15 minutos de duración"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {horaFinCalculada && (
                <div className="horario-resumen-container">
                  <span className="horario-fin-indicador">
                    Hasta {horaFinCalculada} hs ({duracionMinutos} min)
                    {slotData?.horaFin && ` • Espacio máx: ${maxDuracionPermitida} min (hasta ${slotData.horaFin} hs)`}
                  </span>
                </div>
              )}

              {tieneConflicto && (
                <div className="alerta-horario-conflicto" role="alert">
                  <span>⚠️ Horario no disponible / Ocupado</span>
                </div>
              )}

              <div className="modal-asignar-tab-bar" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected="true"
                  className="modal-asignar-tab-btn is-active"
                >
                  Paciente Registrado
                </button>
                <button
                  type="button"
                  className="modal-asignar-tab-btn"
                  onClick={() => setIsModalCrearPacienteOpen(true)}
                  title="Registrar nuevo paciente con ficha completa"
                >
                  + Registrar nuevo
                </button>
              </div>

              <div className="modal-asignar-field">
                <label htmlFor="select-paciente">
                  Seleccionar Paciente <span className="asterisco-obligatorio">*</span>
                </label>
                <select
                  id="select-paciente"
                  className="modal-asignar-select"
                  value={idPacienteSeleccionado}
                  onChange={(e) => setIdPacienteSeleccionado(e.target.value)}
                  disabled={isLoadingCatalogos || pacientes.length === 0}
                  required
                >
                  {pacientes.map((p) => (
                    <option key={p.id_paciente} value={p.id_paciente}>
                      {p.apellido}, {p.nombre} (DNI: {p.dni})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-asignar-field">
                <label htmlFor="select-practica-asignar">
                  Práctica Odontológica <span className="asterisco-obligatorio">*</span>
                </label>
                <select
                  id="select-practica-asignar"
                  className="modal-asignar-select"
                  value={idPracticaSeleccionada}
                  onChange={handlePracticaChange}
                  disabled={isLoadingCatalogos || practicas.length === 0}
                  required
                >
                  {practicas
                    .filter((pr) => pr.activo !== false && pr.activo !== 0 && pr.estado !== 'INACTIVO')
                    .map((pr) => (
                      <option key={pr.id_practica} value={pr.id_practica}>
                        [{pr.codigo_nomenclador}] {pr.nombre_referencia}
                      </option>
                    ))}
                </select>
              </div>

              <div className="modal-asignar-field">
                <label htmlFor="notas-consulta">
                  Notas / Observaciones de la Consulta
                </label>
                <input
                  type="text"
                  id="notas-consulta"
                  className="modal-asignar-input"
                  placeholder="Ej: Paciente asiste por dolor en molar superior..."
                  value={notasConsulta}
                  onChange={(e) => setNotasConsulta(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-asignar-actions">
              <button
                type="button"
                className="btn-modal-cancelar bg-[#f87171] hover:bg-[#ef4444] text-white font-medium rounded-xl transition-all shadow-sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-modal-confirmar"
                disabled={
                  isSubmitting ||
                  isLoadingCatalogos ||
                  isLoadingHorarios ||
                  tieneConflicto ||
                  !idPacienteSeleccionado
                }
              >
                {isSubmitting ? 'Guardando...' : 'Confirmar Turno'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isModalCrearPacienteOpen && (
        <ModalPaciente
          isOpen={isModalCrearPacienteOpen}
          onClose={() => setIsModalCrearPacienteOpen(false)}
          paciente={null}
          onPacienteGuardado={handlePacienteCreado}
        />
      )}
    </>
  );
};

export default ModalAsignarTurno;
