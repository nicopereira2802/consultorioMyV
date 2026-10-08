import { useState, useRef, useEffect } from 'react';
import { obtenerNombreCobertura } from '../utils/paciente.utils';

/**
 * TurnoFilaCard - Componente modular para renderizar un turno en la Agenda Diaria
 * Sincronizado con el esquema relacional:
 * TURNO: id_turno, id_paciente, id_estado, fecha_hora_inicio, fecha_hora_fin, notas_consulta
 * ESTADO_TURNO: 'Programado' (1), 'Reprogramado' (2), 'Cancelado' (3), 'Atendido' (4), 'Inasistente' (5)
 */
export const TurnoFilaCard = ({
  turno,
  hora: propHora,
  horaFin: propHoraFin,
  bloques: propBloques,
  duracionMinutos: propDuracionMinutos,
  isSubsumed = false,
  mode = 'table-row',
  isZebra = false,
  esDiaPasado = false,
  onIniciarAtencion,
  onRegistrarAtencion,
  onPedirConfirmacion,
  onAsignarTurno,
  onVerDetalle
}) => {
  const isDisponible = turno.es_disponible || !turno.id_turno;

  const hora = propHora || turno.hora || '08:00';
  const duracionMinutos = propDuracionMinutos || turno.duracion_minutos || turno.practica?.duracion_minutos || (propBloques ? propBloques * 15 : (turno.practica?.modulos ? turno.practica.modulos * 15 : 30));
  const horaFin = propHoraFin || (turno.fecha_hora_fin ? turno.fecha_hora_fin.slice(11, 16) : '');
  const bloques = propBloques || Math.max(1, Math.round(duracionMinutos / 15));

  const {
    id_estado,
    estado_nombre,
    paciente,
    practica
  } = turno;

  const estado = estado_nombre || (id_estado === 3 ? 'Atendido' : id_estado === 4 ? 'Inasistente' : id_estado === 2 ? 'Cancelado' : 'Programado');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const getBadgeClass = () => {
    if (isDisponible) return 'badge-disponible';
    switch (id_estado) {
      case 1:
        return 'badge-confirmado';
      case 2:
        return 'badge-cancelado';
      case 3:
        return 'badge-realizado';
      case 4:
        return 'badge-inasistente';
      default:
        return 'badge-default';
    }
  };

  const nombreCompletoPaciente = paciente
    ? (paciente.nombre && paciente.apellido ? `${paciente.nombre} ${paciente.apellido}` : (paciente.nombre || paciente.apellido || 'Sin nombre'))
    : 'Horario Disponible';

  const practicasList = Array.isArray(turno.practicas_realizadas) && turno.practicas_realizadas.length > 0
    ? turno.practicas_realizadas
    : (Array.isArray(turno.practicas) && turno.practicas.length > 0
      ? turno.practicas
      : (turno.practica ? [turno.practica] : (practica ? [practica] : [])));

  const nombrePractica = practicasList.length > 0
    ? practicasList.map((p) => p.nombre_referencia || p.nombre_nomenclador || p.nombre || 'Práctica').join(' + ')
    : (practica?.nombre_referencia || practica?.nombre_nomenclador || 'Consulta Odontológica');
  const obraSocialNombre = obtenerNombreCobertura(paciente);

  const dispararAccion = (accionEstado) => {
    if (esDiaPasado) return;
    setIsMenuOpen(false);
    if (onPedirConfirmacion) {
      onPedirConfirmacion(turno, accionEstado);
    }
  };

  const renderAcciones = (isMobile = false) => {
    if (isDisponible) {
      if (esDiaPasado) {
        return isMobile ? null : (
          <div className="acciones-fila-wrapper">
            <span className="turno-status-historico">—</span>
          </div>
        );
      }

      return (
        <div className={isMobile ? 'mobile-card-actions-wrapper' : 'acciones-fila-wrapper'}>
          <button
            type="button"
            className="btn-action-asignar-unico btn-bache-agendar"
            onClick={() => onAsignarTurno && onAsignarTurno(turno)}
            title={`Agendar turno a las ${hora} hs`}
            aria-label={`Agendar turno a las ${hora} hs`}
          >
            + Agendar
          </button>
        </div>
      );
    }

    if (esDiaPasado && id_estado !== 3) {
      if (isMobile) return null;
      return (
        <div className="acciones-fila-wrapper">
          <span className="turno-status-historico">—</span>
        </div>
      );
    }

    const renderBotonPrincipal = () => {
      if (id_estado === 3) {
        return (
          <button
            type="button"
            className="btn-action-ver-consulta"
            onClick={() => onVerDetalle && onVerDetalle(turno)}
            title="Ver o editar ficha y observaciones clínicas"
            aria-label={`Ver consulta de ${nombreCompletoPaciente}`}
          >
            <span className="btn-icon" aria-hidden="true">📝</span>
            <span>Ver Consulta</span>
          </button>
        );
      }

      if (id_estado === 1) {
        const handleRegistrar = onRegistrarAtencion || onIniciarAtencion;
        return (
          <button
            type="button"
            className="btn-action-iniciar-destacado"
            onClick={() => handleRegistrar && handleRegistrar(turno)}
            title={`Registrar atención de ${nombreCompletoPaciente}`}
            aria-label={`Registrar atención de ${nombreCompletoPaciente}`}
          >
            Registrar Atención
          </button>
        );
      }

      if (id_estado === 2 || id_estado === 4) {
        return (
          <button
            type="button"
            className="btn-action-liberar-limpio btn-liberar"
            onClick={() => dispararAccion('Liberar')}
            title="Liberar este horario para registrar un nuevo turno"
            aria-label={`Liberar horario de las ${hora} hs`}
          >
            Liberar
          </button>
        );
      }

      return null;
    };

    if (isMobile) {
      if (id_estado === 1) {
        const handleRegistrar = onRegistrarAtencion || onIniciarAtencion;
        return (
          <div className="mobile-card-actions-wrapper">
            <button
              type="button"
              className="btn-action-iniciar-destacado"
              onClick={() => handleRegistrar && handleRegistrar(turno)}
              aria-label={`Registrar atención de ${nombreCompletoPaciente}`}
            >
              Registrar Atención
            </button>
            <div className="mobile-card-secondary-row">
              <button
                type="button"
                className="btn-mobile-secondary-inasistencia"
                onClick={() => dispararAccion('Inasistente')}
                aria-label={`Registrar inasistencia de ${nombreCompletoPaciente}`}
              >
                Inasistente
              </button>
              <button
                type="button"
                className="btn-mobile-secondary-cancelar"
                onClick={() => dispararAccion('Cancelado')}
                aria-label={`Cancelar turno de ${nombreCompletoPaciente}`}
              >
                Cancelar
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="mobile-card-actions-wrapper">
          {renderBotonPrincipal()}
        </div>
      );
    }

    const tieneOpcionesSecundarias = !esDiaPasado && (id_estado === 1 || id_estado === 4);

    return (
      <div className="acciones-fila-wrapper">
        {renderBotonPrincipal()}

        {tieneOpcionesSecundarias && (
          <div className="menu-opciones-wrapper" ref={menuRef}>
            <button
              type="button"
              className={`btn-opciones-turno ${isMenuOpen ? 'is-open' : ''}`}
              title="Más opciones"
              aria-label="Más opciones"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              •••
            </button>

            {isMenuOpen && (
              <div className="dropdown-opciones-menu" role="menu">
                {id_estado === 1 && (
                  <button
                    type="button"
                    className="dropdown-opciones-item inasistencia"
                    onClick={() => dispararAccion('Inasistente')}
                    role="menuitem"
                  >
                    <span>⚠️</span> Registrar Inasistente
                  </button>
                )}
                <button
                  type="button"
                  className="dropdown-opciones-item cancelar"
                  onClick={() => dispararAccion('Cancelado')}
                  role="menuitem"
                >
                  <span>✕</span> Cancelar Turno
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isSubsumed) {
    if (mode === 'table-row') {
      return (
        <tr className="turno-table-row row-subsumida">
          <td className="cell-hora cell-hora-subsumida">
            <span className="texto-hora-subsumida">{hora}</span>
          </td>
        </tr>
      );
    }
    return null;
  }

  if (mode === 'table-row') {
    if (isDisponible) {
      return (
        <tr className={`turno-table-row row-disponible ${esDiaPasado ? 'row-historico-no-utilizado' : ''}`}>
          <td className="cell-hora">
            <strong className="hora-libre-text">{hora}</strong>
          </td>
          <td colSpan={6} className="cell-espacio-libre">
            <div className="espacio-libre-content">
              <span className={`texto-espacio-libre ${esDiaPasado ? 'text-no-utilizado' : ''}`}>
                {esDiaPasado ? 'Horario no utilizado' : 'Espacio libre para agendar'}
              </span>
            </div>
          </td>
          <td className="cell-acciones">
            {renderAcciones(false)}
          </td>
        </tr>
      );
    }

    return (
      <tr
        className={`turno-table-row ${
          id_estado === 4
            ? 'row-atendido'
            : id_estado === 5
            ? 'row-inasistente'
            : isZebra
            ? 'row-zebra-even'
            : 'row-zebra-odd'
        }`}
      >
        <td className="cell-hora">
          <div className="celda-horario hora-cell-stack">
            <span className="horario-texto hora-principal">
              {horaFin && horaFin !== hora ? `${hora} - ${horaFin} hs` : `${hora} hs`}
            </span>
            <span className="horario-duracion hora-rango-sub">{duracionMinutos} min</span>
          </div>
        </td>
        <td className="cell-paciente">
          <span className="text-paciente">{nombreCompletoPaciente}</span>
        </td>
        <td className="cell-obra-social">
          <span className="badge-obra-social">{obraSocialNombre}</span>
        </td>
        <td className="cell-dni">{paciente?.dni || '-'}</td>
        <td className="cell-practica">{nombrePractica}</td>
        <td className="cell-estado">
          {esDiaPasado && (id_estado === 1 || id_estado === 2) ? (
            <span className="turno-status-historico" title="Cita no registrada en la jornada">—</span>
          ) : (
            <span className={`badge-estado ${getBadgeClass()}`}>{estado}</span>
          )}
        </td>
        <td className="cell-acciones">{renderAcciones(false)}</td>
      </tr>
    );
  }

  if (isDisponible) {
    return (
      <article className={`turno-card-mobile card-disponible ${esDiaPasado ? 'card-historico-no-utilizado' : ''}`}>
        <div className="card-disponible-header">
          <span className="card-hora">{hora} hs</span>
          <span className={`texto-espacio-libre-mobile ${esDiaPasado ? 'text-no-utilizado' : ''}`}>
            {esDiaPasado ? 'Horario no utilizado' : 'Espacio libre para agendar'}
          </span>
        </div>
        {!esDiaPasado && (
          <div className="card-disponible-footer">
            <button
              type="button"
              className="btn-action-asignar-unico btn-bache-agendar"
              onClick={() => onAsignarTurno && onAsignarTurno(turno)}
              aria-label={`Agendar turno a las ${hora} hs`}
            >
              + Agendar
            </button>
          </div>
        )}
      </article>
    );
  }

  return (
    <article
      className={`turno-card-mobile ${
        id_estado === 4
          ? 'card-atendido'
          : id_estado === 5
          ? 'card-inasistente'
          : isZebra
          ? 'card-zebra-even'
          : 'card-zebra-odd'
      }`}
    >
      <div className="turno-card-header">
        <div className="turno-card-time-badge">
          <span className="card-hora">
            {bloques > 1 && horaFin ? `${hora} a ${horaFin} hs` : `${hora} hs`}
          </span>
          <span className="card-duracion">
            {duracionMinutos} min
          </span>
        </div>
        {esDiaPasado && (id_estado === 1 || id_estado === 2) ? (
          <span className="turno-status-historico" title="Cita no registrada en la jornada">—</span>
        ) : (
          <span className={`badge-estado ${getBadgeClass()}`}>
            {estado}
          </span>
        )}
      </div>

      <div className="turno-card-body">
        <h3 className="turno-card-paciente">
          {nombreCompletoPaciente}
        </h3>

        <div className="turno-card-details">
          <div className="card-detail-item">
            <strong>Obra Social:</strong>{' '}
            <span className="badge-obra-social">
              {obraSocialNombre}
            </span>
          </div>
          <div className="card-detail-item">
            <strong>Práctica:</strong> <span>{nombrePractica}</span>
          </div>
          <div className="card-detail-item">
            <strong>DNI:</strong> <span>{paciente?.dni || '-'}</span>
          </div>
          {paciente?.telefono && paciente.telefono !== '-' && (
            <div className="card-detail-item">
              <strong>Teléfono:</strong> <span>{paciente.telefono}</span>
            </div>
          )}
        </div>
      </div>

      <div className={`turno-card-footer ${esDiaPasado ? 'footer-historico' : ''}`}>
        {renderAcciones(true)}
      </div>
    </article>
  );
};

export default TurnoFilaCard;
