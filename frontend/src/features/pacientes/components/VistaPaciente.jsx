/** @format */

import { useState, useEffect, useMemo } from "react";
import Modal from "../../../components/common/Modal";
import api from "../../../services/api";
import { calcularEdad } from "../utils/calcularEdad";
import { formatFechaTabla, formatSoloHora } from "../../../utils/index";
import { useNavigate } from "react-router-dom";
import {
  User,
  Calendar,
  Phone,
  FileText,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Banknote,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export function VistaPaciente({ isOpen, onClose, paciente }) {
  const navigate = useNavigate();
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Estados de Filtros y Acordeón
  const [busqueda, setBusqueda] = useState("");
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [acordeonAbiertoId, setAcordeonAbiertoId] = useState(null);

  // Paginación interna de turnos del paciente
  const [paginaActual, setPaginaActual] = useState(1);
  const TURNOS_POR_PAGINA = 5;

  useEffect(() => {
    if (isOpen && paciente?.id_paciente) {
      cargarFichaYTurnosPaciente(paciente.id_paciente);
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
  const edadCalculada = useMemo(() => calcularEdad(paciente?.fecha_nacimiento), [paciente?.fecha_nacimiento]);

  // Cálculos de saldo total pendiente y resumen
  const resumenFinanciero = useMemo(() => {
    let totalAcordado = 0;
    let totalPagado = 0;

    turnos.forEach((t) => {
      const cobro = t.Cobro;
      if (cobro) {
        const montoAcordado = Number(cobro.monto_a_cobrar || t.precio_final || 0);
        const pagado = (cobro.Cuota || []).reduce((acc, c) => acc + (Number(c.monto_cobrado) || 0), 0);
        totalAcordado += montoAcordado;
        totalPagado += pagado;
      }
    });

    const saldoPendienteTotal = Math.max(0, totalAcordado - totalPagado);

    return {
      totalAcordado,
      totalPagado,
      saldoPendienteTotal,
      alDia: saldoPendienteTotal === 0,
    };
  }, [turnos]);

  // Filtrado de Turnos
  const turnosFiltrados = useMemo(() => {
    return turnos.filter((t) => {
      // Filtro de pendientes de cobro
      if (soloPendientes) {
        const cobro = t.Cobro;
        if (!cobro) return true; // Si no tiene cobro generado, está pendiente
        const pagado = (cobro.Cuota || []).reduce((acc, c) => acc + (Number(c.monto_cobrado) || 0), 0);
        const saldo = Math.max(0, Number(cobro.monto_a_cobrar) - pagado);
        if (saldo <= 0) return false;
      }

      // Búsqueda por texto (fecha, notas o estado)
      if (busqueda.trim() !== "") {
        const query = busqueda.toLowerCase();
        const fecha = formatFechaTabla(t.fecha_hora_inicio).toLowerCase();
        const notas = (t.notas_consulta || "").toLowerCase();
        const estado = (t.EstadoTurno?.estado || "").toLowerCase();
        return fecha.includes(query) || notas.includes(query) || estado.includes(query);
      }

      return true;
    });
  }, [turnos, soloPendientes, busqueda]);

  // Paginación
  const totalPaginas = Math.ceil(turnosFiltrados.length / TURNOS_POR_PAGINA) || 1;
  const turnosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * TURNOS_POR_PAGINA;
    return turnosFiltrados.slice(inicio, inicio + TURNOS_POR_PAGINA);
  }, [turnosFiltrados, paginaActual]);

  const toggleAcordeon = (idTurno) => {
    setAcordeonAbiertoId(acordeonAbiertoId === idTurno ? null : idTurno);
  };

  const irACobrar = (idTurno) => {
    onClose();
    navigate("/cobros", { state: { id_turno_cobrar: idTurno } });
  };

  if (!paciente) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="max-w-3xl" title={`Ficha Clinica y Cuenta Corriente`}>
      <div className="flex flex-col gap-4 text-sm max-h-[75vh] overflow-y-auto pr-1">
        {/* ─── TARJETA PRINCIPAL DEL PACIENTE ─── */}
        <div className="bg-gradient-to-br from-gray-50 to-[#e8f7f1]/30 p-4 rounded-2xl border border-gray-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-200/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2eb086] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                {paciente.nombre?.charAt(0)}
                {paciente.apellido?.charAt(0)}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-gray-800 leading-tight">
                  {paciente.apellido}, {paciente.nombre}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-0.5">
                  <span>DNI: {paciente.dni || "S/D"}</span>
                  <span>•</span>
                  <span>Tel: {paciente.telefono || "S/D"}</span>
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
            <div className="bg-white p-2.5 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Turnos</span>
              <span className="text-sm font-black text-gray-800">{turnos.length} registrados</span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Saldo Pendiente</span>
              <span
                className={`text-sm font-black ${
                  resumenFinanciero.saldoPendienteTotal > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                ${resumenFinanciero.saldoPendienteTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white p-2.5 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Estado Cuenta</span>
                <span
                  className={`text-xs font-bold ${
                    resumenFinanciero.alDia ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {resumenFinanciero.alDia ? "Al Día" : "Con Deuda"}
                </span>
              </div>
              <span
                className={`p-1.5 rounded-lg text-xs font-bold ${
                  resumenFinanciero.alDia ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {resumenFinanciero.alDia ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              </span>
            </div>
          </div>
        </div>

        {/* ─── BARRA DE BÚSQUEDA Y FILTROS DE TURNOS ─── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por fecha, notas o estado del turno..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2eb086]/40 focus:outline-none"
            />
          </div>

          {/* CHECKBOX MOSTRAR SOLO PENDIENTES */}
          <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={soloPendientes}
              onChange={(e) => {
                setSoloPendientes(e.target.checked);
                setPaginaActual(1);
              }}
              className="w-4 h-4 text-[#2eb086] rounded border-gray-300 focus:ring-[#2eb086]"
            />
            <span>Solo Impagos / Parciales</span>
          </label>
        </div>

        {/* ─── HISTORIAL DE TURNOS Y COBROS (ACORDEÓN) ─── */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Historial de Atenciones ({turnosFiltrados.length})
            </span>
          </div>

          {cargando ? (
            <p className="text-xs text-gray-400 italic py-6 text-center">
              Cargando turnos e historial del paciente...
            </p>
          ) : turnosPaginados.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200 text-center">
              <p className="text-xs text-gray-400 italic">
                {soloPendientes || busqueda
                  ? "No se encontraron turnos que coincidan con el filtro aplicado."
                  : "El paciente aún no registra turnos ni atenciones."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {turnosPaginados.map((t) => {
                const cobro = t.Cobro;
                const totalAcordado = Number(cobro?.monto_a_cobrar || t.precio_final || 0);
                const totalPagado = (cobro?.Cuota || []).reduce(
                  (acc, c) => acc + (Number(c.monto_cobrado) || 0),
                  0,
                );
                const saldoRestante = Math.max(0, totalAcordado - totalPagado);

                const esDesplegado = acordeonAbiertoId === t.id_turno;

                // Estado de pago
                let estadoCobroLabel = "Sin Cobro";
                let estadoCobroColor = "bg-gray-100 text-gray-600";

                if (cobro) {
                  if (saldoRestante === 0 && totalAcordado > 0) {
                    estadoCobroLabel = "Pagado";
                    estadoCobroColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                  } else if (totalPagado > 0) {
                    estadoCobroLabel = `Falta $${saldoRestante.toLocaleString("es-AR")}`;
                    estadoCobroColor = "bg-amber-100 text-amber-800 border-amber-200";
                  } else {
                    estadoCobroLabel = `Pendiente $${saldoRestante.toLocaleString("es-AR")}`;
                    estadoCobroColor = "bg-rose-100 text-rose-800 border-rose-200";
                  }
                }

                return (
                  <div
                    key={t.id_turno}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs transition-all"
                  >
                    {/* CABECERA DEL ACORDEÓN */}
                    <div
                      onClick={() => toggleAcordeon(t.id_turno)}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-gray-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-[#2eb086] shrink-0">
                          <Clock size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 text-xs sm:text-sm">
                              {formatFechaTabla(t.fecha_hora_inicio)}
                            </span>
                            <span className="text-[11px] font-medium text-gray-400">
                              {formatSoloHora(t.fecha_hora_inicio)} hs
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-500 font-medium block">
                            Estado Turno: <strong>{t.EstadoTurno?.estado || "Programado"}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${estadoCobroColor}`}
                        >
                          {estadoCobroLabel}
                        </span>

                        <button
                          type="button"
                          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        >
                          {esDesplegado ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* CONTENIDO DESPLEGABLE DEL ACORDEÓN */}
                    {esDesplegado && (
                      <div className="p-3.5 bg-gray-50/60 border-t border-gray-100 text-xs space-y-3 animate-in fade-in duration-150">
                        {/* NOTAS Y PRÁCTICAS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                              Notas del Turno
                            </span>
                            <p className="bg-white p-2 rounded-xl border border-gray-200 text-gray-700 italic">
                              {t.notas_consulta || "Sin observaciones registradas."}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                              Resumen de Cobro
                            </span>
                            <div className="bg-white p-2 rounded-xl border border-gray-200 space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Monto Total:</span>
                                <span className="font-bold text-gray-800">${totalAcordado.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Abonado:</span>
                                <span className="font-bold text-emerald-600">${totalPagado.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between border-t border-gray-100 pt-1">
                                <span className="font-bold text-gray-700">Saldo Restante:</span>
                                <span
                                  className={`font-bold ${saldoRestante > 0 ? "text-rose-600" : "text-emerald-600"}`}
                                >
                                  ${saldoRestante.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ACCIÓN IR A COBRAR */}
                        {saldoRestante > 0 && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => irACobrar(t.id_turno)}
                              className="flex items-center gap-1.5 bg-[#2eb086] hover:bg-[#259370] text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95"
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
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={paginaActual === 1}
                  onClick={() => setPaginaActual((p) => p - 1)}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={paginaActual === totalPaginas}
                  onClick={() => setPaginaActual((p) => p + 1)}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold disabled:opacity-40"
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
            className="px-4 py-2 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] font-bold text-xs transition-colors"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </Modal>
  );
}
