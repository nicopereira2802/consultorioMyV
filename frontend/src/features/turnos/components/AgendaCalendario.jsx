/** @format */
import { useRef, useState, useEffect, useMemo } from "react";
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

import {
  HORARIO_ATENCION_DEFAULT,
  MODALIDADES_OCUPACION,
  COLORES_OCUPACION,
} from "../constants/turnosConstants";

const VISTAS = ["timeGridDay", "timeGridWeek", "dayGridMonth"];

// Mapeo de colores según el estado del turno (vistas diaria y semanal)
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

// Convierte "09:00", "09:00:00" o número 9 a minutos desde las 00:00
const convertirHoraAMinutos = (horaValor) => {
  if (typeof horaValor === "number") return Math.round(horaValor * 60);
  const partes = String(horaValor || "00:00").split(":").map(Number);
  const horas = Number.isFinite(partes[0]) ? partes[0] : 0;
  const minutos = Number.isFinite(partes[1]) ? partes[1] : 0;
  return horas * 60 + minutos;
};

// Normaliza un valor horario a formato "HH:MM"
const formatearHoraHHMM = (horaValor) => {
  const totalMin = convertirHoraAMinutos(horaValor);
  const hh = String(Math.floor(totalMin / 60)).padStart(2, "0");
  const mm = String(totalMin % 60).padStart(2, "0");
  return `${hh}:${mm}`;
};

// Normaliza un valor horario a formato "HH:MM:00" para FullCalendar
const formatearHoraSlot = (horaValor) => `${formatearHoraHHMM(horaValor)}:00`;

