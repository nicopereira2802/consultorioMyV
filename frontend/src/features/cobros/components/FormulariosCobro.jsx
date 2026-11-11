/** @format */

import { useState, useEffect, useMemo } from "react";
import Modal from "../../../components/common/Modal";
import InputFiltro from "../../../components/common/InputFiltro";
import api from "../../../services/api";
import { User, CheckCircle2, FileText, ShieldCheck, CreditCard, Banknote } from "lucide-react";

export function FormularioCrearEditarCobro({
  procesarFormulario,
  modalAbierto,
  cerrarModal,
  editando,
  datosFormulario,
  actualizarDatos,
  turnosAtendidos = [],
}) {
  const [practicasTurno, setPracticasTurno] = useState([]);

  // Turno seleccionado derivado de los datos del formulario y la lista de turnos atendidos
  const turnoSeleccionado = useMemo(() => {
    const idTurno = datosFormulario?.id_turno;
    if (!idTurno || !turnosAtendidos) return null;
    return turnosAtendidos.find((t) => String(t.id_turno) === String(idTurno)) || null;
  }, [datosFormulario?.id_turno, turnosAtendidos]);

  // Monto acordado del turno seleccionado (monto fijo para pago único o base para acuerdo informal)
  const montoAcordado = useMemo(() => {
    if (turnoSeleccionado) {
      return Number(
        turnoSeleccionado.saldo_pendiente !== undefined
          ? turnoSeleccionado.saldo_pendiente
          : (turnoSeleccionado.precio_final || 0)
      );
    }
    return Number(datosFormulario?.monto_a_cobrar) || 0;
  }, [turnoSeleccionado, datosFormulario?.monto_a_cobrar]);

  // Carga asíncrona de las prácticas asociadas al turno
  useEffect(() => {
    const idTurno = datosFormulario?.id_turno;
    if (!idTurno) return;

    let activo = true;

    const cargarPracticas = async () => {
      try {
        const res = await api.get(`/practicas-turnos/${idTurno}/turno`);
        if (activo) {
          setPracticasTurno(res.data.data || res.data || []);
        }
      } catch (err) {
        console.warn("Aviso al obtener prácticas del turno:", err);
        if (activo) {
          setPracticasTurno([]);
        }
      }
    };

    cargarPracticas();

    return () => {
      activo = false;
    };
  }, [datosFormulario?.id_turno]);

  const practicasAMostrar = datosFormulario?.id_turno ? practicasTurno : [];

  const seleccionarModalidad = (mod) => {
    if (typeof actualizarDatos === "function") {
      actualizarDatos((prev) => {
        const base = typeof prev === "object" && prev !== null ? prev : {};
        const monto =
          mod === "inmediato" && montoAcordado > 0
            ? String(montoAcordado)
            : base.monto_a_cobrar || String(montoAcordado || "");

        return {
          ...base,
          modalidad: mod,
          monto_a_cobrar: monto,
          monto_abonado: mod === "inmediato" ? monto : base.monto_abonado || base.entrega_inicial || "",
          entrega_inicial: mod === "inmediato" ? monto : base.entrega_inicial || "",
          cant_cuotas: 1,
          metodo_pago: base.metodo_pago || "Efectivo",
        };
      });
    }
  };

  const manejarSubmit = (e) => {
    e.preventDefault();
    if (!datosFormulario?.modalidad) {
      alert("Por favor, selecciona una modalidad de cobro (Pago Único o Acuerdo Informal).");
      return;
    }

    if (!datosFormulario?.id_turno) {
      alert("Por favor, selecciona un turno para registrar el cobro.");
      return;
    }

    if (procesarFormulario) {
      procesarFormulario(e);
    }
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
                    valorInicial={datosFormulario?.id_turno || ""}
                    alSeleccionar={(t) => {
                      const monto = t.saldo_pendiente !== undefined ? t.saldo_pendiente : (t.precio_final || "");
                      if (typeof actualizarDatos === "function") {
                        actualizarDatos((prev) => ({
                          ...prev,
                          id_turno: String(t.id_turno),
                          id_paciente: String(t.id_paciente || t.Paciente?.id_paciente || ""),
                          monto_a_cobrar: String(monto),
                          monto_abonado: String(monto),
                          entrega_inicial: String(monto),
                        }));
                      }
                    }}
                  />
                )}
              </div>

              {/* Tarjeta dinámica de información del paciente y prácticas */}
              {(turnoSeleccionado || datosFormulario?.id_turno) && (
                <div className="bg-white p-3 rounded-xl border border-gray-200 mt-1 space-y-2.5 text-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-2 gap-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                        Paciente Asociado
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-gray-800">
                        {turnoSeleccionado?.Paciente
                          ? `${turnoSeleccionado.Paciente.nombre} ${turnoSeleccionado.Paciente.apellido}`
                          : `Paciente #${datosFormulario?.id_paciente || ""}`}
                      </span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                        DNI / Teléfono
                      </span>
                      <span className="text-xs font-medium text-gray-600">
                        DNI: {turnoSeleccionado?.Paciente?.dni || "S/D"} | Tel:{" "}
                        {turnoSeleccionado?.Paciente?.telefono || "S/D"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 flex items-center gap-1">
                      <ShieldCheck size={12} className="text-[#2eb086]" />
                      Prácticas Realizadas (Desde el turno)
                    </span>

                    {practicasAMostrar.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {practicasAMostrar.map((pt, idx) => (
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

          {/* 2. MODALIDADES DE COBRO CON TARJETAS SELECCIONABLES */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2.5 flex items-center gap-1.5">
              <Banknote size={15} className="text-[#2eb086]" />
              2. Modalidad de Cobro
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SelectorModalidad
                titulo="Pago Único"
                descripcion="Pago total en el acto por el monto pactado del turno para saldar la atención."
                activa={datosFormulario?.modalidad === "inmediato"}
                onClick={() => seleccionarModalidad("inmediato")}
                Icono={CheckCircle2}
              />
              <SelectorModalidad
                titulo="Acuerdo Informal"
                descripcion="Costo pactado total y pagos parciales a cuenta sin vencimiento."
                activa={datosFormulario?.modalidad === "informal"}
                onClick={() => seleccionarModalidad("informal")}
                Icono={FileText}
                esAmber
              />
            </div>
            {!datosFormulario?.modalidad && (
              <p className="text-xs text-gray-500 italic mt-2.5 text-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                Selecciona una modalidad arriba para continuar con los detalles del cobro.
              </p>
            )}
          </div>

          {/* 3. VISTAS ESPECÍFICAS SEGÚN MODALIDAD */}
          {datosFormulario?.modalidad === "inmediato" && (
            <DetalleInmediato datosFormulario={datosFormulario} actualizarDatos={actualizarDatos} />
          )}

          {datosFormulario?.modalidad === "informal" && (
            <DetalleInformal datosFormulario={datosFormulario} actualizarDatos={actualizarDatos} />
          )}
        </div>

        <div className="border-t border-gray-200 my-4" />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={cerrarModal}
            className="px-4 py-2.5 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!datosFormulario?.modalidad}
            className={`px-5 py-2.5 rounded-xl text-white font-semibold text-xs sm:text-sm transition-all shadow-sm ${
              !datosFormulario?.modalidad
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
      className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
        activa
          ? esAmber
            ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/40 shadow-sm"
            : "border-[#2eb086] bg-[#e8f7f1]/50 ring-2 ring-[#2eb086]/40 shadow-sm"
          : "border-gray-200 bg-white hover:bg-gray-50/80 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-gray-800 mb-1">
        <Icono size={18} className={esAmber ? "text-amber-600" : "text-[#2eb086]"} />
        <span>{titulo}</span>
      </div>
      <p className="text-[11px] text-gray-500 leading-snug">{descripcion}</p>
    </div>
  );
}

function DetalleInmediato({ datosFormulario, actualizarDatos }) {
  const costoTotal = Number(datosFormulario?.monto_a_cobrar) || 0;

  return (
    <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
          <CreditCard size={15} className="text-[#2eb086]" />
          3. Detalle de Pago Único
        </h4>
        <span className="text-xs font-bold bg-[#e8f7f1] text-[#2eb086] px-3 py-1 rounded-full border border-[#2eb086]/30 w-fit">
          Monto Total: ${costoTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Monto a Cobrar (Total) *</label>
          <input
            type="number"
            step="0.01"
            name="monto_a_cobrar"
            value={datosFormulario?.monto_a_cobrar || ""}
            readOnly
            className="w-full border border-gray-200 p-2.5 rounded-xl text-xs sm:text-sm bg-gray-100 text-gray-700 font-bold cursor-not-allowed select-none"
            title="El monto corresponde a lo acordado para el turno y se cancela en un pago único"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Método de Pago *</label>
          <select
            name="metodo_pago"
            value={datosFormulario?.metodo_pago || "Efectivo"}
            onChange={actualizarDatos}
            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#2eb086]/50 font-medium text-gray-800"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta Débito / Crédito</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-gray-500 italic bg-white p-2.5 rounded-xl border border-gray-100">
        ℹ️ Se cancelará la totalidad de la deuda pactada (
        <strong>${costoTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</strong>) en un único pago, dejando el turno al día.
      </p>
    </div>
  );
}

function DetalleInformal({ datosFormulario, actualizarDatos }) {
  const costoTotal = Number(datosFormulario?.monto_a_cobrar) || 0;
  const entregaInicial = Number(datosFormulario?.entrega_inicial) || 0;
  const saldoPendiente = Math.max(0, costoTotal - entregaInicial);

  const manejarCambioEntrega = (e) => {
    const val = e.target.value;
    if (typeof actualizarDatos === "function") {
      actualizarDatos((prev) => ({
        ...prev,
        entrega_inicial: val,
        monto_abonado: val,
      }));
    }
  };

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
            value={datosFormulario?.monto_a_cobrar || ""}
            onChange={actualizarDatos}
            placeholder="0.00"
            required
            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500/50 font-medium text-gray-800"
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
            value={datosFormulario?.entrega_inicial || ""}
            onChange={manejarCambioEntrega}
            placeholder="0.00"
            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500/50 font-medium text-gray-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Método de Pago *</label>
          <select
            name="metodo_pago"
            value={datosFormulario?.metodo_pago || "Efectivo"}
            onChange={actualizarDatos}
            className="w-full border border-gray-300 p-2.5 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500/50 font-medium text-gray-800"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta Débito / Crédito</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-gray-200 text-center">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Costo Total</span>
          <span className="text-xs sm:text-sm font-bold text-gray-800">
            ${costoTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Entrega Inicial</span>
          <span className="text-xs sm:text-sm font-bold text-emerald-600">
            ${entregaInicial.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Saldo Pendiente</span>
          <span className="text-xs sm:text-sm font-bold text-amber-600">
            ${saldoPendiente.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </span>
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
          className="px-4 py-2 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium text-xs sm:text-sm cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={ejecutarEliminacion}
          className="px-4 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600 font-semibold text-xs sm:text-sm transition-colors shadow-sm cursor-pointer"
        >
          Sí, Desactivar
        </button>
      </div>
    </Modal>
  );
}
