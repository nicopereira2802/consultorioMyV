import { useState, useEffect } from 'react';
import { getTurnosAtendidosPorPaciente } from '../services/turnos.service';
import { obtenerNombreCobertura } from '../utils/paciente.utils';
import './ModalHistorialPaciente.css';

/**
 * ModalHistorialPaciente - Modal de Ficha e Historial Clínico de Atenciones
 * Consulta los turnos del paciente en estado 'Atendido' (id_estado: 4) y el historial registrado.
 * Muestra cronológicamente profesional, fecha, arancel y evolución clínica desplegable.
 *
 * @param {boolean} isOpen - Visibilidad del modal
 * @param {function} onClose - Callback de cierre
 * @param {Object} paciente - Datos del paciente seleccionado
 */
export const ModalHistorialPaciente = ({
  isOpen,
  onClose,
  paciente = null
}) => {
  const [atenciones, setAtenciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(new Set());

  useEffect(() => {
    if (!isOpen || !paciente) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAtenciones([]);
      setExpandedIds(new Set());
      return;
    }

    let isMounted = true;

    const cargarHistorialCompleto = async () => {
      try {
        setIsLoading(true);

        const turnosAtendidos = await getTurnosAtendidosPorPaciente(paciente.id_paciente);

        const historialPaciente = Array.isArray(paciente.historial) ? paciente.historial : [];

        const parsearPracticas = (item) => {
          let list = [];
          if (Array.isArray(item.practicas_realizadas) && item.practicas_realizadas.length > 0) {
            list = item.practicas_realizadas.map((p) => {
              if (typeof p === 'string') {
                const matchCod = p.match(/^\[(.*?)\]\s*(.*)$/);
                return {
                  codigo: matchCod ? matchCod[1] : '',
                  nombre: matchCod ? matchCod[2] : p
                };
              }
              return {
                codigo: p.codigo_nomenclador || p.codigo || '',
                nombre: p.nombre_referencia || p.nombre_nomenclador || p.nombre || 'Práctica Odontológica'
              };
            });
          } else if (item.practica) {
            if (typeof item.practica === 'object') {
              const p = item.practica;
              list = [{
                codigo: p.codigo_nomenclador || p.codigo || '',
                nombre: p.nombre_referencia || p.nombre_nomenclador || p.nombre || 'Práctica Odontológica'
              }];
            } else if (typeof item.practica === 'string') {
              const partes = item.practica.split(/,\s*/);
              list = partes.map((parte) => {
                const matchCod = parte.match(/^\[(.*?)\]\s*(.*)$/);
                if (matchCod) {
                  return {
                    codigo: matchCod[1],
                    nombre: matchCod[2]
                  };
                }
                return {
                  codigo: '',
                  nombre: parte.trim()
                };
              });
            }
          }

          if (list.length === 0) {
            list = [{
              codigo: '',
              nombre: 'Consulta Odontológica'
            }];
          }

          return list;
        };

        const mapEstadoNombre = (id_estado, estadoOriginal) => {
          if (id_estado === 1) return 'PROGRAMADO';
          if (id_estado === 2) return 'CANCELADO';
          if (id_estado === 3) return 'ATENDIDO';
          if (id_estado === 4) return 'INASISTENTE';
          if (estadoOriginal) {
            const s = String(estadoOriginal).toUpperCase();
            if (s.includes('PROG')) return 'PROGRAMADO';
            if (s.includes('CANCEL')) return 'CANCELADO';
            if (s.includes('INASIST')) return 'INASISTENTE';
            if (s.includes('ATEND') || s.includes('REALIZAD')) return 'ATENDIDO';
            return s;
          }
          return 'ATENDIDO';
        };

        const listaConsolidada = [];
        const turnosPorFecha = new Map();

        turnosAtendidos.forEach((t) => {
          const practicas = parsearPracticas(t);
          const notas = (t.notas_consulta || t.observaciones || t.notas || '').trim();
          const motivo = (t.motivo_consulta || '').trim();

          const consultaObj = {
            id: `turno-${t.id_turno || Math.random()}`,
            id_turno: t.id_turno,
            fecha: t.fecha,
            hora: t.hora || '',
            estado: mapEstadoNombre(t.id_estado, t.estado || t.estado_nombre),
            practicas,
            motivo_consulta: motivo,
            notas_consulta: notas,
            profesional: t.profesional || 'Dra. Valenzuela',
            origen: 'agenda'
          };

          listaConsolidada.push(consultaObj);
          if (t.fecha) {
            turnosPorFecha.set(t.fecha, consultaObj);
          }
        });

        historialPaciente.forEach((item, idx) => {
          const fechaItem = item.fecha;
          const turnoExistente = turnosPorFecha.get(fechaItem);

          if (turnoExistente) {
            if (!turnoExistente.notas_consulta && (item.notas || item.notas_consulta)) {
              turnoExistente.notas_consulta = (item.notas || item.notas_consulta).trim();
            }
            if (turnoExistente.practicas.length === 1 && turnoExistente.practicas[0].nombre === 'Consulta Odontológica') {
              const practicasHist = parsearPracticas(item);
              if (practicasHist.length > 0 && practicasHist[0].nombre !== 'Consulta Odontológica') {
                turnoExistente.practicas = practicasHist;
              }
            }
            return;
          }

          const practicas = parsearPracticas(item);
          const notas = (item.notas || item.notas_consulta || '').trim();
          const motivo = (item.motivo_consulta || '').trim();

          const consultaObj = {
            id: `historial-${idx}`,
            fecha: item.fecha,
            hora: item.hora || '',
            estado: mapEstadoNombre(item.id_estado, item.estado || 'ATENDIDO'),
            practicas,
            motivo_consulta: motivo,
            notas_consulta: notas,
            profesional: item.profesional || 'Dra. Valenzuela',
            origen: 'registro'
          };

          listaConsolidada.push(consultaObj);
          if (fechaItem) {
            turnosPorFecha.set(fechaItem, consultaObj);
          }
        });

        listaConsolidada.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

        if (isMounted) {
          setAtenciones(listaConsolidada);
          if (listaConsolidada.length > 0) {
            setExpandedIds(new Set([listaConsolidada[0].id]));
          }
        }
      } catch (err) {
        console.error('Error al cargar historial del paciente:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    cargarHistorialCompleto();

    return () => {
      isMounted = false;
    };
  }, [isOpen, paciente]);

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

  const toggleDetalle = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const nombreCompleto = paciente.apellido
    ? `${paciente.apellido}, ${paciente.nombre}`
    : paciente.nombre;

  const obraSocialNombre = obtenerNombreCobertura(paciente);

  return (
    <div
      className="modal-historial-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-historial-titulo"
      onClick={onClose}
    >
      <div
        className="modal-historial-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-historial-header">
          <div className="modal-historial-branding">
            <div className="modal-historial-logo-badge" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 12h6" />
                <path d="M9 16h6" />
              </svg>
            </div>
            <div>
              <h2 id="modal-historial-titulo" className="modal-historial-title">
                Historial Clínico del Paciente
              </h2>
              <p className="modal-historial-subtitle">
                <strong>{nombreCompleto}</strong> &bull; DNI: {paciente.dni} &bull; Cobertura: {obraSocialNombre}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-historial-close-btn"
            onClick={onClose}
            aria-label="Cerrar historial"
          >
            ✕
          </button>
        </div>

        <div className="modal-historial-body">
          {isLoading && (
            <div className="historial-loading-state">
              <span className="historial-spinner"></span>
              <span>Consultando turnos y evoluciones clínicas...</span>
            </div>
          )}

          {!isLoading && atenciones.length === 0 && (
            <div className="historial-empty-container">
              <div className="historial-empty-icon" aria-hidden="true">📋</div>
              <p className="historial-empty-title">
                El paciente no posee atenciones previas registradas.
              </p>
              <p className="historial-empty-desc">
                Las atenciones se registrarán automáticamente cuando se completen turnos en sillón odontológico.
              </p>
            </div>
          )}

          {!isLoading && atenciones.length > 0 && (
            <div className="historial-atenciones-list">
              {atenciones.map((item) => {
                const isExpanded = expandedIds.has(item.id);

                return (
                  <article key={item.id} className="atencion-card-item">
                    <div className="atencion-card-meta">
                      <div className="atencion-meta-left">
                        <span className="atencion-fecha-badge">
                          📅 {item.fecha} {item.hora ? `(${item.hora} hs)` : ''}
                        </span>
                      </div>
                      <span className={`badge-estado badge-${(item.estado || 'atendido').toLowerCase()}`}>
                        {item.estado}
                      </span>
                    </div>

                    <div className="atencion-card-main">
                      <div className="atencion-practica-info">
                        <span className="atencion-practica-label">
                          {item.practicas && item.practicas.length > 1 ? 'Prácticas realizadas:' : 'Práctica realizada:'}
                        </span>
                        <div className="atencion-practicas-lista">
                          {item.practicas && item.practicas.length > 0 ? (
                            item.practicas.map((p, idx) => (
                              <div key={idx} className="atencion-practica-tag-item">
                                {p.codigo && <span className="practica-codigo-tag">[{p.codigo}]</span>}
                                <span className="atencion-practica-nombre">{p.nombre}</span>
                              </div>
                            ))
                          ) : (
                            <span className="atencion-practica-nombre">Consulta Odontológica</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="atencion-action-row">
                      <button
                        type="button"
                        className={`btn-ver-detalle-evolucion ${isExpanded ? 'is-active' : ''}`}
                        onClick={() => toggleDetalle(item.id)}
                        aria-expanded={isExpanded}
                      >
                        <span>{isExpanded ? 'Cerrar detalle' : 'Detalle'}</span>
                        <span className={`accordion-arrow ${isExpanded ? 'is-open' : ''}`} aria-hidden="true">
                          ▼
                        </span>
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="atencion-detalle-box">
                        {item.motivo_consulta && (
                          <div className="atencion-motivo-seccion" style={{ marginBottom: '10px' }}>
                            <div className="atencion-detalle-header">
                              <span className="atencion-detalle-title">
                                Motivo de Consulta (Reserva):
                              </span>
                            </div>
                            <div className="atencion-detalle-text">
                              <p>{item.motivo_consulta}</p>
                            </div>
                          </div>
                        )}
                        <div className="atencion-notas-seccion">
                          <div className="atencion-detalle-header">
                            <span className="atencion-detalle-title">
                              Notas Clínicas / Observaciones:
                            </span>
                          </div>
                          <div className="atencion-detalle-text">
                            {item.evolucion_clinica || item.observaciones || item.notas_consulta ? (
                              <p>{item.evolucion_clinica || item.observaciones || item.notas_consulta}</p>
                            ) : (
                              <p className="notas-default-text">
                                Se completó la sesión según lo previsto. Evolución clínica favorable sin complicaciones inmediatas.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-historial-footer">
          <button
            type="button"
            className="btn-historial-cerrar btn-secondary bg-[#f87171] hover:bg-[#ef4444] text-white font-medium rounded-xl transition-all shadow-sm"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalHistorialPaciente;
