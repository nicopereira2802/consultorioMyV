import { useState, useEffect, useCallback, useMemo } from 'react';
import HeaderVolver from '../components/header';
import TurnoFilaCard from '../components/TurnoFilaCard';
import ModalConfirmacion from '../components/ModalConfirmacion';
import ModalAsignarTurno from '../components/ModalAsignarTurno';
import ModalReprogramarTurno from '../components/ModalReprogramarTurno';
import ModalDetalleConsulta from '../components/ModalDetalleConsulta';
import ModalRegistrarAtencion from '../components/ModalRegistrarAtencion';
import {
  getTodayISO,
  getTurnosPorFecha,
  getTurnosDia,
  cambiarEstadoTurno,
  crearTurno,
  liberarTurno,
  reprogramarTurno,
  actualizarNotasConsulta,
  construirFilasAgendaConBaches
} from '../services/turnos.service';
import './AgendaDiaria.css';

/**
 * AgendaDiaria - Vista Operativa Diaria de Turnos
 * Sincronizada con el esquema relacional:
 * ESTADO_TURNO: 'Programado' (1), 'Reprogramado' (2), 'Cancelado' (3), 'Atendido' (4), 'Inasistente' (5)
 * TURNO: id_turno, id_paciente, id_estado, fecha_hora_inicio, fecha_hora_fin, precio_final, notas_consulta
 */
