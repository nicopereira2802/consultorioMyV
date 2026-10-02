import { useState, useEffect, useCallback } from 'react';
import {
  getTurnosDia,
  getHorariosHabiles,
  reprogramarTurno,
  haySuperposicionTurnos,
  sumarMinutosAHora
} from '../services/turnos.service';
import './ModalConfirmacion.css';
import './ModalReprogramarTurno.css';

/**
 * ModalReprogramarTurno - Modal para reprogramar un turno tras inasistencia o cambio de cita
 * Sincronizado con el esquema relacional:
 * - Turno original pasa a 'Inasistente' (id_estado: 5)
 * - Nuevo turno se registra en la fecha y hora elegidas en estado 'Reprogramado' (id_estado: 2)
 *
 * Muestra la totalidad de horarios hábiles de atención del consultorio (08:30 a 18:00 hs)
 * filtrando reactivamente cualquier franja que genere colisión horaria.
 *
 * @param {boolean} isOpen - Visibilidad del modal
 * @param {function} onClose - Cierre del modal
 * @param {Object} turno - Turno original a reprogramar
 * @param {function} [onConfirmar] - Callback async opcional (idTurnoOriginal, nuevaFecha, nuevaHora)
 * @param {function} [onTurnoReprogramado] - Callback ejecutado tras completar la reprogramación
 */
