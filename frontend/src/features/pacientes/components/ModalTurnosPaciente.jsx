/** @format */

import { useState, useEffect, useMemo } from "react";
import Modal from "../../../components/common/Modal";
import api from "../../../services/api";
import {
  CalendarClock,
  Clock,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  UserRoundX,
  AlertCircle,
  FileText,
  Search,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatFechaTabla, formatSoloHora } from "../../../utils/formatearFecha";

// Mapeo de estados visuales idéntico a GestionTurnos
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

export function ModalTurnosPaciente({ isOpen, onClose, paciente }) {
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [turnoExpandidoId, setTurnoExpandidoId] = useState(null);

  useEffect(() => {
    if (isOpen && paciente?.id_paciente) {
      cargarTurnosPaciente(paciente.id_paciente);
    } else {
      setTurnos([]);
      setFiltroEstado("Todos");
      setBusqueda("");
      setTurnoExpandidoId(null);
    }
  }, [isOpen, paciente]);

  const cargarTurnosPaciente = async (idPaciente) => {
    setCargando(true);
    try {
      const res = await api.get("/turnos", {
        params: {
          id_paciente: idPaciente,
          limit: 100,
          sortField: "fecha_hora_inicio",
          sortOrder: "DESC",
        },
      });
      setTurnos(res.data.data || []);
    } catch (error) {
      console.error("Error al cargar turnos del paciente:", error);
      setTurnos([]);
    } finally {
      setCargando(false);
    }
  };

  // Contadores por estado
  const metricas = useMemo(() => {
    const total = turnos.length;
    const programados = turnos.filter((t) => t.EstadoTurno?.estado === "Programado").length;
    const atendidos = turnos.filter((t) => t.EstadoTurno?.estado === "Atendido").length;
    const cancelados = turnos.filter((t) => t.EstadoTurno?.estado === "Cancelado").length;
    const inasistentes = turnos.filter((t) => t.EstadoTurno?.estado === "Inasistente").length;
    return { total, programados, atendidos, cancelados, inasistentes };
  }, [turnos]);

  // Turnos filtrados por estado y búsqueda
  const turnosFiltrados = useMemo(() => {
    return turnos.filter((turno) => {
      const estadoActual = turno.EstadoTurno?.estado || "";
      const coincideEstado = filtroEstado === "Todos" || estadoActual === filtroEstado;

      const termino = busqueda.trim().toLowerCase();
      if (!termino) return coincideEstado;

      const fechaStr = formatFechaTabla(turno.fecha_hora_inicio).toLowerCase();
      const notasStr = (turno.notas_consulta || "").toLowerCase();
      const practicasStr = (turno.PracticaTurnos || [])
        .map((pt) => pt.Practica?.nombre_referencia || pt.Practica?.nombre_nomenclador || "")
        .join(" ")
        .toLowerCase();
      const idStr = `#${turno.id_turno}`;

      const coincideBusqueda =
        fechaStr.includes(termino) ||
        notasStr.includes(termino) ||
        practicasStr.includes(termino) ||
        idStr.includes(termino);

      return coincideEstado && coincideBusqueda;
    });
  }, [turnos, filtroEstado, busqueda]);

  const alternarExpansion = (id) => {
    setTurnoExpandidoId((prev) => (prev === id ? null : id));
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-4xl"
      title={`Historial de Turnos: ${paciente?.nombre || ""} ${paciente?.apellido || ""}`}
    >
      <div className="flex flex-col gap-4 text-sm text-gray-700">
        {/* ─── ENCABEZADO RESUMIDO DEL PACIENTE ─── */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#e8f7f1] text-[#2eb086] flex items-center justify-center font-bold text-sm shrink-0">
              {paciente?.nombre?.charAt(0)}
              {paciente?.apellido?.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-base">
                {paciente?.nombre} {paciente?.apellido}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <span>DNI: {paciente?.dni || <span className="italic">S/D</span>}</span>
                <span>•</span>
                <span>Tel: {paciente?.telefono || <span className="italic">S/D</span>}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 shadow-2xs">
              <Activity size={14} className="text-[#2eb086]" />
              <span>{metricas.total} {metricas.total === 1 ? "Turno registrado" : "Turnos registrados"}</span>
            </span>
          </div>
        </div>

        {/* ─── FILTROS Y BÚSQUEDA ─── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Botones píldora de estados */}
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
                onClick={() => setFiltroEstado(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  filtroEstado === btn.id
                    ? "bg-[#2eb086] text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{btn.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    filtroEstado === btn.id ? "bg-white/20 text-white" : "bg-white text-gray-600"
                  }`}
                >
                  {btn.count}
                </span>
              </button>
            ))}
          </div>

          {/* Campo de búsqueda interna */}
          <div className="relative min-w-[200px] sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar fecha, nota o práctica..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2eb086]/40 focus:border-[#2eb086] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* ─── TABLA DE TURNOS RESUMIDA ─── */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          {cargando ? (
            <div className="p-8 flex flex-col items-center justify-center gap-3 text-gray-400">
              <div className="w-8 h-8 border-3 border-[#2eb086] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Cargando turnos del paciente...</span>
            </div>
          ) : turnosFiltrados.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
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
                  : "Intenta modificar el término de búsqueda o el estado seleccionado."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <th className="px-4 py-3 w-14">ID</th>
                    <th className="px-4 py-3">Fecha y Horario</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Prácticas / Notas</th>
                    <th className="px-4 py-3 text-right">Precio Final</th>
                    <th className="px-4 py-3 text-center w-12">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {turnosFiltrados.map((turno) => {
                    const estadoInfo = estadosMap[turno.EstadoTurno?.estado] || {
                      color: "bg-gray-50 text-gray-700 border-gray-200",
                      icon: AlertCircle,
                    };
                    const IconoEstado = estadoInfo.icon;
                    const estaExpandido = turnoExpandidoId === turno.id_turno;
                    const practicas = turno.PracticaTurnos || [];

                    return (
                      <tr
                        key={turno.id_turno}
                        className="hover:bg-gray-50/70 transition-colors group cursor-pointer"
                        onClick={() => alternarExpansion(turno.id_turno)}
                      >
                        <td className="px-4 py-3 font-semibold text-gray-400">
                          #{turno.id_turno}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800">
                              {formatFechaTabla(turno.fecha_hora_inicio)}
                            </span>
                            <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <Clock size={11} className="text-gray-400" />
                              {formatSoloHora(turno.fecha_hora_inicio)} - {formatSoloHora(turno.fecha_hora_fin)} hs
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${estadoInfo.color}`}
                          >
                            <IconoEstado size={13} />
                            <span>{turno.EstadoTurno?.estado || "Sin estado"}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3 max-w-[240px]">
                          <div className="flex flex-col gap-1">
                            {practicas.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {practicas.map((pt, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#e8f7f1] text-[#259370] rounded-md font-medium text-[11px] truncate max-w-[200px]"
                                    title={pt.Practica?.nombre_referencia || pt.Practica?.nombre_nomenclador}
                                  >
                                    <Layers size={10} />
                                    <span className="truncate">
                                      {pt.Practica?.nombre_referencia || pt.Practica?.nombre_nomenclador}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">Sin prácticas asociadas</span>
                            )}

                            {turno.notas_consulta && (
                              <p className="text-[11px] text-gray-500 truncate mt-0.5" title={turno.notas_consulta}>
                                <span className="font-semibold text-gray-600">Nota:</span> {turno.notas_consulta}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-gray-800 whitespace-nowrap">
                          ${Number(turno.precio_final || 0).toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              alternarExpansion(turno.id_turno);
                            }}
                            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title={estaExpandido ? "Ocultar detalle" : "Ver detalle completo"}
                          >
                            {estaExpandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── DETALLE DESPLEGADO DEL TURNO SELECCIONADO ─── */}
        {turnoExpandidoId && (() => {
          const turnoSel = turnos.find((t) => t.id_turno === turnoExpandidoId);
          if (!turnoSel) return null;
          const estadoInfo = estadosMap[turnoSel.EstadoTurno?.estado] || {
            color: "bg-gray-50 text-gray-700 border-gray-200",
            icon: AlertCircle,
          };
          const IconoEstado = estadoInfo.icon;

          return (
            <div className="bg-[#f0f6f9] border border-[#3B7A94]/20 rounded-2xl p-4 flex flex-col gap-3 transition-all animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#3B7A94]/15 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#2b5d73] text-sm">
                    Detalles completos del Turno #{turnoSel.id_turno}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${estadoInfo.color}`}
                  >
                    <IconoEstado size={12} />
                    <span>{turnoSel.EstadoTurno?.estado}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTurnoExpandidoId(null)}
                  className="text-xs text-gray-500 hover:text-gray-800 underline font-medium"
                >
                  Cerrar detalle
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="block font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                    Horario
                  </span>
                  <div className="font-semibold text-gray-800">
                    {formatFechaTabla(turnoSel.fecha_hora_inicio)}
                  </div>
                  <div className="text-gray-500 mt-0.5">
                    {formatSoloHora(turnoSel.fecha_hora_inicio)} a {formatSoloHora(turnoSel.fecha_hora_fin)} hs
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="block font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                    Precio Final
                  </span>
                  <div className="font-bold text-emerald-700 text-sm">
                    ${Number(turnoSel.precio_final || 0).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="block font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                    Prácticas Realizadas ({turnoSel.PracticaTurnos?.length || 0})
                  </span>
                  {turnoSel.PracticaTurnos?.length > 0 ? (
                    <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                      {turnoSel.PracticaTurnos.map((pt, idx) => (
                        <li key={idx} className="truncate">
                          {pt.Practica?.nombre_referencia || pt.Practica?.nombre_nomenclador}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 italic">Ninguna práctica registrada</span>
                  )}
                </div>
              </div>

              {turnoSel.notas_consulta && (
                <div className="bg-white p-3 rounded-xl border border-gray-200 text-xs">
                  <span className="block font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                    <FileText size={12} />
                    <span>Notas de Consulta</span>
                  </span>
                  <p className="text-gray-700 whitespace-pre-wrap">{turnoSel.notas_consulta}</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* ─── BOTÓN DE CERRAR ─── */}
        <div className="flex justify-end pt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
