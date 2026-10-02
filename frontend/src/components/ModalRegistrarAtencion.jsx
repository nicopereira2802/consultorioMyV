import { useState, useEffect, useMemo } from 'react';
import { getPracticas } from '../services/practicas.service';
import { registrarAtencionTurno, calcularBloquesTurno } from '../services/turnos.service';
import './ModalRegistrarAtencion.css';

/**
 * ModalRegistrarAtencion - Historia de Usuario 2
 * Registro de prácticas odontológicas realizadas y observaciones clínicas en la Agenda Diaria.
 * Sincronizado con el modelo relacional:
 * TURNO: id_turno, id_paciente, id_estado (4: 'Atendido'), notas_consulta, precio_final
 * TURNO_PRACTICA: id_turno, id_practica
 * PACIENTE: historial clínico
 *
 * @param {boolean} isOpen - Estado de visibilidad del modal
 * @param {function} onClose - Callback para cerrar el modal
 * @param {Object} turno - Datos del turno seleccionado
 * @param {function} [onAtencionRegistrada] - Callback tras registrar la atención exitosamente
 * @param {function} [onConfirmar] - Callback tras registrar la atención exitosamente
 */
const obtenerPracticasIniciales = (turno) => {
  if (!turno) return [];
  if (Array.isArray(turno.practicas_realizadas) && turno.practicas_realizadas.length > 0) {
    return turno.practicas_realizadas;
  }
  if (Array.isArray(turno.practicas) && turno.practicas.length > 0) {
    return turno.practicas;
  }
  if (turno.practica) {
    if (typeof turno.practica === 'object') {
      return [turno.practica];
    }
    if (typeof turno.practica === 'string' && turno.practica.trim() !== '') {
      return [{
        id_practica: turno.id_practica || 9999,
        codigo_nomenclador: '01.01',
        nombre_referencia: turno.practica,
        especialidad: 'General'
      }];
    }
  }
  return [];
};

