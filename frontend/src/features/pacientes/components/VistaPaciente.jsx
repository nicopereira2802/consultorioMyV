/** @format */

import { useState, useEffect, useMemo } from "react";
import Modal from "../../../components/common/Modal";
import api from "../../../services/api";
import { calcularEdad } from "../utils/calcularEdad";
import { formatFechaTabla, formatSoloHora } from "../../../utils/index";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  CalendarClock,
  CheckCircle2,
  XCircle,
  UserRoundX,
  FileText,
  Search,
  Banknote,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Layers,
} from "lucide-react";

// Formateador de moneda consistente para todo el módulo (estilo argentino: $ 32.000,00)
export const formatearMoneda = (valor) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0);
};

// Mapeo visual de estados idéntico a Gestión de Turnos
const estadosMap = {
  Programado: {
    color: "bg-amber-50 text-amber-700 border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    icon: CalendarClock,
  },
  Atendido: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle2,
  },
  Cancelado: {
    color: "bg-red-50 text-red-700 border-red-200",
    badge: "bg-red-100 text-red-800",
    icon: XCircle,
  },
  Inasistente: {
    color: "bg-purple-50 text-purple-700 border-purple-200",
    badge: "bg-purple-100 text-purple-800",
    icon: UserRoundX,
  },
  Reprogramado: {
    color: "bg-blue-50 text-blue-700 border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    icon: Clock,
  },
};

// Extrae las prácticas odontológicas de un turno independientemente del formato de la respuesta
function extraerPracticas(turno) {
  if (Array.isArray(turno.PracticaTurnos) && turno.PracticaTurnos.length > 0) {
    return turno.PracticaTurnos.map((pt) => ({
      id: pt.id_practica_turno || pt.id_practica,
      codigo: pt.Practica?.codigo_nomenclador,
      nombre: pt.Practica?.nombre_referencia || pt.Practica?.nombre_nomenclador || "Práctica Odontológica",
      especialidad: pt.Practica?.especialidad,
    }));
  }
  if (Array.isArray(turno.Practicas) && turno.Practicas.length > 0) {
    return turno.Practicas.map((p) => ({
      id: p.id_practica,
      codigo: p.codigo_nomenclador,
      nombre: p.nombre_referencia || p.nombre_nomenclador || "Práctica Odontológica",
      especialidad: p.especialidad,
    }));
  }
  if (Array.isArray(turno.practicas) && turno.practicas.length > 0) {
    return turno.practicas.map((p) => ({
      id: p.id_practica || p.id,
      codigo: p.codigo_nomenclador || p.codigo,
      nombre: p.nombre_referencia || p.nombre_nomenclador || p.nombre || "Práctica Odontológica",
      especialidad: p.especialidad,
    }));
  }
  return [];
}

