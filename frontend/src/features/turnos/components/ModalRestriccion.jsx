/** @format */

import { useState } from "react";
import { Lock, Trash2, Calendar, Clock } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../../components/common/Modal";
import { validarBloqueoConTurnos } from "../utils/validacionesTurno";

const MOTIVOS_SUGERIDOS = [
  "Vacaciones",
  "Médico / Salud",
  "Trámite personal",
  "Feriado / Asueto",
  "Capacitación / Curso",
  "Consultorio cerrado",
];

export default function ModalRestriccion({
  isOpen,
  onClose,
  rangoFechas, // { inicio: Date, fin: Date }
  onGuardar,
  onEliminar,
  restriccionesExistentes = [],
  turnos = [],
}) {
  const fechaInicioObj = rangoFechas?.inicio || new Date();
  const fechaFinObj = rangoFechas?.fin || fechaInicioObj;

  const esRangoVariosDias =
    fechaInicioObj.toDateString() !== fechaFinObj.toDateString();

  const [todoElDia, setTodoElDia] = useState(esRangoVariosDias);
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("10:00");
  const [motivo, setMotivo] = useState(
    esRangoVariosDias ? "Vacaciones" : "Trámite personal"
  );
  const [motivoPersonalizado, setMotivoPersonalizado] = useState("");
  const [prevRango, setPrevRango] = useState(rangoFechas);

  // Ajustar estado automáticamente cuando cambia el rango seleccionado
  if (rangoFechas !== prevRango) {
    setPrevRango(rangoFechas);
    setTodoElDia(esRangoVariosDias);
    setMotivo(esRangoVariosDias ? "Vacaciones" : "Trámite personal");
    setHoraInicio("08:00");
    setHoraFin("10:00");
    setMotivoPersonalizado("");
  }

  const formatearFechaLocal = (d) => {
    if (!d) return "";
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const formatearRangoTexto = (fechaIniStr, fechaFinStr) => {
    if (!fechaIniStr) return "";
    const fIni = new Date(fechaIniStr + "T00:00:00");
    const fFin = fechaFinStr ? new Date(fechaFinStr + "T00:00:00") : fIni;
    if (fIni.toDateString() === fFin.toDateString()) {
      return fIni.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }
    return `${fIni.toLocaleDateString("es-AR", { day: "numeric", month: "short" })} al ${fFin.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!todoElDia && horaFin <= horaInicio) {
      toast.error("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    const motivoFinal =
      motivo === "Otro"
        ? motivoPersonalizado.trim() || "Bloqueado"
        : motivo;

    const datosRestriccion = {
      fechaInicio: formatearFechaLocal(fechaInicioObj),
      fechaFin: formatearFechaLocal(fechaFinObj),
      todoElDia,
      horaInicio: todoElDia ? null : horaInicio,
      horaFin: todoElDia ? null : horaFin,
      motivo: motivoFinal,
    };

    // Validar si existen turnos asignados activos en el período
    const conflictoConTurnos = validarBloqueoConTurnos(datosRestriccion, turnos);
    if (conflictoConTurnos) {
      toast.error(
        "No se puede bloquear el período: Hay turnos asignados en esa fecha. Debes reprogramarlos o cancelarlos antes de aplicar el bloqueo.",
        { icon: "⚠️", duration: 5000 }
      );
      return;
    }

    onGuardar(datosRestriccion);
  };

  const fechaTexto = esRangoVariosDias
    ? `${fechaInicioObj.toLocaleDateString("es-AR", { day: "numeric", month: "short" })} al ${fechaFinObj.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}`
    : fechaInicioObj.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

  const hayBloqueosExistentes =
    Array.isArray(restriccionesExistentes) && restriccionesExistentes.length > 0;

  // Validación en tiempo real para advertencia en el formulario
  const conflictoConTurnosEnForm =
    !hayBloqueosExistentes && isOpen
      ? validarBloqueoConTurnos(
          {
            fechaInicio: formatearFechaLocal(fechaInicioObj),
            fechaFin: formatearFechaLocal(fechaFinObj),
            todoElDia,
            horaInicio: todoElDia ? null : horaInicio,
            horaFin: todoElDia ? null : horaFin,
          },
          turnos
        )
      : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hayBloqueosExistentes ? "Restricción Activa" : "Bloqueo de Horario / Restricción"}
      width="max-w-md"
    >
      {hayBloqueosExistentes ? (
        /* VISTA DE CONSULTA Y ELIMINACIÓN DE BLOQUEO EXISTENTE */
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {restriccionesExistentes.map((r) => (
              <div
                key={r.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-xs"
              >
                {/* Encabezado: Motivo y Tipo */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-800 text-white rounded-xl shadow-xs">
                      <Lock size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Motivo del bloqueo
                      </span>
                      <span className="text-base font-extrabold text-slate-900">
                        {r.motivo || "Bloqueado"}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                    {r.todoElDia ? "Día Completo" : "Franja Horaria"}
                  </span>
                </div>

                {/* Período y Horario */}
                <div className="bg-white rounded-xl p-3 border border-slate-200/80 flex flex-col gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="font-semibold capitalize">
                      {formatearRangoTexto(r.fechaInicio, r.fechaFin)}
                    </span>
                  </div>
                  {!r.todoElDia && r.horaInicio && r.horaFin && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock size={14} className="text-slate-400 flex-shrink-0" />
                      <span className="font-semibold">
                        {r.horaInicio} a {r.horaFin} hs
                      </span>
                    </div>
                  )}
                </div>

                {/* Botón Eliminar Bloqueo */}
                <button
                  type="button"
                  onClick={() => {
                    onEliminar(r.id);
                    toast.success("Bloqueo eliminado correctamente.");
                    onClose();
                  }}
                  className="mt-1 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Trash2 size={15} />
                  <span>Eliminar Bloqueo</span>
                </button>
              </div>
            ))}
          </div>

          {/* Botón Cerrar */}
          <div className="flex items-center justify-end pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        /* FORMULARIO DE CREACIÓN DE NUEVO BLOQUEO */
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Banner de fecha seleccionada */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-slate-700 text-white rounded-lg">
              <Calendar size={18} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {esRangoVariosDias ? "Período seleccionado" : "Día seleccionado"}
              </span>
              <span className="text-sm font-black text-slate-800 capitalize">
                {fechaTexto}
              </span>
            </div>
          </div>

          {/* Advertencia de Conflicto si hay turnos asignados */}
          {conflictoConTurnosEnForm && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2 shadow-xs">
              <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
              <span className="font-semibold leading-relaxed">
                {conflictoConTurnosEnForm.mensaje}
              </span>
            </div>
          )}

          {/* Tipo de Bloqueo: Día completo o Franja Horaria */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-700">
              Tipo de restricción:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTodoElDia(true)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  todoElDia
                    ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                Día(s) Completo(s)
              </button>
              <button
                type="button"
                onClick={() => setTodoElDia(false)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  !todoElDia
                    ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                Franja Horaria
              </button>
            </div>
          </div>

          {/* Horarios si es franja horaria */}
          {!todoElDia && (
            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                  <Clock size={12} />
                  <span>Desde:</span>
                </label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                  <Clock size={12} />
                  <span>Hasta:</span>
                </label>
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
                  required
                />
              </div>
            </div>
          )}

          {/* Motivo de la Restricción */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700">
              Motivo / Razón del bloqueo:
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
            >
              {MOTIVOS_SUGERIDOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              <option value="Otro">Otro motivo...</option>
            </select>

            {motivo === "Otro" && (
              <input
                type="text"
                placeholder="Especificar motivo (ej: Conferencia)"
                value={motivoPersonalizado}
                onChange={(e) => setMotivoPersonalizado(e.target.value)}
                className="p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 mt-1 focus:outline-none focus:ring-1 focus:ring-slate-700"
                required
              />
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={Boolean(conflictoConTurnosEnForm)}
              className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 ${
                conflictoConTurnosEnForm
                  ? "bg-gray-400 cursor-not-allowed opacity-75"
                  : "bg-slate-800 hover:bg-slate-900 cursor-pointer"
              }`}
            >
              <Lock size={14} />
              <span>Guardar Bloqueo</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
