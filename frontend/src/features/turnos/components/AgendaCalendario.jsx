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

export const AgendaCalendar = ({ turnos = [], onDateSelect, onEventClick }) => {
  const calendarRef = useRef(null);
  const [vistaActual, setVistaActual] = useState(0);
  const [esMobile, setEsMobile] = useState(window.innerWidth < 768);

  // Detectar cambios de pantalla para ajustar la barra del calendario
  useEffect(() => {
    const handleResize = () => {
      setEsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ─── FORMATEAR TURNOS ─────────────────────────────────── */
  const turnosFormateados = turnos.map((turno) => {
    const nombrePaciente = turno.Paciente
      ? `${turno.Paciente.nombre} ${turno.Paciente.apellido}`
      : `Paciente #${turno.id_paciente}`;

    return {
      id: String(turno.id_turno),
      title: `${nombrePaciente} ${turno.notas_consulta ? `- ${turno.notas_consulta}` : ""} - ${turno.EstadoTurno.estado} `,
      start: turno.fecha_hora_inicio,
      end: turno.fecha_hora_fin,
      extendedProps: { ...turno },
    };
  });

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

  return (
    <div {...handlers} className="w-full h-full bg-white">
      <FullCalendar
        ref={calendarRef}
        plugins={[
          themePlugin,
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
        ]}
        initialView="timeGridDay"
        // Adaptamos la botonera superior para móviles (botones más compactos o separados)
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
        slotMinTime="08:00:00"
        slotMaxTime="21:30:00"
        allDaySlot={false}
        selectable={true}
        editable={true}
        nowIndicator={true}
        height="100%"
        events={turnosFormateados}
        select={onDateSelect}
        eventClick={onEventClick}
      />
    </div>
  );
};

export default AgendaCalendar;