// Calcula de forma fiel y completa los datos financieros de cada turno
export function calcularDatosCobroTurno(turno) {
  const estado = (turno.EstadoTurno?.estado || turno.estado || "").toLowerCase();

  // Excluir turnos cancelados
  if (estado === "cancelado") {
    return {
      totalAcordado: 0,
      totalPagado: 0,
      saldoRestante: 0,
      estadoCobroLabel: "Cancelado",
      estadoCobroColor: "bg-gray-100 text-gray-500 border-gray-200",
      esCancelado: true,
    };
  }

  const cobro = turno.Cobro;
  if (cobro) {
    const totalAcordado = Number(cobro.monto_a_cobrar ?? turno.precio_final ?? turno.precio ?? 0);
    const cuotas = cobro.Cuota || cobro.Cuotas || [];
    const totalPagado = cuotas.reduce((acc, c) => acc + (Number(c.monto_cobrado) || 0), 0);

    // Priorizar saldo explícito si el backend lo provee, de lo contrario totalAcordado - totalPagado
    const saldoExplicito = turno.saldo_restante ?? turno.saldo_pendiente ?? cobro.saldo_pendiente;
    const saldoRestante =
      saldoExplicito !== undefined && saldoExplicito !== null
        ? Math.max(0, Number(saldoExplicito))
        : Math.max(0, totalAcordado - totalPagado);

    let estadoCobroLabel = "Sin Cobro";
    let estadoCobroColor = "bg-gray-100 text-gray-600 border-gray-200";

    if (saldoRestante === 0 && totalAcordado > 0) {
      estadoCobroLabel = "Pagado";
      estadoCobroColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
    } else if (totalPagado > 0) {
      estadoCobroLabel = `Falta ${formatearMoneda(saldoRestante)}`;
      estadoCobroColor = "bg-amber-100 text-amber-800 border-amber-200";
    } else if (saldoRestante > 0) {
      estadoCobroLabel = `Pendiente ${formatearMoneda(saldoRestante)}`;
      estadoCobroColor = "bg-rose-100 text-rose-800 border-rose-200";
    }

    return {
      totalAcordado,
      totalPagado,
      saldoRestante,
      estadoCobroLabel,
      estadoCobroColor,
      esCancelado: false,
    };
  }

  // Turno sin Cobro registrado
  const precio = Number(turno.precio_final ?? turno.precio ?? 0);
  if (estado === "atendido") {
    const abonado = Number(turno.monto_abonado || 0);
    const saldoExplicito = turno.saldo_restante ?? turno.saldo_pendiente;
    const saldoRestante =
      saldoExplicito !== undefined && saldoExplicito !== null
        ? Math.max(0, Number(saldoExplicito))
        : Math.max(0, precio - abonado);

    return {
      totalAcordado: precio,
      totalPagado: abonado,
      saldoRestante,
      estadoCobroLabel: saldoRestante > 0 ? `Pendiente ${formatearMoneda(saldoRestante)}` : "Sin Cargo",
      estadoCobroColor:
        saldoRestante > 0
          ? "bg-rose-100 text-rose-800 border-rose-200"
          : "bg-gray-100 text-gray-600 border-gray-200",
      esCancelado: false,
    };
  }

  // Otros estados sin atención médica realizada ni cobro (ej. Programado)
  return {
    totalAcordado: precio,
    totalPagado: 0,
    saldoRestante: 0,
    estadoCobroLabel: "Sin Cobro",
    estadoCobroColor: "bg-gray-100 text-gray-600 border-gray-200",
    esCancelado: false,
  };
}

