/** @format */

import { useState, useEffect } from "react";
import Modal from "../Modal";
import api from "../../../services/api";
import { formatFechaTabla, formatSoloHora } from "../../../utils/index";
import {
  DollarSign,
  Plus,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Wallet,
  Trash2,
} from "lucide-react";

export default function FormularioCuotas({
  modalCuotas,
  cerrarModal,
  cobroSeleccionado,
  recarcarCobros,
}) {
  const [cuotas, setCuotas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarFormularioEntrega, setMostrarFormularioEntrega] =
    useState(false);

  // Estado para el sub-formulario de registrar/cobrar cuota o entrega
  const [datosEntrega, setDatosEntrega] = useState({
    monto_cobrado: "",
    metodo_pago: "Efectivo",
    id_cuota: null,
  });

  useEffect(() => {
    if (cobroSeleccionado?.id_cobro) {
      cargarCuotas();
    }
  }, [cobroSeleccionado]);

  const cargarCuotas = async () => {
    setCargando(true);
    try {
      const res = await api.get(`/cuotas/${cobroSeleccionado.id_cobro}/cuotas`);
      const cuotasObtenidas = res.data.data || res.data || [];
      setCuotas(cuotasObtenidas);

      if (cuotasObtenidas.length === 0 && cobroSeleccionado?.monto_a_cobrar) {
        const total = Number(cobroSeleccionado.monto_a_cobrar);
        const cantCuotas = Number(cobroSeleccionado.cant_cuotas) || 1;
        const montoPorCuota = Number((total / cantCuotas).toFixed(2));
        setDatosEntrega((prev) => ({
          ...prev,
          monto_cobrado: montoPorCuota,
        }));
      }
    } catch (error) {
      console.error("Error al obtener cuotas:", error);
    } finally {
      setCargando(false);
    }
  };

  // Cálculos dinámicos de la cuenta del paciente
  const costoAcordado = Number(cobroSeleccionado?.monto_a_cobrar) || 0;
  const cantCuotasTotal = Number(cobroSeleccionado?.cant_cuotas) || 1;
  const montoSugeridoSistema = Number(
    (costoAcordado / cantCuotasTotal).toFixed(2),
  );

  const totalPagado = cuotas.reduce(
    (acc, c) => acc + (Number(c.monto_cobrado) || 0),
    0,
  );
  const saldoPendiente = Math.max(0, costoAcordado - totalPagado);
  const porcentajeCubierto =
    costoAcordado > 0
      ? Math.min(100, Math.round((totalPagado / costoAcordado) * 100))
      : 0;

  // Cálculo del saldo pendiente si se efectúa el pago actual ingresado
  const montoIngresadoActual = Number(datosEntrega.monto_cobrado) || 0;
  const saldoPendienteResultante = Math.max(
    0,
    saldoPendiente - montoIngresadoActual,
  );

  const paciente = cobroSeleccionado?.Paciente;

  const procesarRegistroEntrega = async (e) => {
    e.preventDefault();
    try {
      const montoANuevo = Number(datosEntrega.monto_cobrado);

      if (datosEntrega.id_cuota) {
        // Cobrar cuota existente y dejarla marcada como pagada
        await api.patch(`/cuotas/${datosEntrega.id_cuota}/cobrar`, {
          monto_cobrado: montoANuevo,
          metodo_pago: datosEntrega.metodo_pago,
          estado: "Pagada",
          fecha_cobro: new Date().toISOString(),
        });
      } else {
        // Crear y registrar nueva cuota/entrega directamente cobrada
        const nroProximaCuota = cuotas.length + 1;
        await api.post("/cuotas", {
          id_cobro: cobroSeleccionado.id_cobro,
          nro_cuota: nroProximaCuota,
          monto_cuota: montoSugeridoSistema,
          monto_cobrado: montoANuevo,
          fecha_vencimiento: new Date().toISOString().split("T")[0],
          fecha_cobro: new Date().toISOString(),
          metodo_pago: datosEntrega.metodo_pago,
          estado: "Pagada",
        });
      }

      setDatosEntrega({
        monto_cobrado: montoSugeridoSistema,
        metodo_pago: "Efectivo",
        id_cuota: null,
      });
      setMostrarFormularioEntrega(false);
      cargarCuotas();
      if (recarcarCobros) recarcarCobros();
    } catch (error) {
      console.error("Error al registrar la cuota cobrada:", error);
      alert("No se pudo asentar el pago.");
    }
  };

  // Función para eliminar/desactivar una cuota o entrega
  const eliminarCuota = async (idCuota) => {
    if (!window.confirm("¿Estás seguro de eliminar este registro de pago?")) return;
    try {
      await api.patch(`/cuotas/${idCuota}/delete`);
      cargarCuotas();
      if (recarcarCobros) recarcarCobros();
    } catch (error) {
      console.error("Error al eliminar cuota:", error);
      alert("No se pudo eliminar el registro.");
    }
  };

  return (
    <Modal
      isOpen={modalCuotas}
      onClose={cerrarModal}
      width="max-w-3xl"
      title={
        <div className="pb-3">
          <span className="text-[11px] font-bold tracking-wider text-white uppercase">
            Cuenta de Paciente
          </span>
          <h2 className="text-2xl font-black text-white leading-tight">
            {paciente
              ? `${paciente.apellido}, ${paciente.nombre}`
              : `Paciente #${cobroSeleccionado?.id_paciente}`}
          </h2>
          <p className="text-xs text-white font-medium mt-0.5">
            DNI: {paciente?.dni || "S/D"} | Tel: {paciente?.telefono || "S/D"}
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* 4 CARDS DE ESTADÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase block">
              Precio Acordado
            </span>
            <span className="text-lg font-black text-gray-800">
              $
              {costoAcordado.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase block">
              Total Pagado
            </span>
            <span className="text-lg font-black text-[#2eb086]">
              $
              {totalPagado.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase block">
              Saldo Pendiente
            </span>
            <span
              className={`text-lg font-black ${
                saldoPendiente > 0 ? "text-rose-500" : "text-emerald-600"
              }`}
            >
              $
              {saldoPendiente.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase block">
              Cobros Registrados
            </span>
            <span className="text-lg font-black text-gray-800 flex items-baseline gap-1">
              {cuotas.filter((c) => c.estado === "Pagada").length}
              <span className="text-xs font-normal text-gray-500">
                pagos asentados
              </span>
            </span>
          </div>
        </div>

        {/* TRATAMIENTO / ACUERDO DE PAGO Y BARRA DE COBERTURA */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-base">
                Tratamiento / Plan de Cobro #{cobroSeleccionado?.id_cobro}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                {cantCuotasTotal > 1
                  ? `Plan de ${cantCuotasTotal} cuotas`
                  : "Pago Único / Informal"}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  saldoPendiente === 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {saldoPendiente === 0 ? "Pagado Total" : "Parcial / Pendiente"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setDatosFormularioEntregaDefault();
                setMostrarFormularioEntrega(!mostrarFormularioEntrega);
              }}
              className="flex items-center gap-1.5 bg-[#2eb086] hover:bg-[#259370] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus size={15} />
              <span>Registrar Entrega</span>
            </button>
          </div>

          {/* BARRA DE PROGRESO */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#2eb086]">
                {porcentajeCubierto}% del costo cubierto
              </span>
              <span className="text-gray-500">
                $
                {totalPagado.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}{" "}
                de $
                {costoAcordado.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#2eb086] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${porcentajeCubierto}%` }}
              ></div>
            </div>
          </div>

          {/* FORMULARIO EXPANDIBLE PARA REGISTRAR/COBRAR CUOTA */}
          {mostrarFormularioEntrega && (
            <form
              onSubmit={procesarRegistroEntrega}
              className="bg-gray-50 p-4 rounded-xl border border-emerald-200 gap-3 grid grid-cols-1 md:grid-cols-3 items-end transition-all"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Monto a Cobrar ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={datosEntrega.monto_cobrado}
                  onChange={(e) =>
                    setDatosEntrega((p) => ({
                      ...p,
                      monto_cobrado: e.target.value,
                    }))
                  }
                  required
                  className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 font-bold text-[#2eb086]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Método de Pago *
                </label>
                <select
                  value={datosEntrega.metodo_pago}
                  onChange={(e) =>
                    setDatosEntrega((p) => ({
                      ...p,
                      metodo_pago: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#2eb086] hover:bg-[#259370] text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Confirmar Cobro
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarFormularioEntrega(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  <X size={16} />
                </button>
              </div>
              {/* Texto indicativo con el saldo pendiente resultante */}
              <span className="text-[11px] text-gray-500 mt-1 block font-medium col-span-2">
                Saldo pendiente tras este pago:{" "}
                <strong className="text-gray-800">
                  $
                  {saldoPendienteResultante.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </span>
            </form>
          )}

          {/* TABLA DE CUOTAS Y ENTREGAS */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase block">
              Entregas y Cuotas Registradas
            </span>

            {cargando ? (
              <p className="text-xs text-gray-400 italic py-4 text-center">
                Cargando cuotas asentadas...
              </p>
            ) : cuotas.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-3 text-center bg-gray-50 rounded-xl">
                Aún no existen entregas asentadas para este cobro. Podés
                registrar una arriba.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-400 uppercase font-bold border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">Fecha y Hora</th>
                      <th className="px-4 py-2.5">Método</th>
                      <th className="px-4 py-2.5">Monto</th>
                      <th className="px-4 py-2.5 text-center">Estado</th>
                      <th className="px-4 py-2.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {cuotas.map((c) => (
                      <tr key={c.id_cuota} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-bold text-gray-800">
                          #{c.nro_cuota}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {c.fecha_cobro
                            ? `${formatFechaTabla(c.fecha_cobro)} ${formatSoloHora(c.fecha_cobro)} hs`
                            : formatFechaTabla(c.fecha_vencimiento)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {c.metodo_pago || "Efectivo"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900">
                          $
                          {Number(
                            c.monto_cobrado || c.monto_cuota,
                          ).toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              c.estado === "Pagada"
                                ? "bg-emerald-100 text-emerald-800"
                                : c.estado === "Parcialmente pagada"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {c.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {c.estado !== "Pagada" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDatosEntrega({
                                    monto_cobrado:
                                      c.monto_cuota || montoSugeridoSistema,
                                    metodo_pago: "Efectivo",
                                    id_cuota: c.id_cuota,
                                  });
                                  setMostrarFormularioEntrega(true);
                                }}
                                className="text-xs font-bold text-[#2eb086] hover:underline"
                              >
                                Cobrar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => eliminarCuota(c.id_cuota)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              title="Eliminar cuota"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={cerrarModal}
            className="px-5 py-2 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 font-bold text-xs transition-colors"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </Modal>
  );

  function setDatosFormularioEntregaDefault() {
    setDatosEntrega({
      monto_cobrado:
        saldoPendiente > 0
          ? Math.min(saldoPendiente, montoSugeridoSistema)
          : montoSugeridoSistema,
      metodo_pago: "Efectivo",
      id_cuota: null,
    });
  }
}