export const ModalRegistrarAtencion = ({
  isOpen,
  onClose,
  turno,
  onAtencionRegistrada,
  onConfirmar
}) => {
  const [catalogoPracticas, setCatalogoPracticas] = useState([]);
  const [practicasSeleccionadas, setPracticasSeleccionadas] = useState(() =>
    obtenerPracticasIniciales(turno)
  );
  const [practicaSeleccionadaId, setPracticaSeleccionadaId] = useState('');
  const [observaciones, setObservaciones] = useState(
    turno?.observaciones || turno?.notas_consulta || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoadingPracticas, setIsLoadingPracticas] = useState(false);

  const totalCalculado = useMemo(() => {
    return practicasSeleccionadas.reduce(
      (acc, p) => acc + (parseFloat(p.precio_referencia) || 0),
      0
    );
  }, [practicasSeleccionadas]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const iniciales = obtenerPracticasIniciales(turno);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPracticasSeleccionadas(iniciales);

    const cargarCatalogo = async () => {
      try {
        setIsLoadingPracticas(true);
        const practicas = await getPracticas();
        if (isMounted) {
          setCatalogoPracticas(practicas);

          setPracticasSeleccionadas((prev) => {
            if (prev.length > 0 && prev[0].id_practica && prev[0].id_practica !== 9999) {
              return prev;
            }
            if (turno?.id_practica) {
              const match = practicas.find((p) => Number(p.id_practica) === Number(turno.id_practica));
              if (match) return [match];
            }
            if (typeof turno?.practica === 'string') {
              const match = practicas.find((p) =>
                p.nombre_referencia.toLowerCase() === turno.practica.toLowerCase() ||
                p.nombre_nomenclador?.toLowerCase() === turno.practica.toLowerCase()
              );
              if (match) return [match];
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Error al cargar catálogo de prácticas en modal:', err);
      } finally {
        if (isMounted) setIsLoadingPracticas(false);
      }
    };

    cargarCatalogo();
    setObservaciones(turno?.observaciones || turno?.notas_consulta || '');
    setPracticaSeleccionadaId('');
    setErrorMsg('');
    setIsSubmitting(false);

    return () => {
      isMounted = false;
    };
  }, [isOpen, turno]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !turno) return null;

  const paciente = turno.paciente || {};
  const nombreCompleto = paciente.nombre && paciente.apellido
    ? `${paciente.nombre} ${paciente.apellido}`
    : (paciente.nombre || paciente.apellido || 'Paciente sin registrar');

  const dni = paciente.dni || '-';

  const obraSocialNombre =
    paciente.obra_social?.nombre ||
    paciente.obra_social_nombre ||
    (typeof paciente.obra_social === 'string' && paciente.obra_social.trim() !== '' ? paciente.obra_social : '') ||
    'Particular';

  const bloquesInfo = calcularBloquesTurno(turno);
  const horarioStr = bloquesInfo.horaInicio && bloquesInfo.horaFin
    ? `${bloquesInfo.horaInicio} a ${bloquesInfo.horaFin} hs`
    : (turno.hora ? `${turno.hora} hs` : 'Horario asignado');

  const handleAgregarPractica = () => {
    if (!practicaSeleccionadaId) return;

    const idNum = Number(practicaSeleccionadaId);
    const practica = catalogoPracticas.find((p) => Number(p.id_practica) === idNum);
    if (!practica) return;

    const yaExiste = practicasSeleccionadas.some((p) => Number(p.id_practica) === idNum);
    if (yaExiste) {
      setErrorMsg('La práctica ya ha sido agregada a la lista.');
      return;
    }

    setPracticasSeleccionadas((prev) => [...prev, practica]);
    setPracticaSeleccionadaId('');
    setErrorMsg('');
  };

  const handleQuitarPractica = (id_practica) => {
    setPracticasSeleccionadas((prev) => prev.filter((p) => Number(p.id_practica) !== Number(id_practica)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (practicasSeleccionadas.length === 0) {
      setErrorMsg('Debe seleccionar al menos 1 práctica odontológica para registrar la atención.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const totalCalculadoNum = practicasSeleccionadas.reduce(
        (acc, p) => acc + (parseFloat(p.precio_referencia) || 0),
        0
      );

      const idsPracticas = practicasSeleccionadas.map((p) => p.id_practica);
      const turnoActualizado = await registrarAtencionTurno(
        turno.id_turno,
        {
          id_practicas: idsPracticas,
          practicas_realizadas: practicasSeleccionadas,
          total: totalCalculadoNum,
          observaciones
        },
        turno.fecha
      );

      const payloadTurno = {
        ...(turnoActualizado || {}),
        id_turno: turno.id_turno,
        estado: 'ATENDIDO',
        id_estado: 4,
        estado_nombre: 'Atendido',
        practicas_realizadas: practicasSeleccionadas,
        total: totalCalculadoNum,
        precio_final: totalCalculadoNum,
        observaciones,
        notas_consulta: observaciones
      };

      if (onConfirmar) {
        await onConfirmar(payloadTurno);
      }

      if (onAtencionRegistrada) {
        await onAtencionRegistrada(payloadTurno, {
          practicasSeleccionadas,
          total: totalCalculadoNum,
          observaciones
        });
      }
      onClose();
    } catch (err) {
      console.error('Error al registrar atención clínica:', err);
      setErrorMsg('Ocurrió un error al registrar la atención. Por favor intente nuevamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-registrar-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-registrar-title"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="modal-registrar-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-registrar-header">
          <div className="modal-registrar-title-group">
            <div className="modal-registrar-icon-badge" aria-hidden="true">
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
            </div>
            <div>
              <h2 id="modal-registrar-title" className="modal-registrar-title">
                Registrar Atención Clínica
              </h2>
              <p className="modal-registrar-subtitle">
                {turno.fecha ? `Turno: ${turno.fecha}` : 'Atención del día'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-registrar-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar modal de registro de atención"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-registrar-form">
          <div className="modal-registrar-body">
            {errorMsg && (
              <div className="modal-registrar-alert-error" role="alert">
                <span className="error-icon" aria-hidden="true">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="modal-registrar-resumen-card">
              <h3 className="resumen-card-title">Datos del Turno</h3>
              <div className="resumen-grid">
                <div className="resumen-item">
                  <span className="resumen-label">Paciente</span>
                  <strong className="resumen-value">{nombreCompleto}</strong>
                  <span className="resumen-sub">DNI: {dni}</span>
                </div>

                <div className="resumen-item">
                  <span className="resumen-label">Obra Social / Cobertura</span>
                  <strong className="resumen-value">{obraSocialNombre}</strong>
                  <span className="resumen-sub">
                    {paciente.nro_afiliado ? `N° Afiliado: ${paciente.nro_afiliado}` : 'Particular / Sin credencial'}
                  </span>
                </div>

                <div className="resumen-item">
                  <span className="resumen-label">Horario Asignado</span>
                  <strong className="resumen-value">{horarioStr}</strong>
                  <span className="resumen-sub">Duración: {bloquesInfo.duracionMinutos} min</span>
                </div>
              </div>
            </div>

            <div className="modal-registrar-section">
              <label htmlFor="selector-practicas" className="modal-registrar-label">
                Prácticas Odontológicas Realizadas <span className="label-required">* (mínimo 1)</span>
              </label>

              <div className="selector-practicas-row">
                <select
                  id="selector-practicas"
                  className="select-practica-catalogo"
                  value={practicaSeleccionadaId}
                  onChange={(e) => {
                    setPracticaSeleccionadaId(e.target.value);
                    setErrorMsg('');
                  }}
                  disabled={isLoadingPracticas || isSubmitting}
                >
                  <option value="">Seleccionar práctica para agregar...</option>
                  {catalogoPracticas.map((p) => (
                    <option key={p.id_practica} value={p.id_practica}>
                      [{p.codigo_nomenclador}] {p.nombre_referencia} ({p.especialidad})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="btn-agregar-practica"
                  onClick={handleAgregarPractica}
                  disabled={!practicaSeleccionadaId || isSubmitting}
                >
                  + Agregar
                </button>
              </div>

              <div className="lista-practicas-añadidas">
                {practicasSeleccionadas.length === 0 ? (
                  <p className="practicas-vacio-texto">
                    Ninguna práctica añadida aún. Selecciona una práctica del catálogo y pulsa <strong>+ Agregar</strong>.
                  </p>
                ) : (
                  practicasSeleccionadas.map((p) => (
                    <div key={p.id_practica} className="chip-practica-card">
                      <div className="chip-practica-info">
                        <span className="chip-practica-codigo">{p.codigo_nomenclador}</span>
                        <strong className="chip-practica-nombre">{p.nombre_referencia}</strong>
                        {p.especialidad && (
                          <span className="chip-practica-especialidad">{p.especialidad}</span>
                        )}
                        {p.precio_referencia && (
                          <span className="chip-practica-arancel">
                            $ {Number(p.precio_referencia).toLocaleString('es-AR')}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-quitar-practica"
                        onClick={() => handleQuitarPractica(p.id_practica)}
                        disabled={isSubmitting}
                        title={`Quitar ${p.nombre_referencia}`}
                        aria-label={`Quitar ${p.nombre_referencia}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="resumen-total-atencion">
                <span>Total de la Atención:</span>
                <strong>$ {totalCalculado.toLocaleString('es-AR')}</strong>
              </div>
            </div>

            <div className="modal-registrar-section">
              <label htmlFor="observaciones-clinicas-textarea" className="modal-registrar-label">
                Observaciones y notas clínicas
              </label>
              <textarea
                id="observaciones-clinicas-textarea"
                className="textarea-observaciones-clinicas"
                rows={4}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Detalle del procedimiento, piezas dentarias tratadas, medicación o indicaciones..."
                disabled={isSubmitting}
              />
              <span className="helper-text-observaciones">
                Quedarán registradas en la evolución clínica del paciente y en la ficha del turno atendido.
              </span>
            </div>
          </div>

          <div className="modal-registrar-footer">
            <button
              type="button"
              className="btn-modal-reg-cancelar"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-modal-reg-confirmar"
              disabled={isSubmitting || practicasSeleccionadas.length === 0}
            >
              {isSubmitting ? 'Registrando...' : 'Registrar Atención'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalRegistrarAtencion;
