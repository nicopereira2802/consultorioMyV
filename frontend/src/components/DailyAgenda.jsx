import { useState } from "react";
import "./DailyAgenda.css";
import NewTurnoModal from "./NewTurnoModal";
import ModalConfirmacion from "./ModalConfirmacion";
import logoImg from "../assets/logo.jpeg";

const INITIAL_TURNOS = [
  {
    id: 1,
    horaInicio: "08:30",
    horaFin: "09:30",
    paciente: "Valeria Rossi",
    obraSocial: "OSDE",
    practica: "Perno y Corona",
    duracion: "60 min",
    estado: "ATENDIDO",
    siguienteEspacio: "09:30 a 10:00 (30 min)"
  },
  {
    id: 2,
    horaInicio: "10:00",
    horaFin: "10:15",
    paciente: "Martín Gómez",
    obraSocial: "Swiss Medical",
    practica: "Consulta / Diagnóstico",
    duracion: "15 min",
    estado: "ATENDIDO",
    siguienteEspacio: "10:15 a 11:45 (1 h 30 min)"
  },
  {
    id: 3,
    horaInicio: "11:45",
    horaFin: "12:15",
    paciente: "Sofía Fernández",
    obraSocial: "Galeno",
    practica: "Limpieza y Profilaxis",
    duracion: "30 min",
    estado: "CANCELADO",
    siguienteEspacio: "12:15 a 14:30 (2 h 15 min)"
  },
  {
    id: 4,
    horaInicio: "14:30",
    horaFin: "15:00",
    paciente: "Carlos Benitez",
    obraSocial: "Particular",
    practica: "Restauración / Resina",
    duracion: "30 min",
    estado: "PROGRAMADO",
    siguienteEspacio: "15:00 a 16:15 (1 h 15 min)"
  },
  {
    id: 5,
    horaInicio: "16:15",
    horaFin: "17:00",
    paciente: "Lucía Navarro",
    obraSocial: "Medifé",
    practica: "Extracción Simple",
    duracion: "45 min",
    estado: "PROGRAMADO",
    siguienteEspacio: null
  }
];

