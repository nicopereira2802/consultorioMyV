/** @format */

import { useState } from "react";
import Modal from "../../../components/common/Modal";
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
  setDatosFormulario,
}) {
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [practicasTurno, setPracticasTurno] = useState([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  // Al cambiar el turno en el select, cargamos su detalle completo
  const manejarSeleccionTurno = async (e) => {
    const idTurno = e.target.value;
    actualizarDatos(e);

    if (!idTurno) {
      setTurnoSeleccionado(null);
      setPracticasTurno([]);
      return;
    }

    const tEncontrado = turnosAtendidos.find((t) => String(t.id_turno) === String(idTurno));

    if (tEncontrado) {
      setTurnoSeleccionado(tEncontrado);
      setDatosFormulario((prev) => ({
        ...prev,
        id_paciente: tEncontrado.id_paciente,
        monto_a_cobrar: tEncontrado.precio_final || prev.monto_a_cobrar,
      }));
    }

    // Obtener prácticas realizadas en el turno
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
    setDatosFormulario((prev) => ({
      ...prev,
      modalidad: mod,
      cant_cuotas: mod === "cuotas" ? 3 : 1,
    }));
  };

  // Cálculo para Acuerdo Informal
  const costoTotal = Number(datosFormulario.monto_a_cobrar) || 0;
  const entregaInicial = Number(datosFormulario.entrega_inicial) || 0;
  const saldoPendiente = Math.max(0, costoTotal - entregaInicial);

  return (
    <form onSubmit={procesarFormulario}>
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
          {/* ─── 1. SELECCIÓN DE TURNO Y DATOS DEL PACIENTE ─── */}
          <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2.5 flex items-center gap-1.5">
              <User size={15} className="text-[#2eb086]" />
              1. Selección de Turno y Datos del Paciente
            </h4>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Seleccionar Turno *</label>
                <select
                  name="id_turno"
                  value={datosFormulario.id_turno}
                  onChange={manejarSeleccionTurno}
                  required
                  className="w-full border border-emerald-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 transition-all font-medium text-gray-800"
                >
                  <option value="">-- Seleccionar Turno --</option>
                  {turnosAtendidos.map((t) => (
                    <option key={t.id_turno} value={t.id_turno}>
                      Turno #{t.id_turno} - Paciente: {t.Paciente?.nombre} {t.Paciente?.apellido} ($
                      {t.precio_final || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tarjeta dinámica de información del paciente y prácticas */}
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
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider mb-1 flex items-center gap-1">
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

          {/* ─── 2. MODALIDAD DE COBRO ─── */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2.5 flex items-center gap-1.5">
              <Banknote size={15} className="text-[#2eb086]" />
              2. Modalidad de Cobro
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Botón Pago Total */}
              <div
                onClick={() => seleccionarModalidad("inmediato")}
                className={`cursor-pointer p-3 rounded-2xl border transition-all ${
                  datosFormulario.modalidad === "inmediato"
                    ? "border-[#2eb086] bg-[#e8f7f1]/40 ring-1 ring-[#2eb086] shadow-sm"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-gray-800 mb-1">
                  <CheckCircle2 size={16} className="text-[#2eb086]" />
                  <span>Pago Total (Inmediato)</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Cobro inmediato en 1 pago. El paciente queda al día.
                </p>
              </div>

              {/* Botón Plan Cuotas */}
              <div
                onClick={() => seleccionarModalidad("cuotas")}
                className={`cursor-pointer p-3 rounded-2xl border transition-all ${
                  datosFormulario.modalidad === "cuotas"
                    ? "border-[#2eb086] bg-[#e8f7f1]/40 ring-1 ring-[#2eb086] shadow-sm"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-gray-800 mb-1">
                  <Layers size={16} className="text-[#2eb086]" />
                  <span>Plan de Cuotas Fijas</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Cuotas mensuales fijas con fechas de vencimiento.
                </p>
              </div>

              {/* Botón Acuerdo Informal */}
              <div
                onClick={() => seleccionarModalidad("informal")}
                className={`cursor-pointer p-3 rounded-2xl border transition-all ${
                  datosFormulario.modalidad === "informal"
                    ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500 shadow-sm"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-gray-800 mb-1">
                  <FileText size={16} className="text-amber-600" />
                  <span>Acuerdo Informal / Libre</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Costo pactado total y pagos parciales a cuenta sin vencimiento.
                </p>
              </div>
            </div>
          </div>

          {/* ─── 3. DETALLE DE LA MODALIDAD SELECCIONADA ─── */}

          {/* OPCIÓN A: PAGO TOTAL INMEDIATO */}
          {datosFormulario.modalidad === "inmediato" && (
            <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                  <CreditCard size={15} className="text-[#2eb086]" />
                  3. Detalle del Pago Inmediato
                </h4>
                <span className="text-xs font-bold bg-[#e8f7f1] text-[#2eb086] px-3 py-1 rounded-full border border-[#2eb086]/30 w-fit">
                  Monto a cancelar: ${costoTotal.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Monto a Cobrar *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="monto_a_cobrar"
                    value={datosFormulario.monto_a_cobrar}
                    onChange={actualizarDatos}
                    placeholder="0.00"
                    required
                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#2eb086]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Forma de Pago *</label>
                  <select
                    name="metodo_pago"
                    value={datosFormulario.metodo_pago}
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

              <div className="bg-[#e8f7f1] border border-[#2eb086]/30 rounded-xl p-2.5 text-xs text-[#2eb086] font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>
                  El cobro se asentará en una única cuota cancelada en el acto. El paciente quedará{" "}
                  <strong>Al Día</strong>.
                </span>
              </div>
            </div>
          )}

          {/* OPCIÓN B: PLAN DE CUOTAS FIJAS */}
          {datosFormulario.modalidad === "cuotas" && (
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Monto Total *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="monto_a_cobrar"
                    value={datosFormulario.monto_a_cobrar}
                    onChange={actualizarDatos}
                    placeholder="0.00"
                    required
                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#2eb086]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cantidad de Cuotas *
                  </label>
                  <select
                    name="cant_cuotas"
                    value={datosFormulario.cant_cuotas}
                    onChange={actualizarDatos}
                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#2eb086]/50 text-gray-800"
                  >
                    {[2, 3, 4, 5, 6, 9, 12].map((num) => (
                      <option key={num} value={num}>
                        {num} cuotas fijas
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">1º Vencimiento *</label>
                  <input
                    type="date"
                    name="fecha_primer_vencimiento"
                    value={datosFormulario.fecha_primer_vencimiento}
                    onChange={actualizarDatos}
                    required
                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#2eb086]/50 text-gray-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* OPCIÓN C: ACUERDO INFORMAL / LIBRE */}
          {datosFormulario.modalidad === "informal" && (
            <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                <FileText size={15} className="text-amber-600" />
                3. Costo Acordado y Entrega Inicial
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Costo Acordado Total *
                  </label>
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
              </div>

              {/* Indicadores de costo */}
              <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-gray-200 text-center">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Costo Total</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-800">${costoTotal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Entrega Inicial</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-600">
                    ${entregaInicial.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Saldo Pendiente</span>
                  <span className="text-xs sm:text-sm font-bold text-amber-600">
                    ${saldoPendiente.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-800 font-medium">
                ⓘ Se registrará el costo total acordado. El paciente abonará entregas o pagos parciales según
                sus posibilidades sin vencimientos preestablecidos.
              </div>
            </div>
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
            className="px-5 py-2.5 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] font-semibold text-xs sm:text-sm transition-all shadow-sm"
          >
            {editando ? "Guardar Cambios" : "Confirmar Registro"}
          </button>
        </div>
      </Modal>
    </form>
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
