/** @format */

import { useState, useEffect } from "react";
import Modal from "../../../components/common/Modal";
import InputFiltro from "../../../components/common/InputFiltro";
import api from "../../../services/api";
import { User, CheckCircle2, Layers, FileText, ShieldCheck, CreditCard, Banknote } from "lucide-react";

export function FormularioCrearEditarCobro({
  procesarFormulario,
  modalAbierto,
  cerrarModal,
  editando,
  datosFormulario,
  actualizarDatos,
  turnosAtendidos,
}) {
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [practicasTurno, setPracticasTurno] = useState([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  // Monto acordado del turno seleccionado (base mínima para planes de cuotas fijas y monto fijo para pago inmediato)
  const montoAcordado = useMemo(() => {
    if (turnoSeleccionado) {
      return Number(
        turnoSeleccionado.saldo_pendiente !== undefined
          ? turnoSeleccionado.saldo_pendiente
          : (turnoSeleccionado.precio_final || 0)
      );
    }
    return 0;
  }, [turnoSeleccionado]);

  useEffect(() => {
    const idTurno = datosFormulario.id_turno;
    if (!idTurno || !turnosAtendidos || turnosAtendidos.length === 0) {
      setTurnoSeleccionado(null);
      setPracticasTurno([]);
      return;
    }

    const tEncontrado = turnosAtendidos.find((t) => String(t.id_turno) === String(idTurno));
    if (tEncontrado) {
      setTurnoSeleccionado(tEncontrado);
      cargarDetallesDelTurno(idTurno);
    }
  }, [datosFormulario.id_turno, turnosAtendidos]);

  const cargarDetallesDelTurno = async (idTurno) => {
    setCargandoDetalles(true);
    try {
      const resPracticas = await api.get(`/practicas-turnos/${idTurno}/turno`);
      setPracticasTurno(resPracticas.data.data || resPracticas.data || []);
    } catch (err) {
      console.warn("Aviso al obtener prácticas del turno:", err);
      setPracticasTurno([]);
    } finally {
      setCargandoDetalles(false);
    }
  };

  const seleccionarModalidad = (mod) => {
    if (typeof actualizarDatos === "function") {
      actualizarDatos((prev) => ({
        ...prev,
        modalidad: mod,
        monto_a_cobrar:
          mod === "inmediato" && montoAcordado > 0 ? String(montoAcordado) : prev.monto_a_cobrar,
        cant_cuotas: mod === "cuotas" ? (Number(prev.cant_cuotas) > 1 ? prev.cant_cuotas : 3) : 1,
        metodo_pago:
          mod === "cuotas"
            ? "Tarjeta"
            : prev.metodo_pago === "Tarjeta"
            ? "Efectivo"
            : prev.metodo_pago || "Efectivo",
      }));
    }
  };

  const manejarSubmit = (e) => {
    e.preventDefault();
    if (!datosFormulario.modalidad) {
      alert("Por favor, selecciona una modalidad de cobro (Pago Inmediato, Plan de Cuotas Fijas o Acuerdo Informal).");
      return;
    }

    if (datosFormulario.modalidad === "cuotas" && montoAcordado > 0) {
      const montoTotalCuotas = Number(datosFormulario.monto_a_cobrar) || 0;
      if (montoTotalCuotas < montoAcordado) {
        alert(
          `El monto total del plan de cuotas fijas ($${montoTotalCuotas.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
          })}) debe ser igual o mayor al monto acordado de la consulta ($${montoAcordado.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
          })}).`
        );
        return;
      }
    }

    procesarFormulario(e);
  };

  return (
    <form onSubmit={manejarSubmit}>
      <Modal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        width="max-w-2xl"
        title={editando ? "Editar Registro de Cobro" : "Registrar Cobro"}
      >
        <div className="text-xs text-gray-500 mb-4 -mt-2 font-medium">
          Módulo administrativo y contable de cobros
        </div>

        <div className="flex flex-col gap-4 text-sm">
          {/* 1. SELECCIÓN DE TURNO Y PACIENTE */}
          <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2.5 flex items-center gap-1.5">
              <User size={15} className="text-[#2eb086]" />
              1. Selección de Turno y Datos del Paciente
            </h4>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Seleccionar Turno *</label>

                {!turnosAtendidos || turnosAtendidos.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-800 font-medium flex items-center justify-between">
                    <span>No hay turnos atendidos pendientes de cobrar.</span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                      Al día
                    </span>
                  </div>
                ) : (
                  <InputFiltro
                    datos={turnosAtendidos}
                    camposFiltrado={["id_turno", "Paciente.nombre", "Paciente.apellido", "Paciente.dni"]}
                    formatoVisual={(t) => {
                      const deuda = t.saldo_pendiente !== undefined ? t.saldo_pendiente : (t.precio_final || 0);
                      return `Turno #${t.id_turno} - ${t.Paciente?.nombre || ""} ${t.Paciente?.apellido || ""} (Pendiente: $${Number(deuda).toLocaleString("es-AR")})`;
                    }}
                    placeholder="Buscar por ID de turno o nombre de paciente..."
                    valorInicial={datosFormulario.id_turno || ""}
                    alSeleccionar={(t) => {
                      const monto = t.saldo_pendiente !== undefined ? t.saldo_pendiente : (t.precio_final || "");
                      if (typeof actualizarDatos === "function") {
                        actualizarDatos((prev) => ({
                          ...prev,
                          id_turno: String(t.id_turno),
                          id_paciente: String(t.id_paciente || t.Paciente?.id_paciente || ""),
                          monto_a_cobrar: String(monto),
                          monto_abonado: String(monto),
                        }));
                      }
                    }}
                  />
                )}
              </div>

              {/* Tarjeta dinámica de información */}
              {turnoSeleccionado && (
                <div className="bg-white p-3 rounded-xl border border-gray-200 mt-1 space-y-2.5 text-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-2 gap-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                        Paciente Asociado
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-gray-800">
                        {turnoSeleccionado.Paciente?.nombre} {turnoSeleccionado.Paciente?.apellido}
                      </span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                        DNI / Teléfono
                      </span>
                      <span className="text-xs font-medium text-gray-600">
                        DNI: {turnoSeleccionado.Paciente?.dni || "S/D"} | Tel:{" "}
                        {turnoSeleccionado.Paciente?.telefono || "S/D"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 flex items-center gap-1">
                      <ShieldCheck size={12} className="text-[#2eb086]" />
                      Prácticas Realizadas (Desde el turno)
                    </span>

                    {cargandoDetalles ? (
                      <p className="text-xs text-gray-400 italic">Cargando detalles...</p>
                    ) : practicasTurno.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {practicasTurno.map((pt, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-2 rounded-lg gap-1"
                          >
                            <span className="font-semibold text-gray-700 text-xs">
                              {pt.Practica?.nombre_referencia ||
                                pt.Practica?.nombre_nomenclador ||
                                `Práctica #${pt.id_practica}`}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold w-fit ${
                                pt.ObraSocial
                                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                                  : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              }`}
                            >
                              {pt.ObraSocial?.nombre || "Particular / Sin Obra Social"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-2 rounded-lg gap-1">
                        <span className="text-gray-500 font-medium text-xs">
                          Consulta Odontológica General
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 w-fit">
                          Particular / Sin Obra Social
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. MODALIDADES DE COBRO */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2.5 flex items-center gap-1.5">
              <Banknote size={15} className="text-[#2eb086]" />
              2. Modalidad de Cobro
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SelectorModalidad
                titulo="Pago Inmediato"
                descripcion="Pago único en el acto por el monto pactado del turno para saldar la atención."
                activa={datosFormulario.modalidad === "inmediato"}
                onClick={() => seleccionarModalidad("inmediato")}
                Icono={CheckCircle2}
              />
              <SelectorModalidad
                titulo="Plan de Cuotas Fijas"
                descripcion="Financiación en cuotas fijas por Tarjeta con opción de cobrar la 1ª ahora."
                activa={datosFormulario.modalidad === "cuotas"}
                onClick={() => seleccionarModalidad("cuotas")}
                Icono={Layers}
              />
              <SelectorModalidad
                titulo="Acuerdo Informal / Libre"
                descripcion="Costo pactado total y pagos parciales a cuenta sin vencimiento."
                activa={datosFormulario.modalidad === "informal"}
                onClick={() => seleccionarModalidad("informal")}
                Icono={FileText}
                esAmber
              />
            </div>
            {!datosFormulario.modalidad && (
              <p className="text-xs text-gray-500 italic mt-2.5 text-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                Selecciona una modalidad arriba para continuar con los detalles del cobro.
              </p>
            )}
          </div>

          {/* 3. VISTAS ESPECÍFICAS SEGÚN MODALIDAD */}
          {datosFormulario.modalidad === "inmediato" && (
            <DetalleInmediato datosFormulario={datosFormulario} actualizarDatos={actualizarDatos} />
          )}

          {datosFormulario.modalidad === "cuotas" && (
            <DetalleCuotas
              datosFormulario={datosFormulario}
              actualizarDatos={actualizarDatos}
              montoAcordado={montoAcordado}
            />
          )}

          {datosFormulario.modalidad === "informal" && (
            <DetalleInformal datosFormulario={datosFormulario} actualizarDatos={actualizarDatos} />
          )}
        </div>

        <div className="border-t border-gray-200 my-4" />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={cerrarModal}
            className="px-4 py-2.5 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium text-xs sm:text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!datosFormulario.modalidad}
            className={`px-5 py-2.5 rounded-xl text-white font-semibold text-xs sm:text-sm transition-all shadow-sm ${
              !datosFormulario.modalidad
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[#2eb086] hover:bg-[#259370] cursor-pointer"
            }`}
          >
            {editando ? "Guardar Cambios" : "Confirmar Registro"}
          </button>
        </div>
      </Modal>
    </form>
  );
}

/* ─── SUBCOMPONENTES DE APOYO ─────────────────── */

function SelectorModalidad({ titulo, descripcion, activa, onClick, Icono, esAmber }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer p-3 rounded-2xl border transition-all ${
        activa
          ? esAmber
            ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500 shadow-sm"
            : "border-[#2eb086] bg-[#e8f7f1]/40 ring-1 ring-[#2eb086] shadow-sm"
          : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-1.5 font-bold text-xs text-gray-800 mb-1">
        <Icono size={16} className={esAmber ? "text-amber-600" : "text-[#2eb086]"} />
        <span>{titulo}</span>
      </div>
      <p className="text-[11px] text-gray-500 leading-snug">{descripcion}</p>
    </div>
  );
}

function DetalleInmediato({ datosFormulario, actualizarDatos }) {
  const costoTotal = Number(datosFormulario.monto_a_cobrar) || 0;

  return (
    <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
          <CreditCard size={15} className="text-[#2eb086]" />
          3. Detalle del Pago Inmediato
        </h4>
        <span className="text-xs font-bold bg-[#e8f7f1] text-[#2eb086] px-3 py-1 rounded-full border border-[#2eb086]/30 w-fit">
          Monto Fijo: ${costoTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Monto a Cobrar (Fijo) *</label>
          <input
            type="number"
            step="0.01"
            name="monto_a_cobrar"
            value={datosFormulario.monto_a_cobrar}
            readOnly
            className="w-full border border-gray-200 p-2.5 rounded-xl text-xs sm:text-sm bg-gray-100 text-gray-700 font-bold cursor-not-allowed select-none"
            title="El monto corresponde a lo acordado para el turno y se cancela en un pago único"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Forma de Pago *</label>
          <select
            name="metodo_pago"
            value={datosFormulario.metodo_pago || "Efectivo"}
            onChange={actualizarDatos}
            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#2eb086]/50 font-medium text-gray-800"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta Débito/Crédito</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-gray-500 italic bg-white p-2.5 rounded-xl border border-gray-100">
        ℹ️ Se cancelará la totalidad de la deuda pactada (<strong>${costoTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</strong>) en un único pago, dejando el turno al día.
      </p>
    </div>
  );
}

function DetalleCuotas({ datosFormulario, actualizarDatos, montoAcordado = 0 }) {
  const costoTotal = Number(datosFormulario.monto_a_cobrar) || 0;
  const cantCuotas = Number(datosFormulario.cant_cuotas) || 3;
  const valorCuota = costoTotal > 0 ? (costoTotal / cantCuotas).toFixed(2) : "0.00";
  const cobrarPrimera =
    datosFormulario.cobrar_primera_cuota !== undefined
      ? Boolean(datosFormulario.cobrar_primera_cuota)
      : true;

  // En la modalidad de cuotas fijas el método de pago siempre es Tarjeta
  useEffect(() => {
    if (datosFormulario.metodo_pago !== "Tarjeta" && typeof actualizarDatos === "function") {
      actualizarDatos((prev) => ({ ...prev, metodo_pago: "Tarjeta" }));
    }
  }, [datosFormulario.metodo_pago, actualizarDatos]);

  const esMenorAlAcordado = montoAcordado > 0 && costoTotal < montoAcordado;

  return (
    <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
          <Layers size={15} className="text-[#2eb086]" />
          3. Configuración de Cuotas Fijas
        </h4>
        <span className="text-xs font-bold bg-[#e8f7f1] text-[#2eb086] px-3 py-1 rounded-full border border-[#2eb086]/30 w-fit">
          Total a financiar: ${costoTotal.toFixed(2)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* MONTO TOTAL MODIFICABLE (IGUAL O MAYOR AL ACORDADO) */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Monto Total *</label>
          <input
            type="number"
            step="0.01"
            min={montoAcordado > 0 ? montoAcordado : 0}
            name="monto_a_cobrar"
            value={datosFormulario.monto_a_cobrar}
            onChange={actualizarDatos}
            required
            className={`w-full border p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 font-bold text-gray-800 ${
              esMenorAlAcordado
                ? "border-rose-400 focus:ring-rose-400 bg-rose-50/50"
                : "border-gray-300 focus:ring-[#2eb086]/50"
            }`}
            placeholder="0.00"
          />
          {montoAcordado > 0 && (
            <span
              className={`text-[10px] block mt-1 font-medium ${
                esMenorAlAcordado ? "text-rose-600" : "text-gray-400"
              }`}
            >
              Mínimo acordado: ${montoAcordado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Cantidad de Cuotas *</label>
          <select
            name="cant_cuotas"
            value={datosFormulario.cant_cuotas}
            onChange={actualizarDatos}
            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#2eb086]/50 text-gray-800 font-semibold"
          >
            {[2, 3, 4, 5, 6, 9, 12].map((num) => (
              <option key={num} value={num}>
                {num} cuotas fijas
              </option>
            ))}
          </select>
        </div>

        {/* MONTO DE CADA CUOTA */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Valor por Cuota</label>
          <div className="w-full border border-blue-200 p-2.5 rounded-xl text-xs sm:text-sm bg-blue-50 text-blue-800 font-bold flex items-center justify-between">
            <span>${valorCuota}</span>
            <span className="text-[10px] text-blue-600 font-semibold uppercase">Fijo</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">1º Vencimiento *</label>
          <input
            type="date"
            name="fecha_primer_vencimiento"
            value={datosFormulario.fecha_primer_vencimiento}
            onChange={actualizarDatos}
            required
            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#2eb086]/50 text-gray-800 font-semibold"
          />
        </div>
      </div>

      {/* OPCIÓN: COBRAR LA PRIMERA CUOTA AHORA (MÉTODO SIEMPRE TARJETA) */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            name="cobrar_primera_cuota"
            checked={cobrarPrimera}
            onChange={(e) =>
              actualizarDatos({
                target: { name: "cobrar_primera_cuota", value: e.target.checked },
              })
            }
            className="w-4 h-4 text-[#2eb086] rounded border-gray-300 focus:ring-[#2eb086]"
          />
          <span className="text-xs font-bold text-gray-800 block">¿Cobrar 1ª cuota ahora en caja?</span>
        </label>

        <div className="w-full sm:w-56">
          <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
            Método de Pago (Exclusivo)
          </label>
          <div className="w-full border border-blue-200 bg-blue-50/70 p-2 rounded-xl text-xs font-bold text-blue-900 flex items-center gap-2">
            <CreditCard size={15} className="text-blue-600 shrink-0" />
            <span>Tarjeta Débito / Crédito</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-600 bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl">
        {cobrarPrimera ? (
          <span>
            ✅ Se cobrará la <strong>Cuota #1 (${valorCuota})</strong> hoy por <strong>Tarjeta</strong>. Las{" "}
            <strong>{cantCuotas - 1}</strong> cuotas restantes de <strong>${valorCuota}</strong> quedarán programadas con vencimiento mensual por Tarjeta.
          </span>
        ) : (
          <span>
            ℹ️ Las <strong>{cantCuotas}</strong> cuotas fijas de <strong>${valorCuota}</strong> quedarán programadas a pagar exclusivamente por Tarjeta a partir del 1º vencimiento.
          </span>
        )}
      </div>
    </div>
  );
}

function DetalleInformal({ datosFormulario, actualizarDatos }) {
  const costoTotal = Number(datosFormulario.monto_a_cobrar) || 0;
  const entregaInicial = Number(datosFormulario.entrega_inicial) || 0;
  const saldoPendiente = Math.max(0, costoTotal - entregaInicial);

  return (
    <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80 space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
        <FileText size={15} className="text-amber-600" />
        3. Costo Acordado y Entrega Inicial
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Costo Acordado Total *</label>
          <input
            type="number"
            step="0.01"
            name="monto_a_cobrar"
            value={datosFormulario.monto_a_cobrar}
            onChange={actualizarDatos}
            placeholder="0.00"
            required
            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Entrega Inicial / Seña (Opcional)
          </label>
          <input
            type="number"
            step="0.01"
            name="entrega_inicial"
            value={datosFormulario.entrega_inicial}
            onChange={actualizarDatos}
            placeholder="0.00"
            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Método de Pago *</label>
          <select
            name="metodo_pago"
            value={datosFormulario.metodo_pago || "Efectivo"}
            onChange={actualizarDatos}
            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500/50 font-medium text-gray-800"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta Débito/Crédito</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-gray-200 text-center">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Costo Total</span>
          <span className="text-xs sm:text-sm font-bold text-gray-800">${costoTotal.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Entrega Inicial</span>
          <span className="text-xs sm:text-sm font-bold text-emerald-600">${entregaInicial.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Saldo Pendiente</span>
          <span className="text-xs sm:text-sm font-bold text-amber-600">${saldoPendiente.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export function FormularioEliminarCobro({
  modalEliminar,
  cerrarModal,
  cobroSeleccionado,
  ejecutarEliminacion,
}) {
  return (
    <Modal isOpen={modalEliminar} onClose={cerrarModal} width="max-w-md" title="Desactivar Registro de Cobro">
      <div className="flex flex-col gap-3">
        <p className="text-xs sm:text-sm text-gray-600">
          ¿Estás seguro de que deseas desactivar el cobro con ID{" "}
          <strong className="text-gray-800">#{cobroSeleccionado?.id_cobro}</strong>? El registro dejará de
          figurar en el listado activo.
        </p>
      </div>

      <div className="border-t border-gray-200 my-4" />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={cerrarModal}
          className="px-4 py-2 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium text-xs sm:text-sm"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={ejecutarEliminacion}
          className="px-4 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600 font-semibold text-xs sm:text-sm transition-colors shadow-sm"
        >
          Sí, Desactivar
        </button>
      </div>
    </Modal>
  );
}
