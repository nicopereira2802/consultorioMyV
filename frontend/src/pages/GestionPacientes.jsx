import { useState, useEffect, useCallback, useMemo } from 'react';
import HeaderVolver from '../components/header';
import ModalPaciente from '../components/ModalPaciente';
import ModalHistorialPaciente from '../components/ModalHistorialPaciente';
import ModalFichaPaciente from '../components/ModalFichaPaciente';
import ModalConfirmarEliminacion from '../components/ModalConfirmarEliminacion';
import { getPacientes, eliminarPaciente } from '../services/pacientes.service';
import './GestionPacientes.css';

/**
 * GestionPacientes - Pantalla oficial de administración y búsqueda de pacientes M&V Turnos
 * Réplica fiel del diseño visual alineada a la base de datos relacional:
 * PACIENTE: id_paciente, nombre, apellido, dni, fecha_nacimiento, telefono, email, domicilio
 * PACIENTE_OBRA_SOCIAL: id_paciente, id_obra_social, nro_afiliado
 */
export const GestionPacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [busqueda, setBusquedaState] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const [isModalPacienteOpen, setIsModalPacienteOpen] = useState(false);
  const [pacienteAEditar, setPacienteAEditar] = useState(null);
  const [pacienteHistorial, setPacienteHistorial] = useState(null);
  const [pacienteFicha, setPacienteFicha] = useState(null);
  const [pacienteAEliminar, setPacienteAEliminar] = useState(null);
  const [isEliminando, setIsEliminando] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const pacientesPorPagina = 8;

  const setBusqueda = useCallback((val) => {
    setBusquedaState(val);
    setPaginaActual(1);
  }, []);

  const pacientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return pacientes;

    const queryDni = q.replace(/\D/g, '');

    return pacientes.filter((p) => {
      const nombre = (p.nombre || '').toLowerCase();
      const apellido = (p.apellido || '').toLowerCase();
      const nombreCompleto = `${nombre} ${apellido}`;
      const apellidoNombre = `${apellido} ${nombre}`;
      const dni = String(p.dni || '').replace(/\D/g, '');
      const obraSocial = (
        typeof p.obra_social === 'object' ? p.obra_social?.nombre || '' : String(p.obra_social || '')
      ).toLowerCase();
      const telefono = (p.telefono || '').toLowerCase();

      const matchTexto =
        nombre.includes(q) ||
        apellido.includes(q) ||
        nombreCompleto.includes(q) ||
        apellidoNombre.includes(q) ||
        obraSocial.includes(q) ||
        telefono.includes(q);

      const matchDni = queryDni.length > 0 && dni.includes(queryDni);

      return matchTexto || matchDni;
    });
  }, [pacientes, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(pacientesFiltrados.length / pacientesPorPagina));
  const indiceInicio = (paginaActual - 1) * pacientesPorPagina;
  const pacientesVisibles = pacientesFiltrados.slice(indiceInicio, indiceInicio + pacientesPorPagina);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const cargarPacientes = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await getPacientes();
      setPacientes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al obtener pacientes:', err);
      setError(err?.message || 'Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarPacientes();
  }, [cargarPacientes]);

  const handleAbrirNuevoPaciente = () => {
    setPacienteAEditar(null);
    setIsModalPacienteOpen(true);
  };
  const handleAbrirNuevo = handleAbrirNuevoPaciente;

  const handleAbrirEditar = (paciente) => {
    setPacienteAEditar(paciente);
    setIsModalPacienteOpen(true);
  };

  const handleCerrarModalPaciente = () => {
    setIsModalPacienteOpen(false);
    setPacienteAEditar(null);
  };

  const handlePacienteGuardado = async (_paciente, accion) => {
    await cargarPacientes();
    const mensaje = accion === 'editado'
      ? '¡Modificaciones del paciente guardadas con éxito!'
      : '¡Paciente registrado con éxito en el sistema!';
    setToastMsg(mensaje);
    setTimeout(() => {
      setToastMsg('');
    }, 3800);
  };

  const handleVerHistorial = (paciente) => {
    setPacienteHistorial(paciente);
  };

  const handleCerrarHistorial = () => {
    setPacienteHistorial(null);
  };

  const handleVerFicha = (paciente) => {
    setPacienteFicha(paciente);
  };

  const handleCerrarFicha = () => {
    setPacienteFicha(null);
  };

  const handleEditarDesdeFicha = (paciente) => {
    setPacienteFicha(null);
    handleAbrirEditar(paciente);
  };

  const handleAbrirEliminar = (paciente) => {
    setPacienteAEliminar(paciente);
  };

  const handleCerrarEliminar = () => {
    if (!isEliminando) {
      setPacienteAEliminar(null);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!pacienteAEliminar) return;
    try {
      setIsEliminando(true);
      await eliminarPaciente(pacienteAEliminar.id_paciente);
      const nombreEliminado = `${pacienteAEliminar.nombre} ${pacienteAEliminar.apellido}`;
      setPacienteAEliminar(null);
      await cargarPacientes();
      setPaginaActual((prev) => {
        const nuevoTotal = Math.ceil((pacientes.length - 1) / pacientesPorPagina) || 1;
        return prev > nuevoTotal ? nuevoTotal : prev;
      });
      setToastMsg(`El paciente ${nombreEliminado} ha sido dado de baja con éxito.`);
      setTimeout(() => {
        setToastMsg('');
      }, 3800);
    } catch (error) {
      console.error('Error al dar de baja al paciente:', error);
      setToastMsg('Error al dar de baja al paciente.');
    } finally {
      setIsEliminando(false);
    }
  };

  const getObraSocialBadgeClass = (obraSocialNombre) => {
    if (!obraSocialNombre || obraSocialNombre.toLowerCase() === 'particular') {
      return 'badge-particular';
    }
    return 'badge-prepaga';
  };

  const tieneDatosIncompletos = (paciente) => {
    if (!paciente) return false;
    const cleanStr = (val) => (val ? String(val).trim() : '');
    const isVacio = (val) => {
      const s = cleanStr(val);
      return !s || s === 'S/D' || s === 'S/N' || s === '-';
    };

    const faltaDni = isVacio(paciente.dni);
    const faltaTelefono = isVacio(paciente.telefono);
    const faltaEmail = isVacio(paciente.email);
    const faltaDomicilio = isVacio(paciente.domicilio) && isVacio(paciente.direccion);

    let faltaObraSocial = false;
    if (!paciente.obra_social || paciente.obra_social === 'S/N' || paciente.obra_social === 'S/D') {
      faltaObraSocial = true;
    } else if (typeof paciente.obra_social === 'object') {
      if (!paciente.obra_social.nombre && !paciente.obra_social.id_obra_social) {
        faltaObraSocial = true;
      }
    }

    return (
      faltaDni ||
      faltaTelefono ||
      faltaObraSocial ||
      faltaEmail ||
      faltaDomicilio ||
      paciente.datos_completos === false
    );
  };
  const esPacienteIncompleto = tieneDatosIncompletos;

  const headerActions = (
    <button
      type="button"
      className="btn-nuevo-paciente-header"
      onClick={handleAbrirNuevoPaciente}
      aria-label="Registrar nuevo paciente"
    >
      <span className="btn-nuevo-plus" aria-hidden="true">+</span>
      <span>Nuevo Paciente</span>
    </button>
  );

  return (
    <div className="gestion-pacientes-page app-page-wrapper">
      <div className="gestion-pacientes-card pacientes-container app-view-container">
        <HeaderVolver
          title="Gestión de Pacientes"
          backPath="/agenda"
          backText="Volver"
          showBack={true}
          actions={headerActions}
        />

        <main className="gestion-pacientes-content main-content">
          {toastMsg && (
            <div className="gestion-pacientes-toast" role="status" aria-live="polite">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{toastMsg}</span>
            </div>
          )}

          <div className="buscador-contenedor">
            <div className="input-busqueda-wrapper">
              <svg 
                className="icono-lupa" 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#94a3b8" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>

              <input
                type="text"
                className="input-busqueda"
                placeholder="Buscar por Nombre, Apellido, DNI u Obra Social..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar por Nombre, Apellido, DNI u Obra Social"
              />
            </div>

            <span className="contador-registros">
              {pacientesFiltrados.length} de {pacientes.length} pacientes
            </span>
          </div>

          {cargando && (
            <div className="gestion-state-box">
              <div className="gestion-spinner"></div>
              <p>Consultando base de pacientes...</p>
            </div>
          )}

          {error && !cargando && (
            <div className="gestion-state-box">
              <div className="agenda-empty-state-icon" aria-hidden="true" style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
              <p style={{ color: '#ef4444', fontWeight: 600 }}>{error}</p>
              <button
                type="button"
                className="btn-state-action"
                onClick={cargarPacientes}
                style={{ marginTop: '12px' }}
              >
                Reintentar
              </button>
            </div>
          )}

          {!cargando && !error && pacientesFiltrados.length === 0 && (
            <div className="gestion-state-box">
              <p>
                {busqueda.trim()
                  ? `No se encontraron pacientes que coincidan con "${busqueda}".`
                  : "No hay pacientes registrados. Pulsa el botón '+' para agregar el primero."}
              </p>
              <button
                type="button"
                className="btn-state-action"
                onClick={handleAbrirNuevo}
              >
                + Registrar Primer Paciente
              </button>
            </div>
          )}

          {!cargando && !error && pacientesFiltrados.length > 0 && (
            <div className="pacientes-table-container">
              <table className="pacientes-table">
                <thead>
                  <tr>
                    <th>Nombre y Apellido</th>
                    <th>DNI</th>
                    <th>Teléfono</th>
                    <th>Obra Social</th>
                    <th className="th-acciones">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientesVisibles.map((p) => {
                    const osNombre = p.obra_social?.nombre || 'Particular';

                    return (
                      <tr key={p.id_paciente}>
                        <td className="td-nombre">
                          <div className="td-nombre-wrapper">
                            <strong>
                              {p.apellido ? `${p.apellido}, ${p.nombre}` : p.nombre}
                            </strong>
                            {esPacienteIncompleto(p) && (
                              <span className="badge-incompleto" title="Ficha con datos pendientes de completar (DNI, domicilio u obra social)">
                                ⚠️ Faltan datos
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="td-dni">{p.dni}</td>
                        <td className="td-telefono">
                          {p.telefono && p.telefono.trim() && p.telefono !== 'S/D' ? p.telefono : '-'}
                        </td>
                        <td className="td-os">
                          <span className={`paciente-badge-os ${getObraSocialBadgeClass(osNombre)}`}>
                            {osNombre}
                          </span>
                        </td>
                        <td className="td-acciones">
                          <div className="td-acciones-group">
                            <button
                              type="button"
                              className="btn-action-historial"
                              onClick={() => handleVerHistorial(p)}
                              aria-label={`Ver historial de ${p.nombre} ${p.apellido}`}
                              title="Historial Clínico"
                            >
                              Historial
                            </button>

                            <button
                              type="button"
                              className="btn-action-icon btn-action-ficha"
                              onClick={() => handleVerFicha(p)}
                              aria-label={`Ver ficha de ${p.nombre} ${p.apellido}`}
                              title="Ver Ficha / Consultar"
                            >
                              <svg
                                width="17"
                                height="17"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              className="btn-action-icon btn-action-editar"
                              onClick={() => handleAbrirEditar(p)}
                              aria-label={`Editar datos de ${p.nombre} ${p.apellido}`}
                              title="Editar Paciente"
                            >
                              <svg
                                width="17"
                                height="17"
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
                            </button>

                            <button
                              type="button"
                              className="btn-action-icon btn-action-eliminar"
                              onClick={() => handleAbrirEliminar(p)}
                              aria-label={`Eliminar a ${p.nombre} ${p.apellido}`}
                              title="Eliminar Paciente"
                            >
                              <svg
                                width="17"
                                height="17"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!cargando && !error && pacientesFiltrados.length > 0 && (
            <div className="pacientes-cards-mobile">
              {pacientesVisibles.map((p) => {
                const osNombre = p.obra_social?.nombre || 'Particular';

                return (
                  <article key={p.id_paciente} className="paciente-card-item">
                    <div className="paciente-card-top">
                      <div className="paciente-card-title-group">
                        <h3 className="paciente-card-title">
                          {p.apellido ? `${p.apellido}, ${p.nombre}` : p.nombre}
                        </h3>
                        {esPacienteIncompleto(p) && (
                          <span className="badge-incompleto" title="Ficha con datos pendientes de completar (DNI, domicilio u obra social)">
                            ⚠️ Faltan datos
                          </span>
                        )}
                      </div>
                      <div className="paciente-card-badges">
                        <span className={`paciente-badge-os ${getObraSocialBadgeClass(osNombre)}`}>
                          {osNombre}
                        </span>
                      </div>
                    </div>

                    <div className="paciente-card-details">
                      <div className="card-detail-item">
                        <span className="card-detail-label">DNI:</span>
                        <strong className="card-detail-val">{p.dni}</strong>
                      </div>
                      <div className="card-detail-item">
                        <span className="card-detail-label">Teléfono:</span>
                        <span className="card-detail-val">
                          {p.telefono && p.telefono.trim() && p.telefono !== 'S/D' ? p.telefono : '-'}
                        </span>
                      </div>
                      {p.domicilio && (
                        <div className="card-detail-item">
                          <span className="card-detail-label">Domicilio:</span>
                          <span className="card-detail-val">{p.domicilio}</span>
                        </div>
                      )}
                    </div>

                    <div className="paciente-card-actions-wrapper">
                      <button
                        type="button"
                        className="btn-card-historial"
                        onClick={() => handleVerHistorial(p)}
                        aria-label={`Ver historial de ${p.nombre} ${p.apellido}`}
                      >
                        Historial
                      </button>
                      <div className="paciente-card-secondary-group">
                        <button
                          type="button"
                          className="btn-card-subaction btn-card-subaction-ficha"
                          onClick={() => handleVerFicha(p)}
                          aria-label={`Ver ficha de ${p.nombre} ${p.apellido}`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span>Ficha</span>
                        </button>
                        <button
                          type="button"
                          className="btn-card-subaction btn-card-subaction-editar"
                          onClick={() => handleAbrirEditar(p)}
                          aria-label={`Editar a ${p.nombre} ${p.apellido}`}
                        >
                          <svg
                            width="14"
                            height="14"
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
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          className="btn-card-subaction btn-card-subaction-eliminar"
                          onClick={() => handleAbrirEliminar(p)}
                          aria-label={`Eliminar a ${p.nombre} ${p.apellido}`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!cargando && !error && pacientesFiltrados.length > 0 && (
            <div className="paginacion-contenedor">
              <button 
                type="button"
                className="btn-paginacion" 
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                aria-label="Página anterior"
              >
                ‹
              </button>

              <span className="texto-paginacion">
                Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong>
              </span>

              <button 
                type="button"
                className="btn-paginacion" 
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                aria-label="Página siguiente"
              >
                ›
              </button>
            </div>
          )}
        </main>
      </div>

      <ModalPaciente
        isOpen={isModalPacienteOpen}
        onClose={handleCerrarModalPaciente}
        paciente={pacienteAEditar}
        onPacienteGuardado={handlePacienteGuardado}
      />

      <ModalHistorialPaciente
        isOpen={Boolean(pacienteHistorial)}
        onClose={handleCerrarHistorial}
        paciente={pacienteHistorial}
      />

      <ModalFichaPaciente
        isOpen={Boolean(pacienteFicha)}
        onClose={handleCerrarFicha}
        paciente={pacienteFicha}
        onEditar={handleEditarDesdeFicha}
      />

      <ModalConfirmarEliminacion
        isOpen={Boolean(pacienteAEliminar)}
        onClose={handleCerrarEliminar}
        onConfirm={handleConfirmarEliminar}
        titulo="Eliminar Paciente"
        mensaje={
          pacienteAEliminar
            ? `¿Estás seguro de que deseas eliminar al paciente "${pacienteAEliminar.nombre} ${pacienteAEliminar.apellido}" (DNI: ${pacienteAEliminar.dni})?`
            : ''
        }
        subtexto="Esta acción quitará al paciente de la lista activa y no podrá deshacerse (su historial clínico se mantendrá preservado)."
        textoConfirmar="Eliminar Paciente"
        textoCancelar="Cancelar"
        isLoading={isEliminando}
      />

      <button 
        type="button" 
        className="btn-flotante-agregar"  
        onClick={handleAbrirNuevoPaciente}
        aria-label="Agregar nuevo paciente"
      >
        +
      </button>
    </div>
  );
};

export default GestionPacientes;
