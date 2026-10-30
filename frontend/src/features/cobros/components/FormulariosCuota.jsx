/** @format */

import { useState, useEffect } from "react";
import Modal from "../../../components/common/Modal";
import api from "../../../services/api";
import { formatFechaTabla, formatSoloHora } from "../../../utils/index";
import { Plus, X, Trash2, CheckCircle, CreditCard } from "lucide-react";

export default function FormularioCuotas({ modalCuotas, cerrarModal, cobroSeleccionado, recarcarCobros }) {
  const [cuotas, setCuotas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarFormularioNueva, setMostrarFormularioNueva] = useState(false);

  // Métodos de pago seleccionados individualmente por fila/cuota
  const [metodosPagoFilas, setMetodosPagoFilas] = useState({});

  const cantCuotasTotal = Number(cobroSeleccionado?.cant_cuotas) || 1;
  const esPlanCuotas = cantCuotasTotal > 1;

  // Estado para el formulario de REGISTRAR NUEVA CUOTA con switch de cobro automático (solo informal)
  const [nuevaCuota, setNuevaCuota] = useState({
    monto_cobrado: "",
    metodo_pago: "Efectivo",
    cobrar_inmediato: true,
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

      const mapaMetodos = {};
      cuotasObtenidas.forEach((c) => {
        mapaMetodos[c.id_cuota] = c.metodo_pago || (esPlanCuotas ? "Tarjeta" : "Efectivo");
      });
      setMetodosPagoFilas(mapaMetodos);

      if (cobroSeleccionado?.monto_a_cobrar) {
        const total = Number(cobroSeleccionado.monto_a_cobrar);
        const totalPagado = cuotasObtenidas.reduce((acc, c) => acc + (Number(c.monto_cobrado) || 0), 0);
        const pendiente = Math.max(0, total - totalPagado);
        setNuevaCuota((prev) => ({
          ...prev,
          monto_cobrado: pendiente > 0 ? pendiente : "",
        }));
      }
    } catch (error) {
      console.error("Error al obtener cuotas:", error);
    } finally {
      setCargando(false);
    }
  };

  const costoAcordado = Number(cobroSeleccionado?.monto_a_cobrar) || 0;
  const montoSugeridoSistema = Number((costoAcordado / cantCuotasTotal).toFixed(2));

  const totalPagado = cuotas.reduce((acc, c) => acc + (Number(c.monto_cobrado) || 0), 0);
  const saldoPendiente = Math.max(0, costoAcordado - totalPagado);
  const porcentajeCubierto =
    costoAcordado > 0 ? Math.min(100, Math.round((totalPagado / costoAcordado) * 100)) : 0;

  const paciente = cobroSeleccionado?.Paciente;

  // 1. REGISTRAR NUEVO PAGO / ENTREGA (Disponible únicamente para acuerdos informales / pago único)
  const procesarRegistroNuevaCuota = async (e) => {
    e.preventDefault();
    try {
      const montoIngresado = Number(nuevaCuota.monto_cobrado);
      const nroProximaCuota = cuotas.length + 1;

      const payloadCuota = {
        id_cobro: cobroSeleccionado.id_cobro,
        nro_cuota: nroProximaCuota,
        monto_cuota: montoIngresado,
        monto_cobrado: montoIngresado,
        fecha_vencimiento: new Date().toISOString().split("T")[0],
        fecha_cobro: new Date().toISOString(),
        metodo_pago: nuevaCuota.metodo_pago || "Efectivo",
        estado: "Pagada",
      };

      await api.post("/cuotas", payloadCuota);

      setMostrarFormularioNueva(false);
      cargarCuotas();
      if (recarcarCobros) recarcarCobros();
    } catch (error) {
      console.error("Error al registrar nueva cuota:", error);
      alert("No se pudo registrar la nueva entrega.");
    }
  };

  // 2. COBRAR INSTANTÁNEAMENTE UNA CUOTA EXISTENTE DE LA TABLA (Monto no modificable, método tarjeta en cuotas fijas)
  const cobrarCuotaDirecto = async (cuota) => {
    try {
      const metodoSeleccionado = esPlanCuotas ? "Tarjeta" : (metodosPagoFilas[cuota.id_cuota] || "Efectivo");
      const montoACobrar = Number(cuota.monto_cuota || cuota.monto_cobrado);

      await api.patch(`/cuotas/${cuota.id_cuota}/cobrar`, {
        monto_cobrado: montoACobrar,
        metodo_pago: metodoSeleccionado,
        estado: "Pagada",
        fecha_cobro: new Date().toISOString(),
      });

      cargarCuotas();
      if (recarcarCobros) recarcarCobros();
    } catch (error) {
      console.error("Error al cobrar la cuota:", error);
      alert("No se pudo cobrar la cuota.");
    }
  };

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
        <div className="pb-2">
          <span className="text-[10px] font-bold tracking-wider text-white/80 uppercase">
            Cuenta de Paciente
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {paciente
              ? `${paciente.apellido}, ${paciente.nombre}`
              : `Paciente #${cobroSeleccionado?.id_paciente}`}
          </h2>
          <p className="text-xs text-white/90 font-medium mt-0.5">
            DNI: {paciente?.dni || "S/D"} | Tel: {paciente?.telefono || "S/D"}
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* CARDS DE ESTADÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-gray-400 uppercase block">
              Precio Acordado
            </span>
            <span className="text-base sm:text-lg font-black text-gray-800">
              $
              {costoAcordado.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-gray-400 uppercase block">
              Total Pagado
            </span>
            <span className="text-base sm:text-lg font-black text-[#2eb086]">
              $
              {totalPagado.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-gray-400 uppercase block">
              Saldo Pendiente
            </span>
            <span
              className={`text-base sm:text-lg font-black ${
                saldoPendiente > 0 ? "text-rose-500" : "text-emerald-600"
              }`}
            >
              $
              {saldoPendiente.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-gray-400 uppercase block">
              Cobros Registrados
            </span>
            <span className="text-base sm:text-lg font-black text-gray-800 flex items-baseline gap-1">
              {cuotas.filter((c) => c.estado === "Pagada").length}
              <span className="text-[10px] sm:text-xs font-normal text-gray-500">
                {esPlanCuotas ? `de ${cantCuotasTotal} cuotas` : "pagos"}
              </span>
            </span>
          </div>
        </div>

        {/* DETALLE TRATAMIENTO Y ACCIÓN */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                Tratamiento #{cobroSeleccionado?.id_cobro}
              </h3>
              <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                {esPlanCuotas ? `Plan ${cantCuotasTotal} cuotas fijas (Tarjeta)` : "Pago Único / Informal"}
              </span>
              <span
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold ${
                  saldoPendiente === 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {saldoPendiente === 0 ? "Pagado Total" : "Parcial / Pendiente"}
              </span>
            </div>

            {/* Solo se permite agregar entregas dinámicas si es modalidad informal/libre */}
            {!esPlanCuotas && (
              <button
                type="button"
                onClick={() => {
                  setNuevaCuota({
                    monto_cobrado: saldoPendiente > 0 ? saldoPendiente : "",
                    metodo_pago: "Efectivo",
                    cobrar_inmediato: true,
                  });
                  setMostrarFormularioNueva(!mostrarFormularioNueva);
                }}
                className="flex items-center justify-center gap-1.5 bg-[#2eb086] hover:bg-[#259370] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 w-full sm:w-auto shrink-0"
              >
                <Plus size={15} />
                <span>Registrar Pago / Entrega</span>
              </button>
            )}
          </div>

          {/* BARRA DE PROGRESO */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] sm:text-xs font-bold">
              <span className="text-[#2eb086]">{porcentajeCubierto}% del costo cubierto</span>
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
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#2eb086] h-2 rounded-full transition-all duration-500"
                style={{ width: `${porcentajeCubierto}%` }}
              ></div>
            </div>
          </div>

          {/* SUB-FORMULARIO: REGISTRAR NUEVA ENTREGA (SOLO ACUERDO INFORMAL) */}
          {mostrarFormularioNueva && !esPlanCuotas && (
            <form
              onSubmit={procesarRegistroNuevaCuota}
              className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-200 gap-3 grid grid-cols-1 sm:grid-cols-3 items-end transition-all"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Monto ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevaCuota.monto_cobrado}
                  onChange={(e) =>
                    setNuevaCuota((p) => ({
                      ...p,
                      monto_cobrado: e.target.value,
                    }))
                  }
                  required
                  placeholder="0.00"
                  className="w-full border border-gray-300 p-2 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 font-bold text-[#2eb086]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Método de Pago *</label>
                <select
                  value={nuevaCuota.metodo_pago || "Efectivo"}
                  onChange={(e) =>
                    setNuevaCuota((p) => ({
                      ...p,
                      metodo_pago: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 p-2 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 text-gray-800 font-medium"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <CheckCircle size={15} />
                  <span>Registrar y Cobrar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarFormularioNueva(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 cursor-pointer"
                  title="Cancelar"
                >
                  <X size={16} />
                </button>
              </div>
            </form>
          )}

          {/* TABLA DE CUOTAS Y ENTREGAS */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase block">
              {esPlanCuotas ? "Cronograma de Cuotas Fijas (No modificable)" : "Entregas y Pagos Registrados"}
            </span>

            {cargando ? (
              <p className="text-xs text-gray-400 italic py-4 text-center">Cargando cuotas asentadas...</p>
            ) : cuotas.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-3 text-center bg-gray-50 rounded-xl">
                Aún no existen cuotas o entregas para este cobro.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-400 uppercase font-bold border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Monto Cuota</th>
                      <th className="px-3 py-2">Método de Pago</th>
                      <th className="px-3 py-2 text-center">Estado</th>
                      <th className="px-3 py-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {cuotas.map((c) => {
                      const estaPagada = c.estado === "Pagada";

                      return (
                        <tr key={c.id_cuota} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2.5 font-bold text-gray-800">#{c.nro_cuota}</td>
                          <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                            {c.fecha_cobro
                              ? `${formatFechaTabla(c.fecha_cobro)} ${formatSoloHora(c.fecha_cobro)}`
                              : formatFechaTabla(c.fecha_vencimiento)}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-gray-900 whitespace-nowrap">
                            $
                            {Number(c.monto_cuota || c.monto_cobrado).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                            })}
                          </td>

                          {/* MÉTODO DE PAGO: SIEMPRE TARJETA EN CUOTAS FIJAS */}
                          <td className="px-3 py-2.5">
                            {estaPagada ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {c.metodo_pago || (esPlanCuotas ? "Tarjeta" : "Efectivo")}
                              </span>
                            ) : esPlanCuotas ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <CreditCard size={12} />
                                <span>Tarjeta</span>
                              </span>
                            ) : (
                              <select
                                value={metodosPagoFilas[c.id_cuota] || "Efectivo"}
                                onChange={(e) =>
                                  setMetodosPagoFilas((prev) => ({
                                    ...prev,
                                    [c.id_cuota]: e.target.value,
                                  }))
                                }
                                className="border border-gray-300 rounded-md p-1 text-xs bg-white focus:ring-1 focus:ring-[#2eb086]"
                              >
                                <option value="Efectivo">Efectivo</option>
                                <option value="Transferencia">Transferencia</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="Otro">Otro</option>
                              </select>
                            )}
                          </td>

                          {/* ESTADO */}
                          <td className="px-3 py-2.5 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                estaPagada
                                  ? "bg-emerald-100 text-emerald-800"
                                  : c.estado === "Parcialmente pagada"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {c.estado}
                            </span>
                          </td>

                          {/* ACCIONES */}
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!estaPagada && (
                                <button
                                  type="button"
                                  onClick={() => cobrarCuotaDirecto(c)}
                                  className="bg-[#2eb086] hover:bg-[#259370] text-white text-[11px] font-bold px-2.5 py-1 rounded-md transition-all shadow-sm active:scale-95"
                                  title="Cobrar cuota al instante con Tarjeta"
                                >
                                  Cobrar
                                </button>
                              )}

                              {/* EN CUOTAS FIJAS NO SE PUEDEN ELIMINAR CUOTAS DEL PLAN */}
                              {!estaPagada && !esPlanCuotas && (
                                <button
                                  type="button"
                                  onClick={() => eliminarCuota(c.id_cuota)}
                                  className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                  title="Eliminar registro"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-1 border-t border-gray-100">
          <button
            type="button"
            onClick={cerrarModal}
            className="px-4 py-2 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 font-bold text-xs transition-colors"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </Modal>
  );
}