export const ModalReprogramarTurno = ({
  isOpen,
  onClose,
  turno,
  onConfirmar,
  onTurnoReprogramado
}) => {
  const fechaHoyStr = new Date().toLocaleDateString('en-CA');

  const [nuevaFecha, setNuevaFecha] = useState(fechaHoyStr);
  const [nuevaHora, setNuevaHora] = useState('');
  const [turnosDelDia, setTurnosDelDia] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [isLoadingHorarios, setIsLoadingHorarios] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const cargarHorarios = useCallback(
    async (fecha, turnoActual = null) => {
      if (!fecha) {
        setHorariosDisponibles([]);
        setNuevaHora('');
        return;
      }

      try {
        setIsLoadingHorarios(true);
        setErrorMsg('');

        const horariosBase = getHorariosHabiles(fecha);
        const turnosDia = await getTurnosDia(fecha);
        setTurnosDelDia(turnosDia);

        const idTurnoExcluir = turnoActual?.id_turno || turno?.id_turno;
        const duracion = turnoActual?.practica?.duracion_minutos ||
          (turnoActual?.practica?.modulos ? turnoActual.practica.modulos * 15 : null) ||
          turno?.practica?.duracion_minutos ||
          (turno?.practica?.modulos ? turno.practica.modulos * 15 : 30);

        const horasDisponibles = horariosBase.filter(
          (h) => !haySuperposicionTurnos(turnosDia, h, duracion, idTurnoExcluir)
        );

        setHorariosDisponibles(horasDisponibles);

        setNuevaHora((horaPrevia) => {
          if (horaPrevia && horasDisponibles.includes(horaPrevia)) {
            return horaPrevia;
          }
          return horasDisponibles.length > 0 ? horasDisponibles[0] : '';
        });
      } catch (err) {
        console.error('Error al cargar horarios disponibles:', err);
        setErrorMsg('No se pudieron consultar los horarios disponibles.');
      } finally {
        setIsLoadingHorarios(false);
      }
    },
    [turno]
  );

  useEffect(() => {
    if (isOpen && turno) {
      const hoy = new Date().toLocaleDateString('en-CA');
      const fechaInicial = turno.fecha && turno.fecha >= hoy ? turno.fecha : hoy;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNuevaFecha(fechaInicial);
      setErrorMsg('');
      setIsSubmitting(false);
      cargarHorarios(fechaInicial, turno);
    }
  }, [isOpen, turno, cargarHorarios]);

  const handleFechaChange = (e) => {
    const val = e.target.value;
    const hoy = new Date().toLocaleDateString('en-CA');
    if (val < hoy) {
      setErrorMsg('No es posible registrar ni reprogramar turnos en fechas pasadas');
    } else {
      setErrorMsg('');
    }
    setNuevaFecha(val);
    cargarHorarios(val, turno);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
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
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !turno) return null;

  const nombrePaciente = turno.paciente
    ? `${turno.paciente.nombre} ${turno.paciente.apellido}`
    : 'Paciente no especificado';

  const dniPaciente = turno.paciente?.dni || 'Sin DNI';
  const nombrePractica =
    turno.practica?.nombre_referencia ||
    turno.practica?.nombre_nomenclador ||
    'Consulta Odontológica General';
  const duracionMinutos = turno.practica?.duracion_minutos || (turno.practica?.modulos ? turno.practica.modulos * 15 : 30);
  const bloques = Math.max(1, Math.round(duracionMinutos / 15));
  const horaFinCalculada = nuevaHora ? sumarMinutosAHora(nuevaHora, bloques * 15) : '';

  const tieneConflicto = Boolean(
    nuevaHora && duracionMinutos && haySuperposicionTurnos(turnosDelDia, nuevaHora, duracionMinutos, turno.id_turno)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hoy = new Date().toLocaleDateString('en-CA');

    if (!nuevaFecha) {
      setErrorMsg('Por favor selecciona una fecha válida.');
      return;
    }
    if (nuevaFecha < hoy) {
      setErrorMsg('No es posible registrar ni reprogramar turnos en fechas pasadas');
      return;
    }
    if (!nuevaHora) {
      setErrorMsg('Por favor selecciona un horario disponible.');
      return;
    }

    if (tieneConflicto || haySuperposicionTurnos(turnosDelDia, nuevaHora, duracionMinutos, turno.id_turno)) {
      setErrorMsg(`⚠️ El horario elegido (${nuevaHora} a ${horaFinCalculada}) entra en conflicto con un turno existente en ese intervalo.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      if (onConfirmar) {
        await onConfirmar(turno.id_turno, nuevaFecha, nuevaHora);
      } else {
        await reprogramarTurno(turno.id_turno, nuevaFecha, nuevaHora);
      }

      if (onTurnoReprogramado) {
        await onTurnoReprogramado();
      }

      onClose();
    } catch (error) {
      console.error('Error al reprogramar turno:', error);
      const msg = error?.message || 'Ocurrió un error al reprogramar. Intente nuevamente.';
      setErrorMsg(msg);
      alert('Ocurrió un error al reprogramar. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reprogramar-title"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="modal-confirm-card modal-reprogramar-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-confirm-header modal-reprogramar-header">
          <div className="modal-confirm-title-group">
            <div className="modal-confirm-icon-badge petroleo">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                <path d="M3 22v-6h6"></path>
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
              </svg>
            </div>
            <div>
              <h2 id="modal-reprogramar-title" className="modal-confirm-title">
                Reprogramar Turno
              </h2>
              <p className="modal-reprogramar-subtitle">
                Inasistencia del {turno.fecha} ({turno.hora} hs)
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-confirm-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar modal de reprogramación"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-reprogramar-form">
          <div className="modal-reprogramar-body">
            <div className="reprogramar-paciente-card">
              <div className="reprogramar-paciente-row">
                <span className="reprogramar-paciente-label">Paciente:</span>
                <strong className="reprogramar-paciente-val">{nombrePaciente}</strong>
              </div>
              <div className="reprogramar-paciente-row">
                <span className="reprogramar-paciente-label">DNI:</span>
                <span className="reprogramar-paciente-val">{dniPaciente}</span>
              </div>
              <div className="reprogramar-paciente-row">
                <span className="reprogramar-paciente-label">Práctica:</span>
                <span className="reprogramar-paciente-val">{nombrePractica}</span>
              </div>
            </div>

            <div className="reprogramar-info-banner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>
                El turno original quedará registrado como <strong>Inasistente</strong> y se generará una nueva cita en estado <strong>Reprogramado</strong>.
              </span>
            </div>

            <div className="reprogramar-form-group">
              <label htmlFor="reprogramar-fecha" className="reprogramar-label">
                Nueva Fecha para la Cita *
              </label>
              <input
                type="date"
                id="reprogramar-fecha"
                className="reprogramar-input-fecha"
                value={nuevaFecha}
                min={fechaHoyStr}
                onChange={handleFechaChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="reprogramar-form-group">
              <label className="reprogramar-label">
                Horario Disponible en esa Fecha {horariosDisponibles.length > 0 ? `(${horariosDisponibles.length} disponibles)` : ''} *
              </label>

              {isLoadingHorarios ? (
                <div className="reprogramar-loading-slots">
                  <span className="reprogramar-spinner"></span>
                  <span>Consultando disponibilidad horaria...</span>
                </div>
              ) : horariosDisponibles.length > 0 ? (
                <div className="reprogramar-slots-grid" role="radiogroup" aria-label="Horarios disponibles">
                  {horariosDisponibles.map((h) => {
                    const isSelected = nuevaHora === h;
                    return (
                      <button
                        type="button"
                        key={h}
                        role="radio"
                        aria-checked={isSelected}
                        className={`reprogramar-slot-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => setNuevaHora(h)}
                        disabled={isSubmitting}
                      >
                        <span className="reprogramar-chip-time">{h} hs</span>
                        {isSelected && <span className="reprogramar-chip-check">✓</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="reprogramar-empty-slots">
                  <span>⚠️ No hay turnos disponibles para esta fecha. Por favor, selecciona otro día en el calendario.</span>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="reprogramar-error-banner" role="alert">
                {errorMsg}
              </div>
            )}
          </div>

          {tieneConflicto && (
            <div className="reprogramar-alerta-conflicto" role="alert">
              <span>⚠️ El horario elegido ({nuevaHora} a {horaFinCalculada}) entra en conflicto con un turno existente en ese intervalo.</span>
            </div>
          )}

          <div className="modal-confirm-actions">
            <button
              type="button"
              className="btn-modal-cancelar-neutro btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-modal-confirmar-accion exito btn-primary"
              disabled={isSubmitting || !nuevaHora || isLoadingHorarios || horariosDisponibles.length === 0 || tieneConflicto}
            >
              {isSubmitting ? 'Reprogramando...' : 'Confirmar Reprogramación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalReprogramarTurno;