// Formatea minutos en texto legible (ej. "2h 30m")
const formatearMinutosTexto = (minutos) => {
  const minRedondeados = Math.round(minutos);
  const h = Math.floor(minRedondeados / 60);
  const m = minRedondeados % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export const AgendaCalendar = ({
  turnos = [],
  onDateSelect,
  onEventClick,
  horaInicio = HORARIO_ATENCION_DEFAULT.inicioStr,
  horaFin = HORARIO_ATENCION_DEFAULT.finStr,
}) => {
  const calendarRef = useRef(null);
  const contenedorRef = useRef(null);
  const [vistaActual, setVistaActual] = useState(0);
  const [vistaTipo, setVistaTipo] = useState("timeGridDay");
  const [modalidadId, setModalidadId] = useState("predeterminado");
  const [esMobile, setEsMobile] = useState(window.innerWidth < 768);
  const [ahora, setAhora] = useState(new Date());

  // Configuración dinámica del rango horario de atención (soporta variaciones de horario)
  const minutosInicioJornada = useMemo(() => convertirHoraAMinutos(horaInicio), [horaInicio]);
  const minutosFinJornada = useMemo(() => convertirHoraAMinutos(horaFin), [horaFin]);
  const minutosTotalesJornada = useMemo(
    () => Math.max(1, minutosFinJornada - minutosInicioJornada),
    [minutosInicioJornada, minutosFinJornada],
  );
  const slotMinTimeStr = useMemo(() => formatearHoraSlot(horaInicio), [horaInicio]);
  const slotMaxTimeStr = useMemo(() => formatearHoraSlot(horaFin), [horaFin]);
  const horaInicioHHMM = useMemo(() => formatearHoraHHMM(horaInicio), [horaInicio]);
  const horaFinHHMM = useMemo(() => formatearHoraHHMM(horaFin), [horaFin]);

  // Modalidad activa seleccionada en el desplegable
  const modalidadActual = useMemo(
    () => MODALIDADES_OCUPACION.find((m) => m.id === modalidadId) || MODALIDADES_OCUPACION[0],
    [modalidadId],
  );

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

  /* ─── CÁLCULO DINÁMICO DE OCUPACIÓN POR DÍA ─────────────── */
  const ocupacionPorDia = useMemo(() => {
    const mapaIntervalos = {};

    turnos.forEach((turno) => {
      if (!turno?.fecha_hora_inicio) return;

      const estadoTexto = (turno.EstadoTurno?.estado || "Programado").toLowerCase();
      // Los turnos cancelados o inasistentes no ocupan disponibilidad efectiva del día
      if (estadoTexto.includes("cancelado") || estadoTexto.includes("inasistente")) return;

      const dInicio = new Date(turno.fecha_hora_inicio);
      if (isNaN(dInicio.getTime())) return;

      const y = dInicio.getFullYear();
      const m = String(dInicio.getMonth() + 1).padStart(2, "0");
      const d = String(dInicio.getDate()).padStart(2, "0");
      const fechaKey = `${y}-${m}-${d}`;

      const duracionFallback = Number(turno.duracion_minutos) || 30;
      const dFin = turno.fecha_hora_fin
        ? new Date(turno.fecha_hora_fin)
        : new Date(dInicio.getTime() + duracionFallback * 60000);

      const iniMin = dInicio.getHours() * 60 + dInicio.getMinutes();
      let finMin = !isNaN(dFin.getTime())
        ? dFin.getHours() * 60 + dFin.getMinutes()
        : iniMin + duracionFallback;

      if (finMin <= iniMin) {
        finMin = iniMin + duracionFallback;
      }

      // Acotar al rango de atención configurado (ej. 09:00 a 19:00 hs)
      const iniEfectivo = Math.max(iniMin, minutosInicioJornada);
      const finEfectivo = Math.min(finMin, minutosFinJornada);

      if (finEfectivo > iniEfectivo) {
        if (!mapaIntervalos[fechaKey]) {
          mapaIntervalos[fechaKey] = { intervalos: [], cantidadTurnos: 0 };
        }
        mapaIntervalos[fechaKey].intervalos.push([iniEfectivo, finEfectivo]);
        mapaIntervalos[fechaKey].cantidadTurnos += 1;
      }
    });

    const resultado = {};

    Object.entries(mapaIntervalos).forEach(([fechaKey, datos]) => {
      const { intervalos, cantidadTurnos } = datos;
      if (!intervalos.length || cantidadTurnos === 0) return;

      // Ordenar y fusionar posibles solapamientos para obtener los minutos reales ocupados
      intervalos.sort((a, b) => a[0] - b[0]);
      const fusionados = [];
      for (const actual of intervalos) {
        if (fusionados.length === 0 || actual[0] >= fusionados[fusionados.length - 1][1]) {
          fusionados.push([...actual]);
        } else {
          fusionados[fusionados.length - 1][1] = Math.max(
            fusionados[fusionados.length - 1][1],
            actual[1],
          );
        }
      }

      const minutosOcupados = fusionados.reduce((acc, [ini, fin]) => acc + (fin - ini), 0);
      if (minutosOcupados <= 0) return;

      const porcentaje = Math.min(100, (minutosOcupados / minutosTotalesJornada) * 100);

      let nivel = "verde";
      if (porcentaje < modalidadActual.verdeMax) {
        nivel = "verde";
      } else if (porcentaje <= modalidadActual.amarilloMax) {
        nivel = "amarillo";
      } else {
        nivel = "rojo";
      }

      resultado[fechaKey] = {
        minutosOcupados,
        porcentaje,
        cantidadTurnos,
        nivel,
        colores: COLORES_OCUPACION[nivel],
      };
    });

    return resultado;
  }, [turnos, minutosInicioJornada, minutosFinJornada, minutosTotalesJornada, modalidadActual]);

  // Reglas CSS dinámicas por fecha para colorear vista mensual (celda del día) y semanal (solo cabecera del día)
  const estilosOcupacionPorFecha = useMemo(() => {
    const reglas = [];

    Object.entries(ocupacionPorDia).forEach(([fechaKey, info]) => {
      if (info.minutosOcupados > 0 && info.colores) {
        reglas.push(`
          .agenda-vista-dayGridMonth [role="cell"][data-date="${fechaKey}"] {
            background-color: ${info.colores.bg} !important;
            color: ${info.colores.text};
          }
          .agenda-vista-timeGridWeek [role="columnheader"][data-date="${fechaKey}"] {
            background-color: ${info.colores.bg} !important;
            color: ${info.colores.text};
          }
        `);
      }
    });

    return reglas.join("\n");
  }, [ocupacionPorDia]);

  // Actualizar tooltips informativos en celdas de mes y cabeceras de semana
  useEffect(() => {
    if (!contenedorRef.current) return;
    if (vistaTipo !== "dayGridMonth" && vistaTipo !== "timeGridWeek") return;

    const selector =
      vistaTipo === "dayGridMonth"
        ? '[role="cell"][data-date]'
        : '[role="columnheader"][data-date]';

    const elementos = contenedorRef.current.querySelectorAll(selector);
    const totalJornadaTexto = formatearMinutosTexto(minutosTotalesJornada);

    elementos.forEach((el) => {
      const fechaKey = el.getAttribute("data-date");
      if (!fechaKey) return;
      const info = ocupacionPorDia[fechaKey];
      if (info && info.minutosOcupados > 0) {
        const pctRedondeado = Math.round(info.porcentaje * 10) / 10;
        const ocupadoTexto = formatearMinutosTexto(info.minutosOcupados);
        el.setAttribute(
          "title",
          `Ocupación: ${pctRedondeado}% (${ocupadoTexto} de ${totalJornadaTexto}) • ${info.cantidadTurnos} turno(s)`,
        );
      } else {
        el.setAttribute("title", "Sin turnos programados (0% ocupación)");
      }
    });
  }, [ocupacionPorDia, vistaTipo, minutosTotalesJornada]);

  /* ─── FORMATEAR TURNOS CON ID DINÁMICA ─────────────────── */
  const turnosFormateados = useMemo(
    () =>
      turnos.map((turno) => {
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
      }),
    [turnos],
  );

  // Evento especial de fondo que pinta de gris todo lo transcurrido hasta "ahora"
  const eventoPasadoSombra = useMemo(
    () => ({
      id: "pasado-sombra-bg",
      start: "1970-01-01T00:00:00",
      end: ahora.toISOString(),
      display: "background",
      backgroundColor: "#e2e8f0",
    }),
    [ahora],
  );

  // En la vista mensual no se muestran las tarjetas individuales de turnos (solo el nivel de ocupación por color)
  const listaEventos = useMemo(
    () => (vistaTipo === "dayGridMonth" ? [] : [...turnosFormateados, eventoPasadoSombra]),
    [vistaTipo, turnosFormateados, eventoPasadoSombra],
  );

  const cambiarVista = (direccion) => {
    let siguienteVista = vistaActual;

    if (direccion === "LEFT" && vistaActual < VISTAS.length - 1) {
      siguienteVista += 1;
    } else if (direccion === "RIGHT" && vistaActual > 0) {
      siguienteVista -= 1;
    }

    if (siguienteVista !== vistaActual) {
      setVistaActual(siguienteVista);
      setVistaTipo(VISTAS[siguienteVista]);
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

  // Bloquear selección/creación antes de la hora actual exacta y fuera del rango de atención configurado
  const selectAllow = (selectInfo) => {
    if (selectInfo.start < new Date()) return false;

    // Si es una selección con horario específico (vistas de día y semana)
    if (!selectInfo.allDay && selectInfo.start) {
      const minInicio = selectInfo.start.getHours() * 60 + selectInfo.start.getMinutes();
      const minFin = selectInfo.end.getHours() * 60 + selectInfo.end.getMinutes();
      if (minInicio < minutosInicioJornada || minFin > minutosFinJornada) {
        return false;
      }
    }

    return true;
  };

  // Forzar estilos de colores en las tarjetas de turnos y ocultar en vista mensual
  const handleEventDidMount = (info) => {
    if (info.event.display === "background") return;

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
    <div
      {...handlers}
      ref={contenedorRef}
      className={`w-full h-full bg-white relative flex flex-col agenda-vista-${vistaTipo}`}
    >
      {/* Barra de selección de modalidad de ocupación y leyenda de disponibilidad */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2 border-b border-gray-100 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="selector-modalidad-ocupacion"
            className="font-semibold text-gray-700 whitespace-nowrap"
          >
            Nivel de ocupación:
          </label>
          <select
            id="selector-modalidad-ocupacion"
            value={modalidadId}
            onChange={(e) => setModalidadId(e.target.value)}
            className="border border-gray-300 bg-gray-50 hover:bg-white text-gray-800 font-medium rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#2eb086]/40 focus:border-[#2eb086] transition-colors cursor-pointer"
          >
            {MODALIDADES_OCUPACION.map((mod) => (
              <option key={mod.id} value={mod.id}>
                {mod.label}
              </option>
            ))}
          </select>

        </div>

        {/* Leyenda dinámica de porcentajes según la modalidad activa */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded border border-gray-300 inline-block"
              style={{ backgroundColor: COLORES_OCUPACION.blanco.bg }}
            />
            <span>Sin turnos (0%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded border inline-block"
              style={{
                backgroundColor: COLORES_OCUPACION.verde.bg,
                borderColor: COLORES_OCUPACION.verde.border,
              }}
            />
            <span>&lt; {modalidadActual.verdeMax}%</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded border inline-block"
              style={{
                backgroundColor: COLORES_OCUPACION.amarillo.bg,
                borderColor: COLORES_OCUPACION.amarillo.border,
              }}
            />
            <span>
              {modalidadActual.verdeMax}% - {modalidadActual.amarilloMax}%
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded border inline-block"
              style={{
                backgroundColor: COLORES_OCUPACION.rojo.bg,
                borderColor: COLORES_OCUPACION.rojo.border,
              }}
            />
            <span>&gt; {modalidadActual.amarilloMax}%</span>
          </span>
        </div>
      </div>

      {/* Contenedor del calendario */}
      <div className="flex-1 min-h-0 w-full relative">
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
          slotMinTime={slotMinTimeStr}
          slotMaxTime={slotMaxTimeStr}
          scrollTime={slotMinTimeStr}
          businessHours={
            vistaTipo === "dayGridMonth"
              ? false
              : {
                  daysOfWeek: [1, 2, 3, 4, 5, 6],
                  startTime: horaInicioHHMM,
                  endTime: horaFinHHMM,
                }
          }
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
          datesSet={(dateInfo) => {
            const nuevoTipo = dateInfo.view.type;
            setVistaTipo(nuevoTipo);
            const idx = VISTAS.indexOf(nuevoTipo);
            if (idx !== -1) setVistaActual(idx);
          }}
        />
      </div>

      {/* Estilos base y colores dinámicos de ocupación por día */}
      <style>{`
        .fc-bg-event {
          opacity: 0.6 !important;
        }

        /* Días sin turnos (0%): fondo blanco por defecto en vista mensual y en cabecera de vista semanal */
        .agenda-vista-dayGridMonth [role="cell"][data-date] {
          background-color: #ffffff !important;
          transition: background-color 0.2s ease;
        }

        .agenda-vista-dayGridMonth [role="cell"][data-date]:hover {
          filter: brightness(0.97);
        }

        .agenda-vista-timeGridWeek [role="columnheader"][data-date] {
          background-color: #ffffff !important;
          transition: background-color 0.2s ease;
        }

        ${estilosOcupacionPorFecha}
      `}</style>
    </div>
  );
};

export default AgendaCalendar;