export const AgendaDiaria = () => {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(getTodayISO());
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const fechaHoyStr = new Date().toLocaleDateString('en-CA');
  const esDiaPasado = fechaSeleccionada < fechaHoyStr;

  const [filtroEstado, setFiltroEstado] = useState('todos');

  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const [modalConfirm, setModalConfirm] = useState({
    isOpen: false,
    titulo: '',
    mensaje: null,
    tipo: 'peligro',
    textoConfirmar: 'Sí, confirmar',
    onConfirm: null
  });

  const [modalAsignar, setModalAsignar] = useState({
    isOpen: false,
    slot: null,
    modoLibre: false
  });

  const [modalReprogramar, setModalReprogramar] = useState({
    isOpen: false,
    turno: null
  });

  const [modalDetalle, setModalDetalle] = useState({
    isOpen: false,
    turno: null
  });

  const [modalRegistrarAtencion, setModalRegistrarAtencion] = useState({
    isOpen: false,
    turno: null
  });

  const cargarTurnos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await getTurnosPorFecha(fechaSeleccionada);
      setTurnos(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error('Error al cargar agenda del día:', err);
      setError(err?.message || 'Error de conexión con el servidor.');
      setTurnos([]);
      return [];
    } finally {
      setCargando(false);
    }
  }, [fechaSeleccionada]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarTurnos();
  }, [cargarTurnos]);

  useEffect(() => {
    const handleFocus = () => {
      cargarTurnos();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [cargarTurnos]);

  const handleDesplazarDia = (dias) => {
    const [year, month, day] = fechaSeleccionada.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day);
    currentDate.setDate(currentDate.getDate() + dias);

    const nextY = currentDate.getFullYear();
    const nextM = String(currentDate.getMonth() + 1).padStart(2, '0');
    const nextD = String(currentDate.getDate()).padStart(2, '0');

    setFechaSeleccionada(`${nextY}-${nextM}-${nextD}`);
  };

  const handleIrAHoy = () => {
    setFechaSeleccionada(getTodayISO());
  };

  const fechaFormateada = useMemo(() => {
    if (!fechaSeleccionada) return '';
    const [year, month, day] = fechaSeleccionada.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);

    const opciones = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    return dateObj.toLocaleDateString('es-AR', opciones);
  }, [fechaSeleccionada]);

  const mostrarToast = (mensaje) => {
    setFeedbackMessage(mensaje);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3800);
  };

  const handleRegistrarAtencion = (turno) => {
    if (esDiaPasado) return;
    setModalRegistrarAtencion({
      isOpen: true,
      turno
    });
  };
  const handleIniciarAtencion = handleRegistrarAtencion;

  const handleCerrarModalRegistrarAtencion = () => {
    setModalRegistrarAtencion({ isOpen: false, turno: null });
  };

  const handleAtencionRegistrada = async (turnoActualizadoRecibido, datosExtras = {}) => {
    setModalRegistrarAtencion({ isOpen: false, turno: null });

    const idTurnoAfectado = turnoActualizadoRecibido?.id_turno || modalRegistrarAtencion.turno?.id_turno;
    const turnoBase = turnos.find((t) => t.id_turno === idTurnoAfectado) || modalRegistrarAtencion.turno || {};

    const practicasCompletas =
      turnoActualizadoRecibido?.practicas_realizadas ||
      datosExtras.practicasSeleccionadas ||
      turnoBase.practicas_realizadas ||
      [];

    const totalCalculado =
      turnoActualizadoRecibido?.total !== undefined && turnoActualizadoRecibido?.total !== null
        ? Number(turnoActualizadoRecibido.total)
        : (datosExtras.total !== undefined && datosExtras.total !== null
          ? Number(datosExtras.total)
          : (turnoActualizadoRecibido?.precio_final !== undefined && turnoActualizadoRecibido?.precio_final !== null
            ? Number(turnoActualizadoRecibido.precio_final)
            : practicasCompletas.reduce((acc, p) => acc + (parseFloat(p.precio_referencia) || 0), 0)));

    const turnoActualizado = {
      ...turnoBase,
      ...(turnoActualizadoRecibido || {}),
      estado: 'ATENDIDO',
      id_estado: 4,
      estado_nombre: 'Atendido',
      practicas_realizadas: practicasCompletas,
      total: totalCalculado,
      precio_final: totalCalculado,
      observaciones:
        turnoActualizadoRecibido?.observaciones ||
        datosExtras.observaciones ||
        turnoActualizadoRecibido?.notas_consulta ||
        '',
      notas_consulta:
        turnoActualizadoRecibido?.observaciones ||
        datosExtras.observaciones ||
        turnoActualizadoRecibido?.notas_consulta ||
        ''
    };

    setTurnos((prevTurnos) =>
      prevTurnos.map((t) => (t.id_turno === idTurnoAfectado ? turnoActualizado : t))
    );

    await cargarTurnos();

    setTurnos((prevTurnos) =>
      prevTurnos.map((t) => (t.id_turno === idTurnoAfectado ? { ...t, ...turnoActualizado } : t))
    );

    mostrarToast('¡Atención clínica registrada con éxito!');
  };

  const handleCerrarModalConfirm = () => {
    setModalConfirm({
      isOpen: false,
      titulo: '',
      mensaje: null,
      tipo: 'peligro',
      textoConfirmar: 'Sí, confirmar',
      textoCancelar: 'Volver / No',
      onConfirm: null,
      onSecondaryAction: null,
      textoSecondaryAction: '',
      tipoSecondaryAction: 'petroleo'
    });
  };

  const handleConfirmarInasistencia = async (turno, nombrePaciente) => {
    try {
      await cambiarEstadoTurno(turno.id_turno, 'Inasistente', fechaSeleccionada);
      const turnosActualizados = await getTurnosDia(fechaSeleccionada);
      setTurnos(turnosActualizados);
      mostrarToast(`Inasistencia registrada para ${nombrePaciente}.`);
    } catch (err) {
      console.error('Error al registrar inasistencia:', err);
      mostrarToast('Error al registrar inasistencia.');
    } finally {
      handleCerrarModalConfirm();
    }
  };

  const handlePedirConfirmacion = (turno, accionEstado) => {
    if (esDiaPasado) return;

    const nombrePaciente = turno.paciente
      ? `${turno.paciente.nombre} ${turno.paciente.apellido}`
      : 'el paciente';

    if (accionEstado === 'Inasistente') {
      setModalConfirm({
        isOpen: true,
        titulo: 'Registrar Inasistencia',
        mensaje: (
          <p>
            ¿Confirmas que el paciente <strong>{nombrePaciente}</strong> no asistió a su cita de las{' '}
            <strong>{turno.hora} hs</strong>? El turno pasará al registro histórico de inasistencias y podrás reprogramar la cita.
          </p>
        ),
        tipo: 'alerta',
        textoConfirmar: 'Confirmar Inasistencia',
        textoCancelar: 'Cancelar',
        onConfirm: () => handleConfirmarInasistencia(turno, nombrePaciente),
        textoSecondaryAction: 'Reprogramar Cita',
        tipoSecondaryAction: 'petroleo',
        onSecondaryAction: () => {
          handleCerrarModalConfirm();
          setModalReprogramar({
            isOpen: true,
            turno: turno
          });
        }
      });
      return;
    }

    if (accionEstado === 'Cancelado') {
      setModalConfirm({
        isOpen: true,
        titulo: 'Cancelar Turno',
        mensaje: (
          <p>
            ¿Estás seguro de cancelar la cita de <strong>{nombrePaciente}</strong> ({turno.hora} hs)?
            El turno se marcará como cancelado en la base de datos y podrás liberar el horario si lo deseas.
          </p>
        ),
        tipo: 'peligro',
        textoConfirmar: 'Sí, cancelar turno',
        textoCancelar: 'Volver',
        onConfirm: async () => {
          try {
            await cambiarEstadoTurno(turno.id_turno, 'Cancelado', fechaSeleccionada);
            const turnosActualizados = await getTurnosDia(fechaSeleccionada);
            setTurnos(turnosActualizados);
            mostrarToast(`Turno de las ${turno.hora} hs cancelado correctamente.`);
          } catch (err) {
            console.error('Error al cancelar turno:', err);
            mostrarToast('Error al cancelar el turno.');
          } finally {
            handleCerrarModalConfirm();
          }
        }
      });
      return;
    }

    if (accionEstado === 'Liberar') {
      setModalConfirm({
        isOpen: true,
        titulo: 'Liberar Franja Horaria',
        mensaje: (
          <p>
            ¿Deseas liberar la franja de las <strong>{turno.hora} hs</strong>?
            El horario volverá a quedar disponible como un hueco libre para que puedas agendar un nuevo paciente.
          </p>
        ),
        tipo: 'alerta',
        textoConfirmar: 'Liberar Horario',
        textoCancelar: 'Mantener Registro',
        onConfirm: async () => {
          try {
            await liberarTurno(turno.id_turno);
            await cargarTurnos();
            mostrarToast(`Horario de las ${turno.hora} hs liberado para nueva asignación.`);
          } catch (err) {
            console.error('Error al liberar franja:', err);
            mostrarToast('Error al liberar el turno.');
          } finally {
            handleCerrarModalConfirm();
          }
        }
      });
    }
  };


  const handleAbrirNuevoTurnoGlobal = () => {
    if (esDiaPasado) return;
    setModalAsignar({
      isOpen: true,
      slot: null,
      modoLibre: true
    });
  };

  const handleAgendarEnBache = (fila) => {
    if (esDiaPasado) return;
    setModalAsignar({
      isOpen: true,
      slot: {
        fecha: fechaSeleccionada,
        hora: fila.horaInicio,
        duracionMinutos: fila.duracionMinutos,
        duracionMaxIntervalo: fila.duracionMinutos,
        horaFin: fila.horaFin
      },
      modoLibre: false
    });
  };

  const handleConfirmarAsignacion = async (datosTurno) => {
    try {
      const fechaTurnoAsignado = datosTurno.fecha || fechaSeleccionada;
      const nuevoTurno = await crearTurno(datosTurno);

      if (fechaTurnoAsignado !== fechaSeleccionada) {
        setFechaSeleccionada(fechaTurnoAsignado);
      } else {
        await cargarTurnos();
      }

      const pacienteNombre = nuevoTurno?.paciente
        ? `${nuevoTurno.paciente.nombre} ${nuevoTurno.paciente.apellido}`
        : 'el paciente';
      const horaStr = nuevoTurno?.hora || datosTurno.hora || '';

      mostrarToast(
        `¡Turno agendado con éxito para ${pacienteNombre} el ${fechaTurnoAsignado}${horaStr ? ` a las ${horaStr} hs` : ''}!`
      );
    } catch (err) {
      console.error('Error al registrar turno:', err);
      alert('Error al asignar el turno.');
    }
  };

  const handleConfirmarReprogramacion = async (idTurnoOriginal, nuevaFecha, nuevaHora) => {
    try {
      await reprogramarTurno(idTurnoOriginal, nuevaFecha, nuevaHora);
      await cargarTurnos();
      mostrarToast(`¡Turno reprogramado con éxito para el ${nuevaFecha} a las ${nuevaHora} hs!`);
      setModalReprogramar({ isOpen: false, turno: null });
    } catch (err) {
      console.error('Error al reprogramar turno:', err);
      alert('Error al reprogramar el turno.');
    }
  };

  const handleAbrirDetalleConsulta = (turno) => {
    const turnoFresco = turnos.find((t) => t.id_turno === turno.id_turno) || turno;
    setModalDetalle({
      isOpen: true,
      turno: turnoFresco
    });
  };

  const handleGuardarNotasConsulta = async (idTurno, nuevasNotas) => {
    try {
      await actualizarNotasConsulta(idTurno, nuevasNotas, fechaSeleccionada);
      await cargarTurnos();
      mostrarToast('Observaciones clínicas guardadas con éxito.');
      setModalDetalle({ isOpen: false, turno: null });
    } catch (err) {
      console.error('Error al guardar observaciones clínicas:', err);
      alert('Ocurrió un error al guardar las observaciones clínicas.');
    }
  };

  const handleCerrarModalDetalle = async () => {
    setModalDetalle({ isOpen: false, turno: null });
    await cargarTurnos();
  };

  const conteos = useMemo(() => {
    const turnosOcupados = turnos.filter((t) => !t.es_disponible && Boolean(t.id_turno));
    return {
      todos: turnosOcupados.length,
      programados: turnosOcupados.filter((t) => t.id_estado === 1 || t.id_estado === 2).length,
      atendidos: turnosOcupados.filter((t) => t.id_estado === 4).length,
      otros: turnosOcupados.filter((t) => t.id_estado === 3 || t.id_estado === 5).length
    };
  }, [turnos]);

  const turnosFiltrados = useMemo(() => {
    const turnosReales = turnos.filter((t) => !t.es_disponible && Boolean(t.id_turno));
    switch (filtroEstado) {
      case 'programados':
        return turnosReales.filter((t) => t.id_estado === 1 || t.id_estado === 2);
      case 'atendidos':
        return turnosReales.filter((t) => t.id_estado === 4);
      case 'otros':
        return turnosReales.filter((t) => t.id_estado === 3 || t.id_estado === 5);
      case 'todos':
      default:
        return turnosReales;
    }
  }, [turnos, filtroEstado]);

  const filasAgenda = useMemo(() => {
    return construirFilasAgendaConBaches(turnosFiltrados);
  }, [turnosFiltrados]);

  return (
    <div className="panel-diario-page app-page-wrapper">
      <div className="panel-diario-card agenda-container app-view-container">
        <HeaderVolver
          title="Agenda Diaria"
          backPath="/pacientes"
        />

        <main className="panel-diario-content main-content">
          <section className="fecha-selector-container" aria-label="Navegación de fecha">
            <div className="fecha-navigation">
              <button
                type="button"
                className="btn-fecha-nav"
                onClick={() => handleDesplazarDia(-1)}
                title="Día anterior"
                aria-label="Ir al día anterior"
              >
                &lt;
              </button>

              <div className="fecha-heading-wrapper">
                <h2 className="fecha-texto-display" aria-live="polite">
                  {fechaFormateada}
                </h2>
              </div>

              <button
                type="button"
                className="btn-fecha-nav"
                onClick={() => handleDesplazarDia(1)}
                title="Día siguiente"
                aria-label="Ir al día siguiente"
              >
                &gt;
              </button>
            </div>

            <div className="fecha-quick-actions">
              {!esDiaPasado && (
                <button
                  type="button"
                  className="btn-nuevo-turno-fecha btn-nuevo-turno-global"
                  onClick={handleAbrirNuevoTurnoGlobal}
                  title="Registrar nuevo turno para cualquier fecha y horario hábil"
                  aria-label="Registrar nuevo turno"
                >
                  <span className="btn-nuevo-turno-plus">+</span> Nuevo Turno
                </button>
              )}

              <button
                type="button"
                className="btn-hoy"
                onClick={handleIrAHoy}
                aria-label="Volver al día actual"
              >
                Hoy
              </button>

              <input
                type="date"
                className="input-fecha-picker"
                value={fechaSeleccionada}
                onChange={(e) => e.target.value && setFechaSeleccionada(e.target.value)}
                aria-label="Seleccionar fecha específica del calendario"
              />
            </div>
          </section>

          <section className="filtros-estado-bar" role="toolbar" aria-label="Filtros de estado de turnos">
            <button
              type="button"
              className={`filtro-pill-btn ${filtroEstado === 'todos' ? 'is-active' : ''}`}
              onClick={() => setFiltroEstado('todos')}
            >
              <span>Todos</span>
              <span className="filtro-contador">{conteos.todos}</span>
            </button>

            <button
              type="button"
              className={`filtro-pill-btn ${filtroEstado === 'programados' ? 'is-active' : ''}`}
              onClick={() => setFiltroEstado('programados')}
            >
              <span>{esDiaPasado ? 'Sin Registrar' : 'Programados'}</span>
              <span className="filtro-contador">{conteos.programados}</span>
            </button>

            <button
              type="button"
              className={`filtro-pill-btn ${filtroEstado === 'atendidos' ? 'is-active' : ''}`}
              onClick={() => setFiltroEstado('atendidos')}
            >
              <span>Atendidos</span>
              <span className="filtro-contador">{conteos.atendidos}</span>
            </button>

            <button
              type="button"
              className={`filtro-pill-btn ${filtroEstado === 'otros' ? 'is-active' : ''}`}
              onClick={() => setFiltroEstado('otros')}
            >
              <span>Otros</span>
              <span className="filtro-contador">{conteos.otros}</span>
            </button>
          </section>

          {feedbackMessage && (
            <div className="panel-feedback-toast" role="status" aria-live="polite">
              <span>{feedbackMessage}</span>
            </div>
          )}

          {cargando && (
            <div className="agenda-empty-state-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
              <div className="gestion-spinner" style={{ width: '28px', height: '28px', marginBottom: '12px' }}></div>
              <p style={{ color: '#64748b', fontWeight: 500, margin: 0 }}>Cargando agenda del día...</p>
            </div>
          )}

          {error && !cargando && (
            <div className="agenda-empty-state-card">
              <div className="agenda-empty-state-icon" aria-hidden="true">⚠️</div>
              <h3 className="agenda-empty-state-title" style={{ color: '#ef4444' }}>Error al cargar la agenda</h3>
              <p className="agenda-empty-state-desc">{error}</p>
              <button
                type="button"
                className="btn-empty-state-agendar"
                onClick={cargarTurnos}
              >
                Reintentar
              </button>
            </div>
          )}

          {!cargando && !error && turnosFiltrados.length === 0 && (
            <div className="agenda-empty-state-card">
              <div className="agenda-empty-state-icon" aria-hidden="true">📅</div>
              <h3 className="agenda-empty-state-title">
                {turnos.length === 0
                  ? 'No hay turnos programados para esta fecha.'
                  : 'No se encontraron turnos con el filtro seleccionado.'}
              </h3>
              <p className="agenda-empty-state-desc">
                {turnos.length === 0
                  ? (esDiaPasado
                      ? 'No se registraron citas odontológicas en esta fecha.'
                      : 'Puedes crear una nueva cita usando el botón de abajo o desde "+ Nuevo Turno" en la barra superior.')
                  : 'Prueba seleccionando otro estado en los filtros superiores o restablece a "Todos".'}
              </p>
              {!esDiaPasado && turnos.length === 0 && (
                <button
                  type="button"
                  className="btn-empty-state-agendar"
                  onClick={handleAbrirNuevoTurnoGlobal}
                  aria-label="Agendar nuevo turno para este día"
                >
                  <span className="btn-plus-icon">+</span> Agendar Turno
                </button>
              )}
            </div>
          )}

          {!cargando && !error && turnosFiltrados.length > 0 && (
            <div className="turnos-table-container">
              <table className="turnos-table">
                <thead>
                  <tr>
                    <th>Horario</th>
                    <th>Paciente</th>
                    <th>Obra Social</th>
                    <th>DNI</th>
                    <th>Práctica</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let turnoIndex = 0;
                    return filasAgenda.map((fila) => {
                      if (fila.tipo === 'bache') {
                        return (
                          <tr key={fila.key} className="fila-bache-tiempo">
                            <td colSpan={7} className="cell-bache-tiempo">
                              <div className="bache-tiempo-content">
                                <span className="bache-tiempo-text">{fila.texto}</span>
                                <span className="bache-tiempo-line" />
                                {!esDiaPasado && (
                                  <button
                                    type="button"
                                    className="btn-bache-agendar"
                                    onClick={() => handleAgendarEnBache(fila)}
                                    title={`Agendar turno en el espacio disponible de ${fila.horaInicio} a ${fila.horaFin} hs`}
                                    aria-label={`Agendar turno en el espacio disponible de ${fila.horaInicio} a ${fila.horaFin} hs`}
                                  >
                                    + Agendar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const t = fila.turno;
                      const isZebra = turnoIndex % 2 === 1;
                      turnoIndex++;

                      return (
                        <TurnoFilaCard
                          key={fila.key}
                          turno={t}
                          hora={fila.hora}
                          horaFin={fila.horaFin}
                          bloques={fila.bloques}
                          duracionMinutos={fila.duracionMinutos}
                          mode="table-row"
                          isZebra={isZebra}
                          esDiaPasado={esDiaPasado}
                          onIniciarAtencion={handleIniciarAtencion}
                          onRegistrarAtencion={handleRegistrarAtencion}
                          onPedirConfirmacion={handlePedirConfirmacion}
                          onVerDetalle={handleAbrirDetalleConsulta}
                        />
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}

          {!cargando && !error && turnosFiltrados.length > 0 && (
            <div className="turnos-cards-mobile">
              {(() => {
                let turnoIndex = 0;
                return filasAgenda.map((fila) => {
                  if (fila.tipo === 'bache') {
                    return (
                      <div key={fila.key} className="bache-tiempo-mobile">
                        <span className="bache-tiempo-mobile-text">{fila.texto}</span>
                        {!esDiaPasado && (
                          <button
                            type="button"
                            className="btn-bache-agendar"
                            onClick={() => handleAgendarEnBache(fila)}
                            title={`Agendar turno en el espacio disponible de ${fila.horaInicio} a ${fila.horaFin} hs`}
                            aria-label={`Agendar turno en el espacio disponible de ${fila.horaInicio} a ${fila.horaFin} hs`}
                          >
                            + Agendar
                          </button>
                        )}
                      </div>
                    );
                  }

                  const t = fila.turno;
                  const isZebra = turnoIndex % 2 === 1;
                  turnoIndex++;

                  return (
                    <TurnoFilaCard
                      key={`mob-${fila.key}`}
                      turno={t}
                      hora={fila.hora}
                      horaFin={fila.horaFin}
                      bloques={fila.bloques}
                      duracionMinutos={fila.duracionMinutos}
                      mode="mobile-card"
                      isZebra={isZebra}
                      esDiaPasado={esDiaPasado}
                      onIniciarAtencion={handleIniciarAtencion}
                      onRegistrarAtencion={handleRegistrarAtencion}
                      onPedirConfirmacion={handlePedirConfirmacion}
                      onVerDetalle={handleAbrirDetalleConsulta}
                    />
                  );
                });
              })()}
            </div>
          )}
        </main>
      </div>

      <ModalConfirmacion
        isOpen={modalConfirm.isOpen}
        onClose={handleCerrarModalConfirm}
        onConfirm={modalConfirm.onConfirm}
        titulo={modalConfirm.titulo}
        mensaje={modalConfirm.mensaje}
        tipo={modalConfirm.tipo}
        textoConfirmar={modalConfirm.textoConfirmar}
        textoCancelar={modalConfirm.textoCancelar || 'Volver / No'}
        onSecondaryAction={modalConfirm.onSecondaryAction}
        textoSecondaryAction={modalConfirm.textoSecondaryAction}
        tipoSecondaryAction={modalConfirm.tipoSecondaryAction}
      />

      <ModalAsignarTurno
        isOpen={modalAsignar.isOpen}
        onClose={() => setModalAsignar({ isOpen: false, slot: null, modoLibre: false })}
        onAsignarTurno={handleConfirmarAsignacion}
        slotData={modalAsignar.slot}
        fechaSeleccionada={fechaSeleccionada}
        modoLibre={modalAsignar.modoLibre}
      />

      <ModalReprogramarTurno
        isOpen={modalReprogramar.isOpen}
        turno={modalReprogramar.turno}
        onClose={() => setModalReprogramar({ isOpen: false, turno: null })}
        onConfirmar={handleConfirmarReprogramacion}
        onTurnoReprogramado={async () => {
          const turnosActualizados = await getTurnosDia(fechaSeleccionada);
          setTurnos(turnosActualizados);
        }}
      />

      <ModalDetalleConsulta
        key={`detalle-${modalDetalle.turno?.id_turno || 'none'}`}
        isOpen={modalDetalle.isOpen}
        turno={modalDetalle.turno}
        onClose={handleCerrarModalDetalle}
        onGuardar={handleGuardarNotasConsulta}
      />

      <ModalRegistrarAtencion
        key={`registrar-${modalRegistrarAtencion.turno?.id_turno || 'none'}`}
        isOpen={modalRegistrarAtencion.isOpen}
        turno={modalRegistrarAtencion.turno}
        onClose={handleCerrarModalRegistrarAtencion}
        onAtencionRegistrada={handleAtencionRegistrada}
        onConfirmar={handleAtencionRegistrada}
      />
    </div>
  );
};

export default AgendaDiaria;
