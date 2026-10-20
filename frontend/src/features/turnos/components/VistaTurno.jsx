/** @format */

import { useState, useEffect } from "react";
import Modal from "../../../components/common/Modal";
import api from "../../../services/api";
import { formatFechaHoraTabla } from "../../../utils/formatearFecha";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  User,
  FileText,
  DollarSign,
  Activity,
  Shield,
  History,
  CalendarDays,
  ChevronDown,
  CheckSquare,
  UserRoundX,
  XCircle,
  Banknote,
} from "lucide-react";

export function VistaTurno({
  isOpen,
  onClose,
  turno,
  abrirParaReprogramar,
  abrirParaAtender,
  abrirParaCancelar,
  abrirParaInasistente,
  abrirModalCobrar, // Prop opcional para cobrar si está Atendido
}) {
  const navigate = useNavigate();
  const [historial, setHistorial] = useState([]);
  const [practicasTurno, setPracticasTurno] = useState([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);
  const [menuAccionesAbierto, setMenuAccionesAbierto] = useState(false);

  // Cerrar el menú flotante al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuAccionesAbierto && !event.target.closest(".menu-acciones-container")) {
        setMenuAccionesAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuAccionesAbierto]);

  useEffect(() => {
    if (isOpen && turno?.id_turno) {
      cargarDetallesTurno(turno.id_turno);
    }
  }, [isOpen, turno]);

  const cargarDetallesTurno = async (id_turno) => {
    setCargandoDetalles(true);
    try {
      const resHistorial = await api.get(`/historial-estado-turnos/${id_turno}`);
      setHistorial(resHistorial.data.data || []);
    } catch (error) {
      console.error("Error al cargar el historial del turno:", error);
      setHistorial([]);
    }

    try {
      const resPracticas = await api.get(`/practicas-turnos`);
      const todasLasPracticas = resPracticas.data.data || [];
      const delTurno = todasLasPracticas.filter((pt) => Number(pt.id_turno) === Number(id_turno));
      setPracticasTurno(delTurno);
    } catch (error) {
      console.error("Error al cargar las prácticas del turno:", error);
      setPracticasTurno([]);
    } finally {
      setCargandoDetalles(false);
    }
  };

  if (!turno) return null;

  // Evaluación de Estados
  const idEstado = Number(turno.id_estado);
  const nombreEstado = turno.EstadoTurno?.estado;

  const esProgramado = idEstado === 1 || nombreEstado === "Programado";
  const esAtendido = idEstado === 2 || nombreEstado === "Atendido";
  const esCanceladoOInasistente =
    idEstado === 3 || idEstado === 4 || nombreEstado === "Cancelado" || nombreEstado === "Inasistente";

  const irACobrar = (turnoTarget) => {
    onClose(); // Cerrar modal de detalles
    navigate("/cobros", {
      state: { id_turno_cobrar: turnoTarget.id_turno },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-2xl"
      title={`Detalles del Turno #${turno.id_turno}`}
    >
      <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pr-1 text-black text-sm">
        {/* ─── BLOQUE 1: DATOS PRINCIPALES (Estado, Precio y Horarios) ─── */}
        <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white border border-gray-200 text-[#2eb086]">
              <Activity size={18} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Estado Actual
              </span>
              <span className="font-bold text-gray-800 text-xs sm:text-sm">
                {turno.EstadoTurno?.estado || "Desconocido"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white border border-gray-200 text-[#2eb086]">
              <DollarSign size={18} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Precio Final
              </span>
              <span className="font-bold text-gray-800 text-xs sm:text-sm">
                $
                {Number(turno.precio_final || 0).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500">
              <Calendar size={18} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Inicio
              </span>
              <span className="font-medium text-gray-700 text-xs">
                {formatFechaHoraTabla(turno.fecha_hora_inicio)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500">
              <Clock size={18} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fin</span>
              <span className="font-medium text-gray-700 text-xs">
                {formatFechaHoraTabla(turno.fecha_hora_fin)}
              </span>
            </div>
          </div>
        </div>

        {/* ─── BLOQUE 2: INFORMACIÓN DEL PACIENTE ─── */}
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <User size={16} className="text-[#2eb086]" />
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Paciente</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">Nombre</span>
              <span className="font-semibold text-gray-800">
                {turno.Paciente
                  ? `${turno.Paciente.nombre} ${turno.Paciente.apellido}`
                  : `Paciente #${turno.id_paciente}`}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">DNI</span>
              <span className="font-medium text-gray-700">{turno.Paciente?.dni || "S/D"}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">Teléfono</span>
              <span className="font-medium text-gray-700">{turno.Paciente?.telefono || "S/D"}</span>
            </div>
          </div>
        </div>

        {/* ─── BLOQUE 3: PRÁCTICAS REALIZADAS ─── */}
        <div className="border-t border-gray-200 pt-3">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-2">
            <Shield size={16} className="text-[#2eb086]" />
            <span>Prácticas y Cobertura</span>
          </h3>
          {cargandoDetalles ? (
            <p className="text-xs text-gray-400 italic">Cargando prácticas...</p>
          ) : practicasTurno.length === 0 ? (
            <p className="text-xs text-gray-400 italic bg-gray-50 p-2.5 rounded-xl border border-dashed border-gray-200">
              No se registraron prácticas asociadas a este turno.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
              {practicasTurno.map((pt, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-gray-800">
                      {pt.Practica?.nombre_nomenclador || `Práctica #${pt.id_practica}`}
                    </span>
                    <span className="block text-[11px] text-gray-500">
                      Nomenclador: {pt.Practica?.codigo_nomenclador || "S/D"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                      {pt.ObraSocial?.nombre || "Particular"}
                    </span>
                    {pt.Practica?.precio_referencia && (
                      <span className="block text-[11px] text-gray-600 mt-0.5">
                        Ref: $
                        {Number(pt.Practica.precio_referencia).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── BLOQUE 4: NOTAS ─── */}
        <div className="border-t border-gray-200 pt-3">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-1.5">
            <FileText size={16} className="text-[#2eb086]" />
            <span>Notas de la Consulta</span>
          </h3>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-700">
            {turno.notas_consulta || <span className="text-gray-400 italic">Sin notas registradas.</span>}
          </div>
        </div>

        {/* ─── BLOQUE 5: HISTORIAL DE ESTADOS ─── */}
        <div className="border-t border-gray-200 pt-3">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-2">
            <History size={16} className="text-[#2eb086]" />
            <span>Historial de Estados</span>
          </h3>
          {cargandoDetalles ? (
            <p className="text-xs text-gray-400 italic">Cargando historial...</p>
          ) : historial.length === 0 ? (
            <p className="text-xs text-gray-400 italic bg-gray-50 p-2.5 rounded-xl border border-dashed border-gray-200">
              No hay registros en el historial.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
              {historial.map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs"
                >
                  <div className="p-1 rounded-md bg-white border border-gray-200 text-[#2eb086] flex items-center justify-center shrink-0">
                    <Clock size={12} />
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-semibold text-gray-800 leading-none">
                      {h.EstadoTurno?.estado || h.descripcion || `Estado #${h.id_estado}`}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium leading-none">
                      {formatFechaHoraTabla(h.fecha_hora_cambio)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pie del Modal */}
      <div className="border-t border-gray-200 mt-4 pt-3 flex items-center justify-between gap-2">
        {/* LADO IZQUIERDO: ACCIONES DIRECTAS SEGÚN ESTADO */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {esProgramado && (
            <>
              {/* Acción Principal: Atender */}
              <button
                type="button"
                onClick={() => {
                  if (abrirParaAtender) abrirParaAtender(turno);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs"
                title="Atender Turno"
              >
                <CheckSquare size={16} />
                <span className="hidden sm:inline">Atender</span>
              </button>

              {/* Reprogramar */}
              <button
                type="button"
                onClick={() => {
                  if (abrirParaReprogramar) abrirParaReprogramar(turno);
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#3B7A94] font-semibold text-xs sm:text-sm transition-all border border-sky-100"
                title="Reprogramar Turno"
              >
                <CalendarDays size={16} />
                <span className="hidden md:inline">Reprogramar</span>
              </button>

              {/* Marcar Inasistente */}
              <button
                type="button"
                onClick={() => {
                  if (abrirParaInasistente) abrirParaInasistente(turno);
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all"
                title="Marcar Inasistente"
              >
                <UserRoundX size={16} />
                <span className="hidden md:inline">Inasistente</span>
              </button>

              {/* Cancelar */}
              <button
                type="button"
                onClick={() => {
                  if (abrirParaCancelar) abrirParaCancelar(turno);
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs sm:text-sm transition-all border border-red-100"
                title="Cancelar Turno"
              >
                <XCircle size={16} />
                <span className="hidden md:inline">Cancelar</span>
              </button>
            </>
          )}

          {esCanceladoOInasistente && (
            <button
              type="button"
              onClick={() => {
                if (abrirParaReprogramar) abrirParaReprogramar(turno);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f0f6f9] hover:bg-[#e1eef4] text-[#3B7A94] font-semibold text-xs sm:text-sm transition-all"
            >
              <CalendarDays size={16} />
              <span>Reprogramar</span>
            </button>
          )}

          {esAtendido && (
            <button
              type="button"
              onClick={() => irACobrar(turno)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all"
            >
              <Banknote size={16} />
              <span>Cobrar</span>
            </button>
          )}
        </div>

        {/* LADO DERECHO: BOTÓN CERRAR */}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] transition-all shadow-xs font-semibold text-xs sm:text-sm shrink-0"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
