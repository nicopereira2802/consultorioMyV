/** @format */
import { useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import themePlugin from "@fullcalendar/react/themes/forma";
import { useSwipeable } from "react-swipeable";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/forma/theme.css";
import "@fullcalendar/react/themes/forma/palettes/purple.css";

const VISTAS = ["timeGridDay", "timeGridWeek", "dayGridMonth"];

export const AgendaCalendar = ({ turnos = [], onDateSelect, onEventClick }) => {
  /* ─── VARIABLES GENERALES ─────────────────────────────────── */
  const calendarRef = useRef(null);
  const [vistaActual, setVistaActual] = useState(0);

  /* ─── FORMATEAR TURNOS PARA QUE SEAN COMPATIBLES CON CALENDARIO ─────────────────────────────────── */
  const turnosFormateados = turnos.map((turno) => {
    // Si el backend incluye la asociación con Paciente (e.g. turno.Paciente)
    const nombrePaciente = turno.Paciente
      ? `${turno.Paciente.nombre} ${turno.Paciente.apellido}`
      : `Paciente #${turno.id_paciente}`;

    return {
      id: String(turno.id_turno),
      title: `${nombrePaciente} ${turno.notas_consulta ? `- ${turno.notas_consulta}` : ""} `,
      start: turno.fecha_hora_inicio,
      end: turno.fecha_hora_fin,
      // Guardamos el objeto original dentro de 'extendedProps' para recuperarlo al hacer clic
      extendedProps: { ...turno },
    };
  });

  /* ─── DEFINIR LADOS PARA DESLIZAR Y CAMBIAR VISTA ─────────────────────────────────── */
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

  /* ─── DEFINIR ACCIONES QUE PERMITEN DESLIZAR ─────────────────────────────────── */
  const handlers = useSwipeable({
    onSwipedLeft: () => cambiarVista("LEFT"),
    onSwipedRight: () => cambiarVista("RIGHT"),
    preventScrollOnSwipe: true, // Evita scroll vertical accidental mientras se desliza de lado
    trackTouch: true,
    trackMouse: true, // Solo actúa en pantallas táctiles
  });

  /* ─── RETORNO DE LA PAGINA ─────────────────────────────────── */
  return (
    <div
      {...handlers}
      className="w-full h-full bg-white "
    >
      <FullCalendar
        ref={calendarRef}
        plugins={[
          themePlugin,
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
        ]}
        initialView="timeGridDay"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridDay,timeGridWeek,dayGridMonth",
        }}
        locale={esLocale}
        firstDay={1}
        slotMinTime="08:00:00"
        slotMaxTime="21:30:00"
        allDaySlot={false}
        selectable={true}
        editable={true}
        height="100%"
        events={turnosFormateados}
        select={onDateSelect}
        eventClick={onEventClick}
      />
    </div>
  );
};

export default AgendaCalendar;
