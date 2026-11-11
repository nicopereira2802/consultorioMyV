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
  COLORES_OCUPACION,
} from "../constants/turnosConstants";
import toast from "react-hot-toast";
import api from "../../../services/api";
import ModalRestriccion from "./ModalRestriccion";
import { validarBloqueoConTurnos, verificarSolapamientoTurnos } from "../utils/validacionesTurno";
import {
  useRestricciones,
  verificarSolapamientoConRestricciones,
} from "../hooks/useRestricciones";

const VISTAS = ["timeGridDay", "timeGridWeek", "dayGridMonth"];

// Umbrales fijos predeterminados
const UMBRAL_VERDE_MAX = 60;
const UMBRAL_AMARILLO_MAX = 85;

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

// Quita el resaltado de selección de la grilla mensual (se maneja directo sobre el DOM)
const limpiarResaltado = (container) => {
  container
    ?.querySelectorAll(".celda-drag-resaltada")
    .forEach((el) => el.classList.remove("celda-drag-resaltada"));
};

export const AgendaCalendar = ({
  turnos = [],
  onDateSelect,
  onEventClick,
  onEventDrop,
  recargarTurnos,
  horaInicio = HORARIO_ATENCION_DEFAULT.inicioStr,
  horaFin = HORARIO_ATENCION_DEFAULT.finStr,
  onVistaChange,
}) => {
  const calendarRef = useRef(null);
  const contenedorRef = useRef(null);
  const [vistaActual, setVistaActual] = useState(0);
  const [vistaTipo, setVistaTipo] = useState("timeGridDay");
  const [esMobile, setEsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [ahora, setAhora] = useState(new Date());

  // Estado local para Modal de Restricción / Bloqueo
  const [modalRestriccionAbierto, setModalRestriccionAbierto] = useState(false);
  const [rangoFechasSeleccionadas, setRangoFechasSeleccionadas] = useState(null);

  // Estados reactivos para selección interactiva por arrastre (Click & Drag) en grilla mensual
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef(null);
  const dragEndRef = useRef(null);
  const ultimoClickSlotRef = useRef(0);
  const arrastreTactilRef = useRef(false);
  const onVistaChangeRef = useRef(onVistaChange);
  useEffect(() => {
    onVistaChangeRef.current = onVistaChange;
  }, [onVistaChange]);

  const {
    restricciones,
    agregarRestriccion,
    eliminarRestriccion,
    esDiaBloqueado,
    obtenerRestriccionesDeRango,
  } = useRestricciones();

  // Configuración dinámica del rango horario de atención
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

  useEffect(() => {
    const handleResize = () => setEsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    const interval = setInterval(() => setAhora(new Date()), 60000);

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
      if (porcentaje > UMBRAL_AMARILLO_MAX) {
        nivel = "rojo";
      } else if (porcentaje >= UMBRAL_VERDE_MAX) {
        nivel = "amarillo";
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
  }, [turnos, minutosInicioJornada, minutosFinJornada, minutosTotalesJornada]);

  // Reglas CSS dinámicas por fecha para colorear vista mensual, cabeceras y celdas bloqueadas
  const estilosOcupacionPorFecha = useMemo(() => {
    const reglas = [];

    // 1. Días bloqueados completos (fondo gris claro de deshabilitado, texto atenuado y cursor not-allowed)
    const diasBloqueadosCompletos = new Set();
    restricciones.forEach((r) => {
      if (r.todoElDia) {
        let actual = new Date(r.fechaInicio + "T00:00:00");
        const limite = new Date(r.fechaFin + "T00:00:00");
        while (actual <= limite) {
          const y = actual.getFullYear();
          const m = String(actual.getMonth() + 1).padStart(2, "0");
          const d = String(actual.getDate()).padStart(2, "0");
          const fKey = `${y}-${m}-${d}`;
          diasBloqueadosCompletos.add(fKey);

          reglas.push(`
            /* Vista Mensual: fondo gris sólido y visible (bg-slate-300) que cubre 100% la celda sin líneas verdes */
            .agenda-vista-dayGridMonth [role="cell"][data-date="${fKey}"],
            .agenda-vista-dayGridMonth td[data-date="${fKey}"],
            .agenda-vista-dayGridMonth td.celda-bloqueada-completo[data-date="${fKey}"] {
              background-color: #cbd5e1 !important; /* bg-slate-300 */
              color: #1e293b !important; /* text-slate-800 */
              cursor: pointer !important;
              border-left-color: #cbd5e1 !important;
            }
            .agenda-vista-dayGridMonth [role="cell"][data-date="${fKey}"] .fc-daygrid-day-frame,
            .agenda-vista-dayGridMonth td[data-date="${fKey}"] .fc-daygrid-day-frame,
            .agenda-vista-dayGridMonth td.celda-bloqueada-completo .fc-daygrid-day-frame,
            .agenda-vista-dayGridMonth [role="cell"][data-date="${fKey}"] .fc-daygrid-day-bg,
            .agenda-vista-dayGridMonth td[data-date="${fKey}"] .fc-daygrid-day-bg,
            .agenda-vista-dayGridMonth td.celda-bloqueada-completo .fc-daygrid-day-bg,
            .agenda-vista-dayGridMonth [role="cell"][data-date="${fKey}"] .fc-daygrid-day-events,
            .agenda-vista-dayGridMonth td[data-date="${fKey}"] .fc-daygrid-day-events,
            .agenda-vista-dayGridMonth td.celda-bloqueada-completo .fc-daygrid-day-events {
              background-color: #cbd5e1 !important;
              border-left-color: #cbd5e1 !important;
            }
            .agenda-vista-dayGridMonth [role="cell"][data-date="${fKey}"] .fc-daygrid-day-number,
            .agenda-vista-dayGridMonth td[data-date="${fKey}"] .fc-daygrid-day-number,
            .agenda-vista-dayGridMonth td.celda-bloqueada-completo .fc-daygrid-day-number {
              color: #1e293b !important;
              font-weight: 700 !important;
            }

            /* Vista Semanal: cabecera y columna completa en gris claro */
            .agenda-vista-timeGridWeek [role="columnheader"][data-date="${fKey}"],
            .agenda-vista-timeGridWeek th[data-date="${fKey}"] {
              background-color: #e2e8f0 !important;
              color: #334155 !important;
              cursor: not-allowed !important;
            }
            .agenda-vista-timeGridWeek .fc-timegrid-col[data-date="${fKey}"],
            .agenda-vista-timeGridWeek .fc-timegrid-col[data-date="${fKey}"] .fc-timegrid-col-frame {
              background-color: #e2e8f0 !important;
              cursor: not-allowed !important;
            }

            /* Vista Diaria: cabecera y grilla completa en gris claro si coincide */
            .agenda-vista-timeGridDay [role="columnheader"][data-date="${fKey}"],
            .agenda-vista-timeGridDay th[data-date="${fKey}"] {
              background-color: #e2e8f0 !important;
              color: #334155 !important;
              cursor: not-allowed !important;
            }
            .agenda-vista-timeGridDay .fc-timegrid-col[data-date="${fKey}"],
            .agenda-vista-timeGridDay .fc-timegrid-col[data-date="${fKey}"] .fc-timegrid-col-frame {
              background-color: #e2e8f0 !important;
              cursor: not-allowed !important;
            }
          `);

          actual.setDate(actual.getDate() + 1);
        }
      }
    });

    // 2. Colores de ocupación para días NO bloqueados por completo
    Object.entries(ocupacionPorDia).forEach(([fechaKey, info]) => {
      if (!diasBloqueadosCompletos.has(fechaKey) && info.minutosOcupados > 0 && info.colores) {
        reglas.push(`
          .agenda-vista-dayGridMonth [role="cell"][data-date="${fechaKey}"],
          .agenda-vista-dayGridMonth td[data-date="${fechaKey}"] {
            background-color: ${info.colores.bg} !important;
            color: ${info.colores.text};
          }
          .agenda-vista-timeGridWeek [role="columnheader"][data-date="${fechaKey}"],
          .agenda-vista-timeGridWeek th[data-date="${fechaKey}"] {
            background-color: ${info.colores.bg} !important;
            color: ${info.colores.text};
          }
        `);
      }
    });

    return reglas.join("\n");
  }, [ocupacionPorDia, restricciones]);

  // Actualizar tooltips informativos
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

      const restDia = restricciones.find(
        (r) => r.todoElDia && fechaKey >= r.fechaInicio && fechaKey <= r.fechaFin
      );

      if (restDia) {
        el.setAttribute(
          "title",
          `🔒 Día Bloqueado (${restDia.motivo}) - No disponible para turnos`
        );
        return;
      }

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
  }, [ocupacionPorDia, vistaTipo, minutosTotalesJornada, restricciones]);

  /* ─── FORMATEAR TURNOS ─────────────────────────────────── */
  const turnosFormateados = useMemo(
    () =>
      turnos.map((turno) => {
        const nombrePaciente = turno.Paciente
          ? `${turno.Paciente.nombre || ""} ${turno.Paciente.apellido || ""}`.trim()
          : (turno.paciente_nombre || turno.nombre_paciente || `Paciente #${turno.id_paciente || ""}`);

        const estadoStr = (turno.estado || turno.EstadoTurno?.estado || "").toLowerCase();
        const esMovable = !estadoStr.includes("cancel") && !estadoStr.includes("inasist") && !estadoStr.includes("atendid");

        return {
          id: `turno-${turno.id_turno}`,
          title: nombrePaciente,
          start: turno.fecha_hora_inicio,
          end: turno.fecha_hora_fin,
          editable: esMovable,
          startEditable: esMovable,
          durationEditable: false,
          classNames: ["turno-card-event"],
          extendedProps: {
            ...turno,
            esTurno: true,
          },
        };
      }),
    [turnos],
  );

  /* ─── FORMATEAR RESTRICCIONES / BLOQUEOS VISUALES ──────── */
  const eventosRestricciones = useMemo(() => {
    const eventos = [];
    const diasConBloqueoCompletoMes = new Set();
    const franjasMesRegistradas = new Set();

    restricciones.forEach((r) => {
      let actual = new Date(r.fechaInicio + "T00:00:00");
      const limite = new Date(r.fechaFin + "T00:00:00");

      while (actual <= limite) {
        const y = actual.getFullYear();
        const m = String(actual.getMonth() + 1).padStart(2, "0");
        const d = String(actual.getDate()).padStart(2, "0");
        const fechaStr = `${y}-${m}-${d}`;

        if (r.todoElDia) {
          // 1. Etiqueta para Vista Mensual (ÚNICA por día, sin duplicados)
          if (!diasConBloqueoCompletoMes.has(fechaStr)) {
            diasConBloqueoCompletoMes.add(fechaStr);
            eventos.push({
              id: `rest-mes-${r.id}-${fechaStr}`,
              title: `🔒 ${r.motivo}`,
              start: `${fechaStr}T00:00:00`,
              end: `${fechaStr}T23:59:59`,
              allDay: true,
              display: "block",
              editable: false,
              startEditable: false,
              durationEditable: false,
              classNames: ["restriccion-dia-completo"],
              backgroundColor: "transparent",
              borderColor: "transparent",
              textColor: "transparent",
              extendedProps: {
                esRestriccion: true,
                restriccionId: r.id,
                motivo: r.motivo,
                todoElDia: true,
                soloVistaMes: true,
              },
            });
          }

          // 2. Bloque para Vista Semanal y Diaria
          eventos.push({
            id: `rest-grid-${r.id}-${fechaStr}`,
            title: `🔒 Día bloqueado: ${r.motivo}`,
            start: `${fechaStr}T${slotMinTimeStr}`,
            end: `${fechaStr}T${slotMaxTimeStr}`,
            allDay: false,
            display: "block",
            editable: false,
            startEditable: false,
            durationEditable: false,
            classNames: ["restriccion-dia-grid"],
            backgroundColor: "#f1f5f9",
            borderColor: "#cbd5e1",
            textColor: "#334155",
            extendedProps: {
              esRestriccion: true,
              restriccionId: r.id,
              motivo: r.motivo,
              todoElDia: true,
              soloVistaGrid: true,
              colorBg: "#e2e8f0",
              colorBorder: "#cbd5e1",
              colorText: "#334155",
            },
          });
        } else {
          // Bloqueo de Franja Horaria
          const horaIni = r.horaInicio || "08:00";
          const horaFin = r.horaFin || "10:00";
          const franjaKey = `${fechaStr}_${horaIni}_${horaFin}_${r.motivo}`;

          // 1. Etiqueta compacta para Vista Mensual (ÚNICA por franja, sin duplicados)
          if (!franjasMesRegistradas.has(franjaKey)) {
            franjasMesRegistradas.add(franjaKey);
            eventos.push({
              id: `rest-mes-franja-${r.id}-${fechaStr}`,
              title: `🔒 ${horaIni} - ${horaFin} · ${r.motivo}`,
              start: `${fechaStr}T${horaIni}:00`,
              end: `${fechaStr}T${horaFin}:00`,
              allDay: true,
              display: "block",
              editable: false,
              startEditable: false,
              durationEditable: false,
              classNames: ["restriccion-franja-mes"],
              backgroundColor: "transparent",
              borderColor: "transparent",
              textColor: "#334155",
              extendedProps: {
                esRestriccion: true,
                restriccionId: r.id,
                motivo: r.motivo,
                todoElDia: false,
                horaInicio: horaIni,
                horaFin: horaFin,
                soloVistaMes: true,
              },
            });
          }

          // 2. Bloque para Vista Semanal y Diaria
          eventos.push({
            id: `rest-grid-franja-${r.id}-${fechaStr}`,
            title: `🔒 Bloqueado: ${r.motivo}`,
            start: `${fechaStr}T${horaIni}:00`,
            end: `${fechaStr}T${horaFin}:00`,
            allDay: false,
            display: "block",
            editable: false,
            startEditable: false,
            durationEditable: false,
            classNames: ["restriccion-franja-grid"],
            backgroundColor: "#f1f5f9",
            borderColor: "#cbd5e1",
            textColor: "#334155",
            extendedProps: {
              esRestriccion: true,
              restriccionId: r.id,
              motivo: r.motivo,
              todoElDia: false,
              soloVistaGrid: true,
              colorBg: "#f3f4f6",
              colorBorder: "#cbd5e1",
              colorText: "#334155",
            },
          });
        }

        actual.setDate(actual.getDate() + 1);
      }
    });

    return eventos;
  }, [restricciones, slotMinTimeStr, slotMaxTimeStr]);

  // Convierte Date local a string ISO sin zona horaria (evita el offset UTC de toISOString)
  const toLocalISOString = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate()) +
           'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  };

  const eventoPasadoSombra = useMemo(
    () => ({
      id: "pasado-sombra-bg",
      start: "1970-01-01T00:00:00",
      end: toLocalISOString(ahora),
      display: "background",
      backgroundColor: "rgba(241,245,249,0.7)",
    }),
    [ahora],
  );

  const listaEventos = useMemo(
    () => (vistaTipo === "dayGridMonth"
      ? [...eventosRestricciones]
      : [...turnosFormateados, ...eventosRestricciones, eventoPasadoSombra]),
    [vistaTipo, turnosFormateados, eventosRestricciones, eventoPasadoSombra],
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
      if (onVistaChangeRef.current) onVistaChangeRef.current(VISTAS[siguienteVista]);
    }
  };

    const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (!arrastreTactilRef.current) cambiarVista("LEFT");
    },
    onSwipedRight: () => {
      if (!arrastreTactilRef.current) cambiarVista("RIGHT");
    },
    preventScrollOnSwipe: vistaTipo !== "dayGridMonth",
    trackTouch: true,
    trackMouse: false,
  });

    // Selección en vista mensual:
  //  - Mouse: clic = ir al día · arrastrar = rango · mantener 1,5 s = un solo día
  //  - Táctil: toque = ir al día · deslizar = scroll normal · mantener 0,5 s = modo selección
  //            (soltar = un día, arrastrar y soltar = rango)
  // El resaltado va directo al DOM (sin estado de React) para evitar re-renders y parpadeo.
  useEffect(() => {
    const container = contenedorRef.current;
    if (!container) return;
    if (vistaTipo !== "dayGridMonth") return;

    const HOLD_TACTIL_MS = 500;
    const HOLD_MOUSE_MS = 1500;
    const UMBRAL_MOVIMIENTO_PX = 10;

    let timer = null;
    let holdMouse = false;
    let tocando = false;
    let seleccionando = false;
    let abortado = false;
    let inicioX = 0;
    let inicioY = 0;
    let ultimoTouch = 0;

    const getCellDate = (elem) => {
      if (!elem) return null;
      const cell = elem.closest('[role="cell"][data-date], td[data-date]');
      return cell ? cell.getAttribute("data-date") : null;
    };

    const cancelarTimer = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };

    const resaltar = (a, b) => {
      const min = a <= b ? a : b;
      const max = a <= b ? b : a;
      container.querySelectorAll('[role="cell"][data-date], td[data-date]').forEach((el) => {
        const f = el.getAttribute("data-date");
        el.classList.toggle("celda-drag-resaltada", Boolean(f && f >= min && f <= max));
      });
    };

    const bloqueoCompletoDe = (dateStr) =>
      restricciones.find(
        (r) =>
          (r.todoElDia || r.tipo === "dia_completo") &&
          dateStr >= r.fechaInicio &&
          dateStr <= r.fechaFin
      );

    const abrirModalDia = (dateStr) => {
      const bloqueo = bloqueoCompletoDe(dateStr);
      if (bloqueo) {
        setRangoFechasSeleccionadas({
          inicio: new Date(bloqueo.fechaInicio + "T00:00:00"),
          fin: new Date(bloqueo.fechaFin + "T00:00:00"),
        });
      } else {
        setRangoFechasSeleccionadas({
          inicio: new Date(dateStr + "T00:00:00"),
          fin: new Date(dateStr + "T00:00:00"),
        });
      }
      setModalRestriccionAbierto(true);
    };

    // Toque / clic simple: ir a la vista diaria (o abrir el modal si el día está bloqueado)
    const irADia = (dateStr) => {
      limpiarResaltado(container);
      if (bloqueoCompletoDe(dateStr)) {
        abrirModalDia(dateStr);
        return;
      }
      const api = calendarRef.current?.getApi();
      if (api) {
        api.changeView("timeGridDay", dateStr);
        setVistaTipo("timeGridDay");
        setVistaActual(0);
        if (onVistaChangeRef.current) onVistaChangeRef.current("timeGridDay");
      }
    };

    // Un día o un rango: el resaltado queda hasta cerrar el modal
    const abrirRango = (a, b) => {
      const min = a <= b ? a : b;
      const max = a <= b ? b : a;
      if (min === max) {
        abrirModalDia(min);
        return;
      }
      setRangoFechasSeleccionadas({
        inicio: new Date(min + "T00:00:00"),
        fin: new Date(max + "T00:00:00"),
      });
      setModalRestriccionAbierto(true);
    };

    /* ── Mouse ── */
    const handleMouseDown = (e) => {
      if (e.button !== 0 || Date.now() - ultimoTouch < 800) return;
      const dateStr = getCellDate(e.target);
      if (!dateStr) return;

      holdMouse = false;
      isDraggingRef.current = true;
      dragStartRef.current = dateStr;
      dragEndRef.current = dateStr;
      resaltar(dateStr, dateStr);

      timer = setTimeout(() => {
        holdMouse = true;
        isDraggingRef.current = false;
        abrirModalDia(dateStr);
      }, HOLD_MOUSE_MS);
    };

    const handleMouseOver = (e) => {
      if (Date.now() - ultimoTouch < 800 || !isDraggingRef.current) return;
      const dateStr = getCellDate(e.target);
      if (!dateStr || dateStr === dragEndRef.current) return;
      cancelarTimer();
      dragEndRef.current = dateStr;
      resaltar(dragStartRef.current, dateStr);
    };

    const handleMouseUp = (e) => {
      if (Date.now() - ultimoTouch < 800) return;
      cancelarTimer();
      if (holdMouse) {
        holdMouse = false;
        return;
      }
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      const start = dragStartRef.current;
      const end =
        getCellDate(document.elementFromPoint(e.clientX, e.clientY)) ||
        dragEndRef.current ||
        start;
      if (!start || !end) return;

      if (start === end) {
        irADia(start);
      } else {
        abrirRango(start, end);
      }
    };

    /* ── Táctil ── */
    const handleTouchStart = (e) => {
      ultimoTouch = Date.now();
      if (!e.touches || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dateStr = getCellDate(document.elementFromPoint(t.clientX, t.clientY));
      if (!dateStr) return;

      tocando = true;
      abortado = false;
      seleccionando = false;
      inicioX = t.clientX;
      inicioY = t.clientY;
      dragStartRef.current = dateStr;
      dragEndRef.current = dateStr;

      timer = setTimeout(() => {
        seleccionando = true;
        arrastreTactilRef.current = true;
        isDraggingRef.current = true;
        if (navigator.vibrate) navigator.vibrate(30);
        resaltar(dateStr, dateStr);
      }, HOLD_TACTIL_MS);
    };

    const handleTouchMove = (e) => {
      ultimoTouch = Date.now();
      const t = e.touches && e.touches[0];
      if (!t) return;

      if (seleccionando) {
        // En modo selección el dedo no scrollea ni cambia de vista
        if (e.cancelable) e.preventDefault();
        const dateStr = getCellDate(document.elementFromPoint(t.clientX, t.clientY));
        if (dateStr && dateStr !== dragEndRef.current) {
          dragEndRef.current = dateStr;
          resaltar(dragStartRef.current, dateStr);
        }
        return;
      }

      // Se movió antes de completar el "mantener": es un scroll o deslizamiento, no una selección
      if (tocando && !abortado) {
        const dx = t.clientX - inicioX;
        const dy = t.clientY - inicioY;
        if (Math.hypot(dx, dy) > UMBRAL_MOVIMIENTO_PX) {
          abortado = true;
          cancelarTimer();
        }
      }
    };

    const handleTouchEnd = (e) => {
      ultimoTouch = Date.now();
      cancelarTimer();

      const t = e.changedTouches && e.changedTouches[0];
      const dateStr = t ? getCellDate(document.elementFromPoint(t.clientX, t.clientY)) : null;

      if (seleccionando) {
        const start = dragStartRef.current;
        const end = dateStr || dragEndRef.current || start;
        if (start && end) abrirRango(start, end);
      } else if (tocando && !abortado && dragStartRef.current) {
        irADia(dragStartRef.current);
      }

      tocando = false;
      seleccionando = false;
      abortado = false;
      isDraggingRef.current = false;
      setTimeout(() => {
        arrastreTactilRef.current = false;
      }, 400);
    };

    const handleTouchCancel = () => {
      cancelarTimer();
      tocando = false;
      seleccionando = false;
      abortado = false;
      isDraggingRef.current = false;
      limpiarResaltado(container);
      setTimeout(() => {
        arrastreTactilRef.current = false;
      }, 400);
    };

    // Evita el menú contextual del navegador al mantener pulsado
    const handleContextMenu = (e) => e.preventDefault();

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mouseover", handleMouseOver);
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchCancel);
    container.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      cancelarTimer();
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mouseover", handleMouseOver);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchCancel);
      container.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [vistaTipo, restricciones]);

  const selectAllow = (selectInfo) => {
    // En vista mensual permitir la selección libre (handleDateSelect diferencia clic simple de arrastre)
    if ((selectInfo.view?.type ?? vistaTipo) === "dayGridMonth") return true;

    
    // Bloquear slots pasados en vistas de grilla
    if (selectInfo.start < new Date()) return false;

// 1. Validar si el día completo está bloqueado
    if (esDiaBloqueado(selectInfo.start)) {
      return false;
    }

    // 2. Si es franja horaria en vista diaria o semanal:
    if (!selectInfo.allDay && selectInfo.start) {
      const minInicio = selectInfo.start.getHours() * 60 + selectInfo.start.getMinutes();
      const minFin = selectInfo.end
        ? selectInfo.end.getHours() * 60 + selectInfo.end.getMinutes()
        : minInicio + 30;

      if (minInicio < minutosInicioJornada || minFin > minutosFinJornada) {
        return false;
      }

      // Validar si la franja seleccionada coincide con un slot bloqueado
      const durMin = Math.max(15, minFin - minInicio);
      const conflicto = verificarSolapamientoConRestricciones(selectInfo.start, durMin);
      if (conflicto) {
        return false;
      }
    }

    return true;
  };

  const handleCerrarModal = () => {
    setModalRestriccionAbierto(false);
    setRangoFechasSeleccionadas(null);
    setDragStart(null);
    setDragEnd(null);
    setIsDragging(false);
    isDraggingRef.current = false;
    dragStartRef.current = null;
    dragEndRef.current = null;
    limpiarResaltado(contenedorRef.current);
    const api = calendarRef.current?.getApi();
    if (api) {
      api.unselect();
    }
  };

  const procesarSeleccionSlotLibre = (slotInfo) => {
    const ahoraMs = Date.now();
    if (ahoraMs - ultimoClickSlotRef.current < 250) return;
    ultimoClickSlotRef.current = ahoraMs;

    if (onDateSelect) {
      onDateSelect(slotInfo);
    }
  };

  // Clic directo en un slot en la Vista Diaria o Semanal
  const handleDateClick = (dateClickInfo) => {
    if ((dateClickInfo.view?.type ?? vistaTipo) === "dayGridMonth") return;

    const fechaDate = dateClickInfo.date;
        // Bloquear clics en slots pasados
    if (fechaDate < new Date()) return;

if (esDiaBloqueado(fechaDate)) return;

    const conflicto = verificarSolapamientoConRestricciones(fechaDate, 30);
    if (conflicto) return;

    procesarSeleccionSlotLibre({
      start: fechaDate,
      end: new Date(fechaDate.getTime() + 30 * 60000),
      startStr: dateClickInfo.dateStr,
      endStr: new Date(fechaDate.getTime() + 30 * 60000).toISOString(),
      allDay: dateClickInfo.allDay,
      view: dateClickInfo.view,
    });
  };

  // Selección de rango de slots en la Vista Diaria o Semanal
  const handleDateSelect = (selectInfo) => {
    if ((selectInfo.view?.type ?? vistaTipo) === "dayGridMonth") return;

        // Bloquear selección de rangos pasados
    if (selectInfo.start < new Date()) return;

if (esDiaBloqueado(selectInfo.start)) return;

    const durMin = Math.max(15, (selectInfo.end.getTime() - selectInfo.start.getTime()) / 60000);
    const conflicto = verificarSolapamientoConRestricciones(selectInfo.start, durMin);
    if (conflicto) return;

    procesarSeleccionSlotLibre(selectInfo);
  };

  const handleEventClick = (clickInfo) => {
    if (clickInfo.event.extendedProps?.esRestriccion) {
      const idRest = clickInfo.event.extendedProps.restriccionId;
      const restObj = restricciones.find((r) => r.id === idRest);
      if (restObj) {
        setRangoFechasSeleccionadas({
          inicio: new Date(restObj.fechaInicio + "T00:00:00"),
          fin: new Date(restObj.fechaFin + "T00:00:00"),
        });
      }
      setModalRestriccionAbierto(true);
      return;
    }

    if (onEventClick) {
      onEventClick(clickInfo);
    }
  };

  const handleEventDrop = async (dropInfo) => {
    if (typeof onEventDrop === "function") {
      return onEventDrop(dropInfo);
    }

    const { event, oldEvent, revert } = dropInfo;

    // 1. Si no es un turno (es restricción u otro evento), revertir inmediatamente
    if (!event.extendedProps?.esTurno && !event.id?.startsWith("turno-")) {
      revert();
      return;
    }

    const turnoId =
      event.extendedProps?.id_turno ||
      (event.id ? String(event.id).replace("turno-", "") : null);

    if (!turnoId) {
      revert();
      return;
    }

    // 2. Comprobar estado del turno: no permitir mover turnos finalizados/cancelados
    const estadoTurno = (
      event.extendedProps?.estado ||
      event.extendedProps?.EstadoTurno?.estado ||
      ""
    ).toLowerCase();

    if (
      estadoTurno.includes("cancel") ||
      estadoTurno.includes("inasist") ||
      estadoTurno.includes("atendid")
    ) {
      revert();
      toast.error(
        `No se puede mover un turno con estado "${event.extendedProps?.EstadoTurno?.estado || estadoTurno}".`,
        { icon: "⚠️" }
      );
      return;
    }

    const nuevoInicioDate = event.start;
    if (!nuevoInicioDate || isNaN(nuevoInicioDate.getTime())) {
      revert();
      return;
    }

    // Calcular duración original del turno para proyectar su hora de fin exacta
    let duracionMinutos = Number(event.extendedProps?.duracion_minutos);
    if (!duracionMinutos || isNaN(duracionMinutos) || duracionMinutos <= 0) {
      if (oldEvent && oldEvent.start && oldEvent.end) {
        duracionMinutos = Math.round(
          (oldEvent.end.getTime() - oldEvent.start.getTime()) / 60000
        );
      } else if (event.end) {
        duracionMinutos = Math.round(
          (event.end.getTime() - nuevoInicioDate.getTime()) / 60000
        );
      } else {
        duracionMinutos = 30;
      }
    }

    const nuevoFinDate =
      event.end || new Date(nuevoInicioDate.getTime() + duracionMinutos * 60000);

    const pad = (n) => String(n).padStart(2, "0");
    const nuevaFecha = `${nuevoInicioDate.getFullYear()}-${pad(nuevoInicioDate.getMonth() + 1)}-${pad(nuevoInicioDate.getDate())}`;
    const nuevoInicioHHMM = `${pad(nuevoInicioDate.getHours())}:${pad(nuevoInicioDate.getMinutes())}`;
    const nuevoFinHHMM = `${pad(nuevoFinDate.getHours())}:${pad(nuevoFinDate.getMinutes())}`;

    // Validar horario comercial de atención
    const horaInicioDecimal =
      nuevoInicioDate.getHours() + nuevoInicioDate.getMinutes() / 60;
    const horaFinDecimal =
      nuevoFinDate.getHours() + nuevoFinDate.getMinutes() / 60;
    if (
      horaInicioDecimal < HORARIO_ATENCION_DEFAULT.horaInicio ||
      horaFinDecimal > HORARIO_ATENCION_DEFAULT.horaFin ||
      horaInicioDecimal >= horaFinDecimal
    ) {
      revert();
      toast.error(
        `El horario de atención es de ${HORARIO_ATENCION_DEFAULT.inicioStr} a ${HORARIO_ATENCION_DEFAULT.finStr} hs. El turno debe comenzar a partir de las ${HORARIO_ATENCION_DEFAULT.inicioStr} y finalizar a más tardar a las ${HORARIO_ATENCION_DEFAULT.finStr} hs.`,
        { icon: "⚠️" }
      );
      return;
    }

    // Validar contra restricciones de agenda (días completos o franjas horarias bloqueadas)
    const conflictoBloqueo = verificarSolapamientoConRestricciones(
      toLocalISOString(nuevoInicioDate),
      duracionMinutos
    );
    if (conflictoBloqueo) {
      revert();
      toast.error(conflictoBloqueo.mensaje, { icon: "🔒" });
      return;
    }

    // A. Validación Anti-Solapamiento en el Drop:
    // Comprobar si colisiona con algún turno activo existente en esa misma fecha
    const turnosDelDia = turnos.filter((t) => {
      const fIni = t.fecha_hora_inicio || t.start;
      if (!fIni) return false;
      const fStr =
        typeof fIni === "string"
          ? fIni.slice(0, 10)
          : new Date(fIni).toISOString().slice(0, 10);
      return fStr === nuevaFecha;
    });

    const hayConflicto = turnosDelDia.some((t) => {
      // Ignorar el mismo turno que se está arrastrando y turnos cancelados
      const tId = t.id_turno ?? t.id;
      if (String(tId) === String(turnoId)) return false;

      const estado = (t.estado || t.EstadoTurno?.estado || "").toLowerCase();
      if (estado.includes("cancel") || Number(t.id_estado) === 3) return false;

      const tInicioDate = new Date(t.fecha_hora_inicio || t.start);
      const tDur = Number(t.duracion_minutos) || 30;
      const tFinDate = t.fecha_hora_fin
        ? new Date(t.fecha_hora_fin)
        : new Date(tInicioDate.getTime() + tDur * 60000);

      const inicioExistente = `${pad(tInicioDate.getHours())}:${pad(tInicioDate.getMinutes())}`;
      const finExistente = `${pad(tFinDate.getHours())}:${pad(tFinDate.getMinutes())}`;

      // Fórmula de solapamiento: A_inicio < B_fin && A_fin > B_inicio
      return nuevoInicioHHMM < finExistente && nuevoFinHHMM > inicioExistente;
    });

    if (hayConflicto) {
      revert();
      toast.error(
        "No se puede mover aquí: el horario ya está ocupado por otro turno.",
        {
          icon: "⚠️",
        }
      );
      return;
    }

    // B. Persistencia en Backend (PATCH /turnos/:id/reprogramado)
    try {
      const inicioIso = nuevoInicioDate.toISOString();
      const finIso = nuevoFinDate.toISOString();

      await api.patch(`/turnos/${turnoId}/reprogramado`, {
        fecha_hora_inicio: inicioIso,
        fecha_hora_fin: finIso,
      });

      toast.success(`Turno reprogramado a las ${nuevoInicioHHMM} hs`, {
        icon: "✅",
      });

      // Sincronizar grilla con MySQL
      if (typeof recargarTurnos === "function") {
        recargarTurnos();
      }
    } catch (error) {
      revert();
      console.error("Error al reprogramar turno arrastrado:", error);
      const msgError =
        error.response?.data?.error ||
        "No se pudo guardar la nueva posición del turno. Se restableció su horario.";
      toast.error(msgError);
    }
  };

  const handleEventDidMount = (info) => {
    if (info.event.display === "background") return;

    const props = info.event.extendedProps;

    // En vista mensual: ocultar turnos regulares y eventos de día completo (celda limpia sin badges ni líneas)
    if (info.view.type === "dayGridMonth") {
      if (!props?.esRestriccion || props?.soloVistaGrid || props?.todoElDia) {
        info.el.style.setProperty("display", "none", "important");
        return;
      }
    }

    // En vistas semanales y diarias (timeGrid): ocultar eventos exclusivos de vista mensual
    if (info.view.type !== "dayGridMonth" && props?.soloVistaMes) {
      info.el.style.setProperty("display", "none", "important");
      return;
    }

    if (props?.esRestriccion) {
      const { colorBg, colorBorder, colorText } = props;
      if (colorBg) {
        info.el.style.setProperty("background-color", colorBg, "important");
        info.el.style.setProperty("border-color", colorBorder, "important");
        info.el.style.setProperty("color", colorText, "important");
      }
      info.el.style.setProperty("--fc-event-color", "#cbd5e1", "important");
      info.el.style.setProperty("--fc-forma-event", "#cbd5e1", "important");
      info.el.style.setProperty("border-left", "none", "important");
      info.el.style.setProperty("border-left-width", "0px", "important");
      info.el.style.setProperty("border-left-color", "transparent", "important");
      info.el.style.setProperty("border-inline-start", "none", "important");
      info.el.style.setProperty("border-inline-start-width", "0px", "important");
      info.el.style.setProperty("border-inline-start-color", "transparent", "important");
      info.el.style.setProperty("font-weight", "600", "important");
      info.el.style.setProperty("cursor", "pointer", "important");
    } else {
      // Turno médico: contenedor de FullCalendar transparente para lucir la tarjeta médica
      info.el.style.setProperty("background", "transparent", "important");
      info.el.style.setProperty("background-color", "transparent", "important");
      info.el.style.setProperty("border", "none", "important");
      info.el.style.setProperty("box-shadow", "none", "important");
      info.el.style.setProperty("padding", "0px", "important");
      info.el.style.setProperty("overflow", "visible", "important");
    }
  };

  const getDayCellClassNames = (arg) => {
    const y = arg.date.getFullYear();
    const m = String(arg.date.getMonth() + 1).padStart(2, "0");
    const d = String(arg.date.getDate()).padStart(2, "0");
    const fechaKey = `${y}-${m}-${d}`;

    const restDia = restricciones.find(
      (r) => r.todoElDia && fechaKey >= r.fechaInicio && fechaKey <= r.fechaFin
    );

    if (restDia) {
      return ["celda-bloqueada-completo", "bg-slate-300", "text-slate-700"];
    }
    return [];
  };

  const renderEventContent = (eventInfo) => {
    const props = eventInfo.event.extendedProps || {};

    if (eventInfo.view.type === "dayGridMonth") {
      if (props?.esRestriccion) {
        if (props.todoElDia) {
          // La celda de día completo debe quedar completamente limpia (solo con el número del día)
          return null;
        } else {
          return (
            <div
              className="w-full px-1.5 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[10px] font-semibold text-gray-600 truncate flex items-center gap-1 select-none"
              title={`🔒 ${props.horaInicio || ""} - ${props.horaFin || ""} · ${props.motivo || ""}`}
            >
              <span>🔒</span>
              <span className="truncate">
                {props.horaInicio} - {props.horaFin} · {props.motivo}
              </span>
            </div>
          );
        }
      }
      return null;
    }

    // Si es restricción / bloqueo en Vista Diaria o Semanal
    if (props?.esRestriccion) {
      return (
        <div className="w-full h-full flex flex-col justify-center p-1 overflow-hidden select-none">
          <span className="font-bold truncate text-xs">🔒 {props.motivo || "Bloqueo"}</span>
          <span className="text-[10px] opacity-80 truncate">
            {props.horaInicio} - {props.horaFin} hs
          </span>
        </div>
      );
    }

    // Tarjeta médica de Turno en Vista Diaria y Semanal
    const turno = props;
    const esSemana = eventInfo.view.type === "timeGridWeek";

    // 1. Extraer nombre del paciente
    const nombrePaciente = turno.Paciente
      ? `${turno.Paciente.nombre || ""} ${turno.Paciente.apellido || ""}`.trim()
      : (turno.paciente_nombre || turno.nombre_paciente || `Paciente #${turno.id_paciente || ""}`);

    // 2. Extraer horarios y calcular duración
    const startDate = eventInfo.event.start || (turno.fecha_hora_inicio ? new Date(turno.fecha_hora_inicio) : null);
    const endDate = eventInfo.event.end || (turno.fecha_hora_fin ? new Date(turno.fecha_hora_fin) : null);

    const formatoHora = (d) => {
      if (!d || isNaN(d.getTime())) return "";
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    };

    const horaInicio = formatoHora(startDate);
    const horaFin = formatoHora(endDate);

    let duracion = "";
    if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const diffMin = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
      if (diffMin > 0) {
        const horas = diffMin / 60;
        if (horas >= 1) {
          duracion = horas % 1 === 0 ? `${horas}h` : `${horas.toFixed(1)}h`;
        } else {
          duracion = `${diffMin}m`;
        }
      }
    }

    // 3. Estado del turno y estilos dinámicos (Borde fuerte + fondo pastel/claro)
    const estadoRaw = (
      turno.estado ||
      turno.EstadoTurno?.nombre ||
      turno.EstadoTurno?.estado ||
      turno.estado_turno ||
      ""
    ).toString().toLowerCase().trim();

    const idEstado = Number(turno.id_estado);

    let estilosContenedor;
    let estilosBadge;
    let textoEstado;

    if (estadoRaw.includes("atendido") || idEstado === 2) {
      estilosContenedor = "bg-emerald-50/90 border border-emerald-400 border-l-4 border-l-emerald-500 text-emerald-950 hover:bg-emerald-100/90";
      estilosBadge = "bg-emerald-100/90 text-emerald-800 border border-emerald-300";
      textoEstado = "✓ ATENDIDO";
    } else if (estadoRaw.includes("espera") || estadoRaw.includes("pendiente")) {
      estilosContenedor = "bg-amber-50/90 border border-amber-400 border-l-4 border-l-amber-500 text-amber-950 hover:bg-amber-100/90";
      estilosBadge = "bg-amber-100 text-amber-800 border border-amber-300";
      textoEstado = "EN ESPERA";
    } else if (estadoRaw.includes("cancelado") || idEstado === 3) {
      estilosContenedor = "bg-rose-50/90 border border-rose-400 border-l-4 border-l-rose-500 text-rose-950 hover:bg-rose-100/90";
      estilosBadge = "bg-rose-100 text-rose-800 border border-rose-300";
      textoEstado = "CANCELADO";
    } else if (estadoRaw.includes("inasistente") || estadoRaw.includes("ausente") || idEstado === 4) {
      estilosContenedor = "bg-slate-100/90 border border-slate-400 border-l-4 border-l-slate-500 text-slate-800 hover:bg-slate-200/90";
      estilosBadge = "bg-slate-200 text-slate-800 border border-slate-300";
      textoEstado = "AUSENTE";
    } else {
      // Programado / Confirmado / Default
      estilosContenedor = "bg-blue-50/90 border border-blue-400 border-l-4 border-l-blue-500 text-blue-950 hover:bg-blue-100/90";
      estilosBadge = "bg-blue-100 text-blue-800 border border-blue-300";
      textoEstado = "PROGRAMADO";
    }

        // Vista semanal: columnas angostas → tarjeta reducida
    if (esSemana) {
      const COLOR_PUNTO = {
        "✓ ATENDIDO": "bg-emerald-500",
        "EN ESPERA": "bg-amber-500",
        CANCELADO: "bg-rose-500",
        AUSENTE: "bg-slate-500",
        PROGRAMADO: "bg-blue-500",
      };
      const colorPunto = COLOR_PUNTO[textoEstado] || "bg-blue-500";

      // Mobile: solo la franja de color (sin datos). Al tocarla, eventClick abre el detalle.
      if (esMobile) {
        return (
          <div
            className={`w-full h-full rounded-md cursor-pointer ${colorPunto}`}
            title={`${nombrePaciente} (${horaInicio} - ${horaFin} hs) · ${textoEstado}`}
          />
        );
      }

      // Desktop: 2 renglones (nombre + punto de estado, horario)
      return (
        <div
          className={`w-full h-full rounded-lg px-2 py-1 flex flex-col justify-center shadow-xs cursor-pointer select-none overflow-hidden ${estilosContenedor}`}
          title={`${nombrePaciente} (${horaInicio} - ${horaFin} hs) · ${textoEstado}`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate flex-1 min-w-0 text-xs font-bold leading-4">{nombrePaciente}</span>
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorPunto}`} />
          </div>
          <div className="text-[11px] leading-4 opacity-85 truncate">
            🕒 {horaInicio} - {horaFin}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`w-full h-full rounded-xl px-2 py-1 sm:px-2.5 flex ${
          esSemana
            ? "flex-col items-start justify-between gap-1"
            : "flex-row items-center justify-between"
        } shadow-xs transition-all cursor-pointer select-none overflow-hidden ${estilosContenedor}`}
        title={`${nombrePaciente} (${horaInicio} - ${horaFin} hs) · ${textoEstado}`}
      >
        {/* Lado izquierdo: Datos del paciente y horario */}
        <div className="flex flex-col justify-center overflow-hidden min-w-0 w-full flex-1">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold truncate leading-4">
            <span className="text-xs sm:text-sm shrink-0">👤</span>
            <span className="truncate">{nombrePaciente}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs opacity-85 truncate leading-4">
            <span className="truncate">🕒 {horaInicio} - {horaFin} hs</span>
            {duracion && (
              <span className="px-1.5 py-0.2 rounded-md bg-white/80 border border-gray-200 font-semibold text-[9px] sm:text-[10px] shrink-0">
                {duracion}
              </span>
            )}
          </div>
        </div>

        {/* Lado derecho: Badge de estado */}
        <div className={`shrink-0 ${esSemana ? "mt-0.5" : "ml-2"}`}>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-semibold ${estilosBadge}`}>
            {textoEstado}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      {...handlers}
      ref={contenedorRef}
      className={`w-full h-full bg-white relative flex flex-col agenda-vista-${vistaTipo}`}
    >
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
          buttons={{
            today: { text: "Hoy" },
            timeGridDay: { text: "Diaria" },
            timeGridWeek: { text: "Semanal" },
            dayGridMonth: { text: "Mensual" },
          }}
          views={
            esMobile
              ? {
                  timeGridDay: {
                    titleFormat: { day: "numeric", month: "short", year: "numeric" },
                  },
                }
              : undefined
          }
          firstDay={1}
          slotMinTime={slotMinTimeStr}
          slotMaxTime={slotMaxTimeStr}
          scrollTime={slotMinTimeStr}
          slotMinHeight={100}
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
          selectable={vistaTipo !== "dayGridMonth"}
          selectAllow={selectAllow}
          editable={true}
          eventDurationEditable={false}
          nowIndicator={true}
          height="100%"
          events={listaEventos}
          select={handleDateSelect}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventDidMount={handleEventDidMount}
          dayCellClassNames={getDayCellClassNames}
          eventContent={renderEventContent}
          datesSet={(dateInfo) => {
            const nuevoTipo = dateInfo.view.type;
            setVistaTipo(nuevoTipo);
            const idx = VISTAS.indexOf(nuevoTipo);
            if (idx !== -1) setVistaActual(idx);
            if (onVistaChangeRef.current) onVistaChangeRef.current(nuevoTipo);
          }}
        />
      </div>

      {/* Modal de Restricción / Bloqueo */}
      <ModalRestriccion
        isOpen={modalRestriccionAbierto}
        onClose={handleCerrarModal}
        rangoFechas={rangoFechasSeleccionadas}
        turnos={turnos}
        onGuardar={(datosRestriccion) => {
          const conflictoConTurnos = validarBloqueoConTurnos(datosRestriccion, turnos);
          if (conflictoConTurnos) {
            toast.error(
              "No se puede bloquear el período: Hay turnos asignados en esa fecha. Debes reprogramarlos o cancelarlos antes de aplicar el bloqueo.",
              { icon: "⚠️", duration: 5000 }
            );
            return;
          }
          agregarRestriccion(datosRestriccion);
          handleCerrarModal();
        }}
        onEliminar={(id) => {
          eliminarRestriccion(id);
        }}
        restriccionesExistentes={
          rangoFechasSeleccionadas
            ? obtenerRestriccionesDeRango(
                rangoFechasSeleccionadas.inicio,
                rangoFechasSeleccionadas.fin
              )
            : []
        }
      />

      <style>{`
        [class*="agenda-vista-"] [role="heading"],
        [class*="agenda-vista-"] .fc-toolbar-title {
          display: inline-block;
        }
        [class*="agenda-vista-"] [role="heading"]::first-letter,
        [class*="agenda-vista-"] .fc-toolbar-title::first-letter {
          text-transform: uppercase;
        }
        .fc-bg-event {
          opacity: 1 !important;
          pointer-events: none !important;
        }

        .fc-non-business {
          pointer-events: none !important;
        }

        .agenda-vista-dayGridMonth [role="cell"][data-date],
        .agenda-vista-dayGridMonth td[data-date] {
          background-color: #ffffff;
          transition: background-color 0.15s ease, box-shadow 0.15s ease;
          user-select: none !important;
        }

        .agenda-vista-dayGridMonth [role="cell"][data-date]:hover,
        .agenda-vista-dayGridMonth td[data-date]:hover {
          filter: brightness(0.97);
        }
        .agenda-vista-dayGridMonth [role="cell"][data-date],
        .agenda-vista-dayGridMonth td[data-date] {
          -webkit-touch-callout: none;
        }

        /* Feedback visual interactivo al arrastrar (Click & Drag) */
        .agenda-vista-dayGridMonth .celda-drag-resaltada {
          background-color: #f0fdfa !important; /* bg-teal-50 */
          box-shadow: inset 0 0 0 2px #2dd4bf !important; /* ring-2 ring-teal-400 */
          cursor: grabbing !important;
        }

        /* Celda de día completo bloqueado en Vista Mensual: gris sólido bien visible y sin adornos */
        .agenda-vista-dayGridMonth td.celda-bloqueada-completo,
        .agenda-vista-dayGridMonth [role="cell"].celda-bloqueada-completo,
        .agenda-vista-dayGridMonth td.celda-bloqueada-completo .fc-daygrid-day-frame,
        .agenda-vista-dayGridMonth td.celda-bloqueada-completo .fc-daygrid-day-bg,
        .agenda-vista-dayGridMonth td.celda-bloqueada-completo .fc-daygrid-day-events {
          background-color: #cbd5e1 !important; /* bg-slate-300 */
          color: #1e293b !important; /* text-slate-800 */
          cursor: pointer !important;
          border-left: none !important;
        }

        .agenda-vista-dayGridMonth td.celda-bloqueada-completo .fc-daygrid-day-number,
        .agenda-vista-dayGridMonth [role="cell"].celda-bloqueada-completo .fc-daygrid-day-number {
          color: #1e293b !important;
          font-weight: 700 !important;
        }

        .agenda-vista-dayGridMonth td.celda-bloqueada-completo,
        .agenda-vista-dayGridMonth td.celda-bloqueada-completo * {
          border-left-color: #cbd5e1 !important;
        }

        /* Evento de día completo en Vista Mensual: sin píldora ni bordes, solo texto limpio */
        .agenda-vista-dayGridMonth .fc-event.restriccion-dia-completo {
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          cursor: pointer !important;
        }
        .agenda-vista-dayGridMonth .fc-event.restriccion-dia-completo .fc-event-main {
          background: transparent !important;
          padding: 0 !important;
          width: 100% !important;
        }

        /* Pastilla compacta para franja horaria en Vista Mensual */
        .agenda-vista-dayGridMonth .fc-event.restriccion-franja-mes {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 1px 0 !important;
          width: 100% !important;
          cursor: pointer !important;
        }

        /* Extirpación total de línea verde en restricciones y franjas */
        .fc-event.restriccion-dia-completo,
        .fc-event.restriccion-franja-mes,
        .fc-event.restriccion-dia-grid,
        .fc-event.restriccion-franja-grid,
        .fc-timegrid-event.restriccion-dia-grid,
        .fc-timegrid-event.restriccion-franja-grid,
        .fc-daygrid-event.restriccion-franja-mes,
        .fc-daygrid-event.restriccion-dia-completo {
          --fc-event-color: #cbd5e1 !important;
          --fc-forma-event: #cbd5e1 !important;
          --fc-event-border-color: #cbd5e1 !important;
          border-left: none !important;
          border-left-width: 0 !important;
          border-left-color: transparent !important;
          border-inline-start: none !important;
          border-inline-start-width: 0 !important;
          border-inline-start-color: transparent !important;
        }

        .fc-event.restriccion-dia-completo *,
        .fc-event.restriccion-franja-mes *,
        .fc-event.restriccion-dia-grid *,
        .fc-event.restriccion-franja-grid * {
          border-left-color: transparent !important;
          border-inline-start-color: transparent !important;
        }

        /* Bloques de restricción en grilla horaria (Semana y Día) */
        .fc-event.restriccion-dia-grid,
        .fc-event.restriccion-franja-grid {
          background-color: #f1f5f9 !important; /* bg-slate-100 */
          border: 1px dashed #94a3b8 !important; /* border-slate-400 */
          border-left: 1px dashed #94a3b8 !important;
          border-inline-start: 1px dashed #94a3b8 !important;
          color: #334155 !important;
          border-radius: 8px !important;
          font-size: 0.75rem !important;
          font-weight: 700 !important;
          padding: 4px 6px !important;
          cursor: pointer !important;
          box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2) !important;
        }

        .fc-event.restriccion-dia-grid .fc-event-main,
        .fc-event.restriccion-franja-grid .fc-event-main,
        .fc-event.restriccion-dia-grid .fc-event-title,
        .fc-event.restriccion-dia-grid .fc-event-time,
        .fc-event.restriccion-franja-grid .fc-event-title,
        .fc-event.restriccion-franja-grid .fc-event-time {
          background: transparent !important;
          border: none !important;
          border-left: none !important;
          border-inline-start: none !important;
          color: #334155 !important;
        }

        .fc-event.restriccion-dia-grid:hover,
        .fc-event.restriccion-franja-grid:hover {
          filter: brightness(0.96) !important;
        }

        /* Tarjetas de Turnos en Vista Diaria y Semanal */
        .fc-timegrid-event.turno-card-event,
        .fc-v-event.turno-card-event,
        .fc-timegrid-event.turno-card-event:hover,
        .fc-v-event.turno-card-event:hover {
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 1px !important;
          overflow: visible !important;
        }

        .fc-timegrid-event.turno-card-event .fc-event-main,
        .fc-v-event.turno-card-event .fc-event-main {
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          padding: 0 !important;
          height: 100% !important;
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
        }

        .agenda-vista-timeGridWeek [role="columnheader"][data-date] {
          background-color: #ffffff !important;
          transition: background-color 0.2s ease;
        }

        ${estilosOcupacionPorFecha}
      `
      }</style>
    </div>
  );
};

export default AgendaCalendar;
