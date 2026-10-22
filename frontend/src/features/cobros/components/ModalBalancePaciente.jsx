import { useEffect, useState } from "react";
import Modal from "../../../components/common/Modal";
import api from "../../../services/api";
import { formatFechaTabla } from "../../../utils/index";
import { ArrowUpRight, ArrowDownLeft, Scale } from "lucide-react";

export default function ModalBalancePaciente({ isOpen, onClose, idPaciente }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (isOpen && idPaciente) {
      cargarBalance();
    }
  }, [isOpen, idPaciente]);

  const cargarBalance = async () => {
    setCargando(true);
    try {
      const res = await api.get(`/cobros/pacientes/${idPaciente}/balance`);
      setDatos(res.data.data);
    } catch (error) {
      console.error("Error al cargar balance del paciente:", error);
      setDatos(null);
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  const { paciente, balance, turnos_atendidos = [], pagos_realizados = [] } = datos || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-2xl"
      title={
        <div className="flex items-center gap-2">
          <Scale size={20} className="text-[#2eb086]" />
          <span>Balance de Cuenta Corriente</span>
        </div>
      }
    >
      {cargando || !datos ? (
        <div className="py-8 text-center text-xs text-gray-400 italic">
          Calculando balance de atenciones y pagos...
        </div>
      ) : (
        <div className="flex flex-col gap-4 text-xs">
          {/* Ficha Paciente y Estado */}
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                Paciente
              </span>
              <span className="text-sm font-bold text-gray-800">
                {paciente.nombre_completo}
              </span>
              <span className="text-[11px] text-gray-500 block">
                DNI: {paciente.dni || "S/D"} | Tel: {paciente.telefono || "S/D"}
              </span>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                balance.estado === "DEUDOR"
                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                  : balance.estado === "A_FAVOR"
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              {balance.estado === "DEUDOR"
                ? "Saldo Deudor"
                : balance.estado === "A_FAVOR"
                ? "Saldo a Favor"
                : "Al Día"}
            </span>
          </div>

          {/* Métricas Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">
                Monto Pactado Total
              </span>
              <span className="text-base font-black text-gray-800">
                ${Number(balance.monto_pactado_total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">
                Pagos Realizados
              </span>
              <span className="text-base font-black text-emerald-600">
                ${Number(balance.total_pagado).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">
                {balance.saldo_a_favor > 0 ? "Saldo a Favor" : "Deuda Pendiente"}
              </span>
              <span
                className={`text-base font-black ${
                  balance.saldo_deudor > 0
                    ? "text-rose-600"
                    : balance.saldo_a_favor > 0
                    ? "text-blue-600"
                    : "text-emerald-600"
                }`}
              >
                ${Number(balance.saldo_deudor || balance.saldo_a_favor || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Desglose: Atenciones vs Pagos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-xl p-3 bg-white">
              <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1">
                <ArrowUpRight size={14} className="text-rose-500" />
                Atenciones Realizadas (Cargos)
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {turnos_atendidos.length === 0 ? (
                  <p className="text-gray-400 italic text-[11px]">Sin atenciones registradas.</p>
                ) : (
                  turnos_atendidos.map((t) => (
                    <div
                      key={t.id_turno}
                      className="bg-gray-50 p-2 rounded-lg flex justify-between items-center text-[11px]"
                    >
                      <div>
                        <span className="font-semibold text-gray-800 block">
                          Turno #{t.id_turno}
                        </span>
                        <span className="text-gray-400">{formatFechaTabla(t.fecha)}</span>
                      </div>
                      <span className="font-bold text-gray-800">
                        ${t.precio.toLocaleString("es-AR")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-3 bg-white">
              <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1">
                <ArrowDownLeft size={14} className="text-emerald-500" />
                Pagos Registrados (Abonos)
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {pagos_realizados.length === 0 ? (
                  <p className="text-gray-400 italic text-[11px]">Sin pagos registrados.</p>
                ) : (
                  pagos_realizados.map((p) => (
                    <div
                      key={p.id_cuota}
                      className="bg-gray-50 p-2 rounded-lg flex justify-between items-center text-[11px]"
                    >
                      <div>
                        <span className="font-semibold text-gray-800 block">
                          {p.metodo_pago || "Efectivo"}
                        </span>
                        <span className="text-gray-400">{formatFechaTabla(p.fecha_cobro)}</span>
                      </div>
                      <span className="font-bold text-emerald-600">
                        +${p.monto.toLocaleString("es-AR")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}