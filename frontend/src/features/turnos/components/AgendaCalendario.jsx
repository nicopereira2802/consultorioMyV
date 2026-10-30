/** @format */
import { useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import themePlugin from "@fullcalendar/react/themes/forma";
import { useSwipeable } from "react-swipeable";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/forma/theme.css";
import "@fullcalendar/react/themes/forma/palettes/green.css";

const VISTAS = ["timeGridDay", "timeGridWeek", "dayGridMonth"];

// Mapeo de colores según el estado del turno
const OBTENER_ESTILOS_ESTADO = (estado) => {
  const nombreEstado = (estado || "").toLowerCase();

  if (nombreEstado.includes("programado")) {
    return { bg: "#3B82F6", border: "#2563EB", text: "#ffffff" }; // Azul
  }
  if (nombreEstado.includes("atendido")) {
    return { bg: "#10B981", border: "#059669", text: "#ffffff" }; // Verde
  }
  if (nombreEstado.includes("cancelado")) {
    return { bg: "#EF4444", border: "#DC2626", text: "#ffffff" }; // Rojo
  }
  if (nombreEstado.includes("inasistente")) {
    return { bg: "#F59E0B", border: "#D97706", text: "#ffffff" }; // Ámbar/Naranja
  }

  return { bg: "#6B7280", border: "#4B5563", text: "#ffffff" };
};

export const AgendaCalendar = ({ turnos = [], onDateSelect, onEventClick }) => {
  const calendarRef = useRef(null);
  const [vistaActual, setVistaActual] = useState(0);
  const [esMobile, setEsMobile] = useState(window.innerWidth < 768);
  const [ahora, setAhora] = useState(new Date());

  // Actualizar el "ahora" para refrescar la zona gris del tiempo pasado
  useEffect(() => {
    const handleResize = () => setEsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    const interval = setInterval(() => setAhora(new Date()), 60000); // Actualiza cada minuto

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(interval);
    };
  }, []);

  /* ─── FORMATEAR TURNOS CON ID DINÁMICA ─────────────────── */
  const turnosFormateados = turnos.map((turno) => {
    const nombrePaciente = turno.Paciente
      ? `${turno.Paciente.nombre} ${turno.Paciente.apellido}`
      : `Paciente #${turno.id_paciente}`;

    const estadoTexto = turno.EstadoTurno?.estado || "Programado";
    const estilos = OBTENER_ESTILOS_ESTADO(estadoTexto);

    return {
      id: `${turno.id_turno}-${estadoTexto}`,

      title: `${nombrePaciente} ${turno.notas_consulta ? `- ${turno.notas_consulta}` : ""} - ${estadoTexto}`,
      start: turno.fecha_hora_inicio,
      end: turno.fecha_hora_fin,
      extendedProps: {
        ...turno,
        colorBg: estilos.bg,
        colorBorder: estilos.border,
        colorText: estilos.text,
      },
    };
  });

  // Evento especial de fondo que pinta de gris todo lo transcurrido hasta "ahora"
  const eventoPasadoSombra = {
    id: "pasado-sombra-bg",
    start: "1970-01-01T00:00:00",
    end: ahora.toISOString(),
    display: "background",
    backgroundColor: "#e2e8f0",
  };

  const listaEventos = [...turnosFormateados, eventoPasadoSombra];

  const cambiarVista = (direccion) => {
    let siguienteVista = vistaActual;

    if (direccion === "LEFT" && vistaActual < VISTAS.length - 1) {
      siguienteVista += 1;
    } else if (direccion === "RIGHT" && vistaActual > 0) {
      siguienteVista -= 1;
    }

    if (siguienteVista !== vistaActual) {
      setVistaActual(siguienteVista);
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(VISTAS[siguienteVista]);
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => cambiarVista("LEFT"),
    onSwipedRight: () => cambiarVista("RIGHT"),
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: false,
  });

  // Bloquear selección/creación antes de la hora actual exacta y fuera del horario de atención (09:00 a 20:00)
  const selectAllow = (selectInfo) => {
    if (selectInfo.start < new Date()) return false;

    // Si es una selección con horario específico (vistas de día y semana)
    if (!selectInfo.allDay && selectInfo.start) {
      const horaInicio = selectInfo.start.getHours() + selectInfo.start.getMinutes() / 60;
      const horaFin = selectInfo.end.getHours() + selectInfo.end.getMinutes() / 60;
      if (horaInicio < 9 || horaFin > 20) {
        return false;
      }
    }

    return true;
  };

  // Forzar estilos de colores en las tarjetas de turnos y ocultar en vista mensual
  const handleEventDidMount = (info) => {
    if (info.event.display === "background") return;

    // Ocultar tarjetas de turnos en la vista de mes (manteniéndolas en día y semana)
    if (info.view.type === "dayGridMonth") {
      info.el.style.setProperty("display", "none", "important");
      return;
    }

    const { colorBg, colorBorder, colorText } = info.event.extendedProps;
    if (colorBg) {
      info.el.style.setProperty("background-color", colorBg, "important");
      info.el.style.setProperty("border-color", colorBorder, "important");
      info.el.style.setProperty("color", colorText, "important");
    }
  };

  return (
    <div {...handlers} className="w-full h-full bg-white relative">
      <FullCalendar
        ref={calendarRef}
        plugins={[themePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridDay"
        headerToolbar={
          esMobile
            ? {
                left: "prev,next",
                center: "title",
                right: "timeGridDay,timeGridWeek,dayGridMonth",
              }
            : {
                left: "prev,next today",
                center: "title",
                right: "timeGridDay,timeGridWeek,dayGridMonth",
              }
        }
        locale={esLocale}
        firstDay={1}
        slotMinTime="09:00:00"
        slotMaxTime="20:00:00"
        scrollTime="09:00:00"
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5, 6],
          startTime: "09:00",
          endTime: "20:00",
        }}
        allDaySlot={false}
        selectable={true}
        selectAllow={selectAllow}
        editable={true}
        nowIndicator={true}
        height="100%"
        events={listaEventos}
        select={onDateSelect}
        eventClick={onEventClick}
        eventDidMount={handleEventDidMount}
      />

      {/* Estilos adicionales para que el fondo gris no tape las líneas de las horas y ocultar turnos en mes */}
      <style>{`
        .fc-bg-event {
          opacity: 0.6 !important;
        }

        /* Ocultar visualización de los turnos únicamente en la vista mensual */
        .fc-dayGridMonth-view .fc-daygrid-day-events,
        .fc-dayGridMonth-view .fc-daygrid-event-harness,
        .fc-dayGridMonth-view .fc-daygrid-event,
        .fc-dayGridMonth-view .fc-daygrid-day-bottom,
        .fc-dayGridMonth-view .fc-daygrid-more-link {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default AgendaCalendar;
