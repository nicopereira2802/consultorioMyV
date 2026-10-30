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

  useEffect(() => {
    const idTurno = datosFormulario.id_turno;
    if (!idTurno || turnosAtendidos.length === 0) {
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
        cant_cuotas: mod === "cuotas" ? 3 : 1,
      }));
    }
  };

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
          {/* 1. SELECCIÓN DE TURNO Y PACIENTE */}
          <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2.5 flex items-center gap-1.5">
              <User size={15} className="text-[#2eb086]" />
              1. Selección de Turno y Datos del Paciente
            </h4>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Seleccionar Turno *</label>

                {turnosAtendidos.length === 0 ? (
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
                      actualizarDatos({
                        target: { name: "id_turno", value: t.id_turno },
                      });
                      actualizarDatos({
                        target: { name: "id_paciente", value: t.id_paciente },
                      });
                      const monto = t.saldo_pendiente !== undefined ? t.saldo_pendiente : (t.precio_final || "");
                      actualizarDatos({
                        target: { name: "monto_a_cobrar", value: monto },
                      });
                      actualizarDatos({
                        target: { name: "monto_abonado", value: monto },
                      });
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
                titulo="Pago Inmediato (Total o Parcial)"
                descripcion="Cobro en 1 pago ahora. Si paga menos del total, el saldo queda pendiente."
                activa={datosFormulario.modalidad === "inmediato"}
                onClick={() => seleccionarModalidad("inmediato")}
                Icono={CheckCircle2}
              />
              <SelectorModalidad
                titulo="Plan de Cuotas Fijas"
                descripcion="Financiación en cuotas con opción de cobrar la 1ª ahora."
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
          </div>

          {/* 3. VISTAS ESPECÍFICAS SEGÚN MODALIDAD */}
          {datosFormulario.modalidad === "inmediato" && (
            <DetalleInmediato datosFormulario={datosFormulario} actualizarDatos={actualizarDatos} />
          )}

          {datosFormulario.modalidad === "cuotas" && (
            <DetalleCuotas datosFormulario={datosFormulario} actualizarDatos={actualizarDatos} />
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
            className="px-5 py-2.5 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] font-semibold text-xs sm:text-sm transition-all shadow-sm"
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
  const montoAbonado =
    datosFormulario.monto_abonado !== undefined && datosFormulario.monto_abonado !== ""
      ? Number(datosFormulario.monto_abonado)
      : costoTotal;
  const saldoRestante = Math.max(0, costoTotal - montoAbonado);
  const esParcial = montoAbonado < costoTotal;

  return (
    <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
          <CreditCard size={15} className="text-[#2eb086]" />
          3. Detalle del Pago Inmediato
        </h4>
        <span className="text-xs font-bold bg-[#e8f7f1] text-[#2eb086] px-3 py-1 rounded-full border border-[#2eb086]/30 w-fit">
          Deuda Total: ${costoTotal.toFixed(2)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Total a Cobrar *</label>
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
          <label className="block text-xs font-semibold text-gray-700 mb-1">Monto a Abonar Ahora *</label>
          <input
            type="number"
            step="0.01"
            name="monto_abonado"
            value={
              datosFormulario.monto_abonado !== undefined
                ? datosFormulario.monto_abonado
                : datosFormulario.monto_a_cobrar
            }
            onChange={actualizarDatos}
            placeholder="0.00"
            required
            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#2eb086]/50 font-bold text-[#2eb086]"
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

      {esParcial && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="font-bold block">💡 Cobro Parcial de Deuda</span>
            <span>
              Se cobrarán <strong>${montoAbonado.toFixed(2)}</strong> ahora. El turno continuará figurando en{" "}
              <strong>Por Cobrar</strong> con un saldo pendiente de <strong>${saldoRestante.toFixed(2)}</strong>.
            </span>
          </div>
          <span className="px-2.5 py-1 bg-amber-200/80 text-amber-900 rounded-lg font-bold text-[11px] whitespace-nowrap">
            Saldo Restante: ${saldoRestante.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

function DetalleCuotas({ datosFormulario, actualizarDatos }) {
  const costoTotal = Number(datosFormulario.monto_a_cobrar) || 0;
  const cantCuotas = Number(datosFormulario.cant_cuotas) || 3;
  const valorCuota = costoTotal > 0 ? (costoTotal / cantCuotas).toFixed(2) : "0.00";
  const cobrarPrimera =
    datosFormulario.cobrar_primera_cuota !== undefined
      ? Boolean(datosFormulario.cobrar_primera_cuota)
      : true;

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
          <label className="block text-xs font-semibold text-gray-700 mb-1">Cantidad de Cuotas *</label>
          <select
            name="cant_cuotas"
            value={datosFormulario.cant_cuotas}
            onChange={actualizarDatos}
            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#2eb086]/50 text-gray-800"
          >
            {[2, 3, 4, 5, 6, 9, 12].map((num) => (
              <option key={num} value={num}>
                {num} cuotas fijas ({costoTotal > 0 ? `$${(costoTotal / num).toFixed(2)} c/u` : ""})
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

      {/* OPCIÓN: COBRAR LA PRIMERA CUOTA AHORA */}
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
          <div>
            <span className="text-xs font-bold text-gray-800 block">¿Cobrar 1ª cuota ahora en caja?</span>
            <span className="text-[11px] text-gray-500">
              Registra el ingreso inmediato de ${valorCuota} y asienta el comprobante.
            </span>
          </div>
        </label>

        {cobrarPrimera && (
          <div className="w-full sm:w-48">
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
              Forma de Pago (1ª Cuota)
            </label>
            <select
              name="metodo_pago"
              value={datosFormulario.metodo_pago}
              onChange={actualizarDatos}
              className="w-full border border-gray-300 p-1.5 rounded-lg text-xs bg-gray-50 focus:ring-2 focus:ring-[#2eb086]/50 font-medium text-gray-800"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta Débito/Crédito</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-600 bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl">
        {cobrarPrimera ? (
          <span>
            ✅ Se cobrarán <strong>${valorCuota}</strong> hoy por{" "}
            <strong>{datosFormulario.metodo_pago || "Efectivo"}</strong> (Cuota #1). Las{" "}
            <strong>{cantCuotas - 1}</strong> cuotas restantes quedarán pendientes.
          </span>
        ) : (
          <span>
            ℹ️ Las <strong>{cantCuotas}</strong> cuotas de <strong>${valorCuota}</strong> quedarán pendientes a pagar a partir del 1º vencimiento.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