export function VistaPaciente({ isOpen, onClose, paciente }) {
  const navigate = useNavigate();
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Estados de Filtros y Acordeón
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [acordeonAbiertoId, setAcordeonAbiertoId] = useState(null);

  // Paginación interna de turnos del paciente
  const [paginaActual, setPaginaActual] = useState(1);
  const TURNOS_POR_PAGINA = 5;

  useEffect(() => {
    if (isOpen && paciente?.id_paciente) {
      cargarFichaYTurnosPaciente(paciente.id_paciente);
    } else {
      setTurnos([]);
      setFiltroEstado("Todos");
      setBusqueda("");
      setSoloPendientes(false);
      setAcordeonAbiertoId(null);
      setPaginaActual(1);
    }
  }, [isOpen, paciente]);

  const cargarFichaYTurnosPaciente = async (idPaciente) => {
    setCargando(true);
    try {
      const res = await api.get(`/turnos/paciente/${idPaciente}`);
      const lista = res.data.data || [];
      setTurnos(lista);
    } catch (error) {
      console.error("Error al cargar la historia del paciente:", error);
      setTurnos([]);
    } finally {
      setCargando(false);
    }
  };

  // Cálculo de la edad
  const edadCalculada = useMemo(
    () => calcularEdad(paciente?.fecha_nacimiento),
    [paciente?.fecha_nacimiento],
  );

  // Métricas y contadores de turnos por estado
  const metricas = useMemo(() => {
    const total = turnos.length;
    const programados = turnos.filter((t) => t.EstadoTurno?.estado === "Programado").length;
    const atendidos = turnos.filter((t) => t.EstadoTurno?.estado === "Atendido").length;
    const cancelados = turnos.filter((t) => t.EstadoTurno?.estado === "Cancelado").length;
    const inasistentes = turnos.filter((t) => t.EstadoTurno?.estado === "Inasistente").length;
    return { total, programados, atendidos, cancelados, inasistentes };
  }, [turnos]);

  // Cálculo dinámico del saldo acumulado real de todos los turnos del paciente
  const saldoTotalPendiente = useMemo(() => {
    if (!turnos || !Array.isArray(turnos)) return 0;

    return turnos.reduce((acumulado, turno) => {
      const { saldoRestante } = calcularDatosCobroTurno(turno);
      return acumulado + (saldoRestante > 0 ? saldoRestante : 0);
    }, 0);
  }, [turnos]);

  // Filtrado de Turnos (Píldoras de Estado + Solo Impagos + Búsqueda por texto)
  const turnosFiltrados = useMemo(() => {
    return turnos.filter((t) => {
      // 1. Filtro por píldoras de estado
      const estadoActual = t.EstadoTurno?.estado || "Sin estado";
      if (filtroEstado !== "Todos" && estadoActual.toLowerCase() !== filtroEstado.toLowerCase()) {
        return false;
      }

      // 2. Filtro de pendientes de cobro
      if (soloPendientes) {
        const { saldoRestante } = calcularDatosCobroTurno(t);
        if (saldoRestante <= 0) return false;
      }

      // 3. Búsqueda por texto (fecha, notas, estado, ID o prácticas)
      if (busqueda.trim() !== "") {
        const query = busqueda.toLowerCase().trim();
        const fecha = formatFechaTabla(t.fecha_hora_inicio).toLowerCase();
        const notas = (t.notas_consulta || "").toLowerCase();
        const estado = estadoActual.toLowerCase();
        const idStr = `#${t.id_turno}`;
        const practicas = extraerPracticas(t);
        const practicasStr = practicas
          .map((p) => `${p.nombre} ${p.codigo || ""}`)
          .join(" ")
          .toLowerCase();

        return (
          fecha.includes(query) ||
          notas.includes(query) ||
          estado.includes(query) ||
          idStr.includes(query) ||
          practicasStr.includes(query)
        );
      }

      return true;
    });
  }, [turnos, filtroEstado, soloPendientes, busqueda]);

  // Paginación interna
  const totalPaginas = Math.ceil(turnosFiltrados.length / TURNOS_POR_PAGINA) || 1;
  const turnosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * TURNOS_POR_PAGINA;
    return turnosFiltrados.slice(inicio, inicio + TURNOS_POR_PAGINA);
  }, [turnosFiltrados, paginaActual]);

  const toggleAcordeon = (idTurno) => {
    setAcordeonAbiertoId((prev) => (prev === idTurno ? null : idTurno));
  };

  const irACobrar = (idTurno) => {
    onClose();
    navigate("/cobros", { state: { id_turno_cobrar: idTurno } });
  };

  if (!paciente) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-4xl"
      title={`Ficha Clínica y Cuenta Corriente: ${paciente.nombre || ""} ${paciente.apellido || ""}`}
    >
      <div className="flex flex-col gap-4 text-sm max-h-[78vh] overflow-y-auto pr-1">
        {/* ─── TARJETA PRINCIPAL DEL PACIENTE ─── */}
        <div className="bg-gradient-to-br from-gray-50 to-[#e8f7f1]/30 p-4 rounded-2xl border border-gray-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2eb086] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                {paciente.nombre?.charAt(0)}
                {paciente.apellido?.charAt(0)}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-gray-800 leading-tight">
                  {paciente.apellido}, {paciente.nombre}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium mt-0.5">
                  <span>DNI: {paciente.dni || "S/D"}</span>
                  <span>•</span>
                  <span>Tel: {paciente.telefono || "S/D"}</span>
                  {paciente.domicilio && (
                    <>
                      <span>•</span>
                      <span>{paciente.domicilio}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* EDAD DESTACADA Y FECHA DE NACIMIENTO */}
            <div className="text-left sm:text-right bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                Edad del Paciente
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-black text-[#2eb086]">
                  {edadCalculada !== null ? `${edadCalculada} años` : "S/D"}
                </span>
                {paciente.fecha_nacimiento && (
                  <span className="text-[11px] font-medium text-gray-400">
                    ({formatFechaTabla(paciente.fecha_nacimiento)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* INDICADORES FINANCIEROS (RESUMEN DE CUENTA) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Turnos
              </span>
              <span className="text-sm font-black text-gray-800 mt-1 block">
                {turnos.length} registrados
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Saldo Pendiente
              </span>
              <span
                className={`text-base sm:text-lg font-black mt-1 block ${
                  saldoTotalPendiente > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {formatearMoneda(saldoTotalPendiente)}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white p-3 rounded-xl border border-gray-100 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Estado Cuenta
                </span>
                <span
                  className={`text-xs sm:text-sm font-black mt-1 block ${
                    saldoTotalPendiente > 0 ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  {saldoTotalPendiente > 0 ? "Saldo Pendiente" : "Al Día"}
                </span>
              </div>
              <span
                className={`p-2 rounded-xl text-xs font-bold ${
                  saldoTotalPendiente > 0 ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {saldoTotalPendiente > 0 ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              </span>
            </div>
          </div>
        </div>

        {/* ─── PÍLDORAS DE ESTADO (FILTRO DINÁMICO) ─── */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "Todos", label: "Todos", count: metricas.total },
            { id: "Programado", label: "Programados", count: metricas.programados },
            { id: "Atendido", label: "Atendidos", count: metricas.atendidos },
            { id: "Cancelado", label: "Cancelados", count: metricas.cancelados },
            { id: "Inasistente", label: "Inasistentes", count: metricas.inasistentes },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => {
                setFiltroEstado(btn.id);
                setPaginaActual(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                filtroEstado === btn.id
                  ? "bg-[#2eb086] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>{btn.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  filtroEstado === btn.id ? "bg-white/20 text-white" : "bg-white text-gray-600"
                }`}
              >
                {btn.count}
              </span>
            </button>
          ))}
        </div>

        {/* ─── BARRA DE BÚSQUEDA Y FILTRO DE PENDIENTES ─── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por fecha, notas, prácticas o #ID..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2eb086]/40 focus:outline-none focus:border-[#2eb086] transition-all"
            />
          </div>

          {/* CHECKBOX MOSTRAR SOLO PENDIENTES */}
          <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={soloPendientes}
              onChange={(e) => {
                setSoloPendientes(e.target.checked);
                setPaginaActual(1);
              }}
              className="w-4 h-4 text-[#2eb086] rounded border-gray-300 focus:ring-[#2eb086] accent-[#2eb086]"
            />
            <span>Solo Impagos / Parciales</span>
          </label>
        </div>

        {/* ─── HISTORIAL DE TURNOS Y ATENCIONES (ACORDEÓN) ─── */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Historial de Atenciones ({turnosFiltrados.length})
            </span>
          </div>

          {cargando ? (
            <div className="p-8 flex flex-col items-center justify-center gap-3 text-gray-400">
              <div className="w-8 h-8 border-3 border-[#2eb086] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Cargando turnos e historial del paciente...</span>
            </div>
          ) : turnosPaginados.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-2xl border border-dashed border-gray-200 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                <Calendar size={22} />
              </div>
              <p className="font-semibold text-gray-700 text-sm">
                {turnos.length === 0
                  ? "Este paciente aún no tiene turnos registrados."
                  : "No se encontraron turnos con los filtros seleccionados."}
              </p>
              <p className="text-xs text-gray-400">
                {turnos.length === 0
                  ? "Puedes agendar un nuevo turno desde la sección de Gestión de Turnos."
                  : "Intenta cambiar el estado seleccionado o borrar el texto de búsqueda."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {turnosPaginados.map((t) => {
                const {
                  totalAcordado,
                  totalPagado,
                  saldoRestante,
                  estadoCobroLabel,
                  estadoCobroColor,
                } = calcularDatosCobroTurno(t);

                const esDesplegado = acordeonAbiertoId === t.id_turno;

                const estadoInfo = estadosMap[t.EstadoTurno?.estado] || {
                  color: "bg-gray-50 text-gray-700 border-gray-200",
                  badge: "bg-gray-100 text-gray-700",
                  icon: AlertCircle,
                };
                const IconoEstado = estadoInfo.icon;
                const practicas = extraerPracticas(t);

                return (
                  <div
                    key={t.id_turno}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs transition-all hover:border-gray-300"
                  >
                    {/* CABECERA DEL ACORDEÓN */}
                    <div
                      onClick={() => toggleAcordeon(t.id_turno)}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/80 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 border ${estadoInfo.color}`}
                          title={t.EstadoTurno?.estado}
                        >
                          <IconoEstado size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-gray-800 text-xs sm:text-sm">
                              {formatFechaTabla(t.fecha_hora_inicio)}
                            </span>
                            <span className="text-[11px] font-medium text-gray-400">
                              {formatSoloHora(t.fecha_hora_inicio)} hs
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${estadoInfo.color}`}
                            >
                              <span>{t.EstadoTurno?.estado || "Programado"}</span>
                            </span>
                          </div>

                          {/* SUBTÍTULO CON PRÁCTICAS ASOCIADAS */}
                          {practicas.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              <span className="text-[11px] text-gray-500 font-medium">Prácticas:</span>
                              {practicas.slice(0, 2).map((pt, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#e8f7f1] text-[#259370] rounded-md font-medium text-[11px] truncate max-w-[200px]"
                                  title={pt.nombre}
                                >
                                  <Layers size={10} className="shrink-0" />
                                  <span className="truncate">{pt.nombre}</span>
                                </span>
                              ))}
                              {practicas.length > 2 && (
                                <span className="text-[10px] text-gray-400 font-medium">
                                  +{practicas.length - 2} más
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic block mt-0.5">
                              Sin prácticas asociadas
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        {totalAcordado > 0 && (
                          <span className="font-bold text-gray-700 text-xs sm:text-sm">
                            {formatearMoneda(totalAcordado)}
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${estadoCobroColor}`}
                        >
                          {estadoCobroLabel}
                        </span>

                        <button
                          type="button"
                          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          title={esDesplegado ? "Ocultar detalle" : "Ver detalle completo"}
                        >
                          {esDesplegado ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* CONTENIDO DESPLEGABLE DEL ACORDEÓN */}
                    {esDesplegado && (
                      <div className="p-4 bg-gray-50/70 border-t border-gray-100 text-xs space-y-3.5 animate-fadeIn">
                        {/* NOTAS, PRÁCTICAS Y COBROS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* 1. PRÁCTICAS ODONTOLÓGICAS COMPLETAS */}
                          <div className="bg-white p-3 rounded-xl border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                              <Layers size={12} className="text-[#2eb086]" />
                              <span>Prácticas Realizadas ({practicas.length})</span>
                            </span>
                            {practicas.length > 0 ? (
                              <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {practicas.map((pt, idx) => (
                                  <li key={idx} className="text-gray-700 text-xs flex items-start gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#2eb086] mt-1.5 shrink-0" />
                                    <div>
                                      <span className="font-medium text-gray-800">{pt.nombre}</span>
                                      {pt.codigo && (
                                        <span className="text-[10px] text-gray-400 ml-1">
                                          (Cód: {pt.codigo})
                                        </span>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-400 italic text-[11px]">
                                Ninguna práctica registrada para este turno.
                              </p>
                            )}
                          </div>

                          {/* 2. NOTAS CLÍNICAS / OBSERVACIONES */}
                          <div className="bg-white p-3 rounded-xl border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                              <FileText size={12} className="text-[#2eb086]" />
                              <span>Notas de Consulta</span>
                            </span>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto pr-1">
                              {t.notas_consulta || (
                                <span className="text-gray-400 italic">Sin observaciones registradas.</span>
                              )}
                            </p>
                          </div>

                          {/* 3. RESUMEN DE COBRO */}
                          <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                              <Banknote size={12} className="text-[#2eb086]" />
                              <span>Resumen de Cobro</span>
                            </span>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Monto Total:</span>
                              <span className="font-bold text-gray-800">
                                {formatearMoneda(totalAcordado)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Abonado:</span>
                              <span className="font-bold text-emerald-600">
                                {formatearMoneda(totalPagado)}
                              </span>
                            </div>
                            <div className="flex justify-between border-t border-gray-100 pt-1.5">
                              <span className="font-bold text-gray-700">Saldo Restante:</span>
                              <span
                                className={`font-bold ${
                                  saldoRestante > 0 ? "text-rose-600" : "text-emerald-600"
                                }`}
                              >
                                {formatearMoneda(saldoRestante)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ACCIÓN IR A COBRAR */}
                        {saldoRestante > 0 && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => irACobrar(t.id_turno)}
                              className="flex items-center gap-1.5 bg-[#2eb086] hover:bg-[#259370] text-white px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
                            >
                              <Banknote size={14} />
                              <span>Registrar Cobro para este Turno</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* PAGINACIÓN DE LA FICHA */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-2 px-1">
              <span className="text-[11px] text-gray-500 font-medium">
                Página {paginaActual} de {totalPaginas}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={paginaActual === 1}
                  onClick={() => setPaginaActual((p) => p - 1)}
                  className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={paginaActual === totalPaginas}
                  onClick={() => setPaginaActual((p) => p + 1)}
                  className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PIE DEL MODAL */}
        <div className="border-t border-gray-200 pt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] font-bold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </Modal>
  );
}