export default function DailyAgenda({ onLock, onOpenCalendar }) {
  const [turnos, setTurnos] = useState(INITIAL_TURNOS);
  const [filtroActivo, setFiltroActivo] = useState("TODOS");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [menuOpenId, setMenuOpenId] = useState(null);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);

  const handleSaveTurno = (nuevo) => {
    setTurnos((prev) => [...prev, nuevo]);
  };

  // Abre directamente el modal de confirmación
  const handleAbrirCancelacion = (e, turno) => {
    e.preventDefault();
    e.stopPropagation();
    setTurnoSeleccionado(turno);
    setMenuOpenId(null);
    setShowConfirmModal(true);
  };

  // Recibe el motivo ingresado en el ModalConfirmacion
  const handleConfirmarCancelacionFinal = (motivoIngresado) => {
    if (!turnoSeleccionado) return;

    setTurnos((prev) =>
      prev.map((t) =>
        t.id === turnoSeleccionado.id
          ? { ...t, estado: "CANCELADO", motivo: motivoIngresado }
          : t
      )
    );

    setShowConfirmModal(false);
    setTurnoSeleccionado(null);
  };

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 1);
    setCurrentDate(next);
  };

  const formattedDate = currentDate.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const countTodos = turnos.length;
  const countProgramados = turnos.filter((t) => t.estado === "PROGRAMADO").length;
  const countAtendidos = turnos.filter((t) => t.estado === "ATENDIDO").length;
  const countOtros = turnos.filter(
    (t) => t.estado !== "PROGRAMADO" && t.estado !== "ATENDIDO"
  ).length;

  const turnosFiltrados = turnos.filter((t) => {
    if (filtroActivo === "PROGRAMADOS") return t.estado === "PROGRAMADO";
    if (filtroActivo === "ATENDIDOS") return t.estado === "ATENDIDO";
    if (filtroActivo === "OTROS")
      return t.estado !== "PROGRAMADO" && t.estado !== "ATENDIDO";
    return true;
  });

  return (
    <div className="agenda-page">
      <div className="agenda-card">
        {/* Header */}
        <header className="main-nav-bar">
          <div className="main-nav-left">
            <button className="btn-exit-arrow" onClick={onLock} title="Cerrar sesión">
              ←
            </button>
            <div className="nav-brand">
              <img src={logoImg} alt="M&V Logo" className="nav-logo" />
              <div>
                <h2>Agenda Diaria</h2>
                <span className="nav-subtitle">M&V Odontología</span>
              </div>
            </div>
          </div>

          <div className="main-nav-right">
            <button className="btn-calendar-nav" onClick={onOpenCalendar}>
              📅 Calendario
            </button>
          </div>
        </header>

        {/* Date Toolbar */}
        <div className="date-toolbar">
          <div className="date-navigator">
            <button className="date-nav-arrow" onClick={handlePrevDay}>‹</button>
            <span className="current-date-text">{displayDate}</span>
            <button className="date-nav-arrow" onClick={handleNextDay}>›</button>
          </div>

          <div className="toolbar-actions">
            <button className="btn-primary-action" onClick={() => setIsModalOpen(true)}>
              + Nuevo Turno
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="filters-bar">
          <button
            className={`filter-pill ${filtroActivo === "TODOS" ? "active" : ""}`}
            onClick={() => setFiltroActivo("TODOS")}
          >
            Todos <span className="pill-badge">{countTodos}</span>
          </button>
          <button
            className={`filter-pill ${filtroActivo === "PROGRAMADOS" ? "active" : ""}`}
            onClick={() => setFiltroActivo("PROGRAMADOS")}
          >
            Programados <span className="pill-badge">{countProgramados}</span>
          </button>
          <button
            className={`filter-pill ${filtroActivo === "ATENDIDOS" ? "active" : ""}`}
            onClick={() => setFiltroActivo("ATENDIDOS")}
          >
            Atendidos <span className="pill-badge">{countAtendidos}</span>
          </button>
          <button
            className={`filter-pill ${filtroActivo === "OTROS" ? "active" : ""}`}
            onClick={() => setFiltroActivo("OTROS")}
          >
            Otros <span className="pill-badge">{countOtros}</span>
          </button>
        </div>

        {/* Lista de Turnos */}
        <main className="turnos-card-list">
          {turnosFiltrados.map((t) => (
            <div key={t.id} className="turno-card-wrapper">
              <article className={`turno-row-card border-${t.estado.toLowerCase()}`}>
                <div className="card-col col-time">
                  <span className="time-main">{t.horaInicio}</span>
                  <span className="time-sub">a {t.horaFin}</span>
                  <span className="time-duration">{t.duracion}</span>
                </div>

                <div className="card-col col-patient">
                  <h3 className="patient-name">{t.paciente}</h3>
                  <span className="os-tag">{t.obraSocial}</span>
                </div>

                <div className="card-col col-practice">
                  <span className="practice-label">Práctica</span>
                  <span className="practice-value">{t.practica}</span>
                </div>

                <div className="card-col col-status">
                  <span className={`status-pill status-${t.estado.toLowerCase()}`}>
                    {t.estado}
                  </span>
                </div>

                <div className="card-col col-actions" style={{ position: "relative" }}>
                  {t.estado === "PROGRAMADO" && (
                    <div className="action-buttons-group">
                      <button className="btn-action-start">Registrar Atención</button>
                      <button
                        type="button"
                        className="btn-action-dots"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === t.id ? null : t.id);
                        }}
                      >
                        •••
                      </button>

                      {menuOpenId === t.id && (
                        <div
                          className="action-dropdown-menu"
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            marginTop: "6px",
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "12px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                            zIndex: 100,
                            minWidth: "190px",
                            padding: "6px 0",
                            display: "flex",
                            flexDirection: "column"
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => handleAbrirCancelacion(e, t)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "10px 16px",
                              border: "none",
                              background: "none",
                              color: "#f43f5e",
                              fontWeight: "600",
                              fontSize: "0.9rem",
                              cursor: "pointer",
                              textAlign: "left"
                            }}
                          >
                            ✕ Cancelar Turno
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {t.estado === "ATENDIDO" && (
                    <button className="btn-action-view">Ver Consulta</button>
                  )}

                  {t.estado === "CANCELADO" && (
                    <button className="btn-action-reassign" onClick={() => setIsModalOpen(true)}>
                      Liberar
                    </button>
                  )}
                </div>
              </article>
            </div>
          ))}
        </main>

        {/* Modal Nuevo Turno */}
        <NewTurnoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaveTurno={handleSaveTurno}
          initialDate={currentDate.toISOString().split("T")[0]}
        />

        {/* Modal de Confirmación y Motivo de Cancelación */}
        <ModalConfirmacion
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmarCancelacionFinal}
          titulo="Cancelar Turno"
          mensaje={
            turnoSeleccionado && (
              <>
                ¿Estás seguro de cancelar la cita de <strong>{turnoSeleccionado.paciente}</strong> ({turnoSeleccionado.horaInicio} hs)? El turno se marcará como cancelado en la base de datos y podrás liberar el horario si lo deseas.
              </>
            )
          }
          textoConfirmar="Sí, cancelar turno"
          textoCancelar="Volver"
        />
      </div>
    </div>
  );
}