/** @format */

import { useState, useEffect } from "react";
import api from "../../../services/api";
import Modal from "../../../components/common/Modal";
import {
  Plus,
  X,
  CheckSquare,
  UserPlus,
  ChevronDown,
  UserRoundX,
  XCircle,
  BanknoteArrowDown,
  CalendarDays,
} from "lucide-react";
import { formatDateTimeInput } from "../../../utils";

export function FormularioCrearEditar({
  modalAbierto,
  cerrarModal,
  editando,
  pacientes,
  setPacientes,
  datosFormulario,
  actualizarDatos,
  setDatosFormulario,
  guardarTurno,
  abrirParaAtender,
  abrirParaCancelar,
  abrirParaInasistente,
  abrirModalCobrarDesdeEdicion, // Prop opcional para cobrar
  abrirParaReprogramar,
}) {
  const [modalPacienteRapidoAbierto, setModalPacienteRapidoAbierto] = useState(false);
  const [datosPacienteRapido, setDatosPacienteRapido] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
  });

  // Estado local para el menú desplegable de acciones rápidas dentro del modal
  const [menuAccionesAbierto, setMenuAccionesAbierto] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuAccionesAbierto !== null && !event.target.closest(".menu-acciones-container")) {
        setMenuAccionesAbierto(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuAccionesAbierto]);

  const actualizarDatosPacienteRapido = (e) => {
    const { name, value } = e.target;
    setDatosPacienteRapido((prev) => ({ ...prev, [name]: value }));
  };

  const guardarPacienteRapido = async (e) => {
    e.preventDefault();
    try {
      const respuesta = await api.post("/pacientes", {
        nombre: datosPacienteRapido.nombre.trim(),
        apellido: datosPacienteRapido.apellido.trim(),
        telefono: datosPacienteRapido.telefono.trim(),
        dni: null,
        domicilio: null,
      });

      const nuevoPaciente = respuesta.data.data || respuesta.data;
      const nuevoId = nuevoPaciente.id_paciente;

      if (setPacientes) {
        setPacientes((prev) => [...prev, nuevoPaciente]);
      }

      setDatosFormulario((prev) => ({
        ...prev,
        id_paciente: nuevoId,
      }));

      setDatosPacienteRapido({ nombre: "", apellido: "", telefono: "" });
      setModalPacienteRapidoAbierto(false);
    } catch (error) {
      console.error("Error al crear paciente rápido:", error);
      alert("No se pudo registrar el paciente de forma rápida.");
    }
  };

  // Identificar el estado del turno
  const idEstadoActual = Number(datosFormulario.id_estado);
  const esProgramado = idEstadoActual === 1 || !editando;
  const esAtendido = idEstadoActual === 2;

  return (
    <>
      <form onSubmit={guardarTurno}>
        <Modal
          isOpen={modalAbierto}
          onClose={cerrarModal}
          width="max-w-2xl"
          title={editando ? `Editar Turno #${datosFormulario.id_turno || ""}` : "Agendar Turno Nuevo"}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Paciente */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-700">Paciente *</label>
                <button
                  type="button"
                  onClick={() => setModalPacienteRapidoAbierto(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#2eb086] hover:text-[#259370] bg-[#e8f7f1] px-2.5 py-1 rounded-lg transition-colors"
                  title="Crear paciente rápido"
                >
                  <UserPlus size={14} />
                  <span>+ Nuevo Paciente</span>
                </button>
              </div>
              <select
                name="id_paciente"
                value={datosFormulario.id_paciente || ""}
                onChange={actualizarDatos}
                required
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              >
                <option value="">Seleccione un paciente...</option>
                {pacientes.map((p) => (
                  <option key={p.id_paciente} value={p.id_paciente}>
                    {p.nombre} {p.apellido} - DNI: {p.dni || "S/D"} - Telefono: {p.telefono || "S/D"}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha y Hora de Inicio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Fecha y Hora de Inicio *
              </label>
              <input
                type="datetime-local"
                name="fecha_hora_inicio"
                value={formatDateTimeInput(datosFormulario.fecha_hora_inicio) || ""}
                onChange={actualizarDatos}
                required
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            {/* Duración (Minutos) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Duración (Minutos)</label>
              <select
                name="duracion_minutos"
                value={datosFormulario.duracion_minutos || 30}
                onChange={actualizarDatos}
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos (1 hora)</option>
                <option value={90}>90 minutos (1h 30m)</option>
                <option value={120}>120 minutos (2 horas)</option>
              </select>
            </div>

            {/* Fecha y Hora de Fin (Calculado) */}
            <div className="col-span-1 md:col-span-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Fecha y Hora de Fin (Calculado automáticamente)
              </label>
              <input
                type="datetime-local"
                name="fecha_hora_fin"
                value={datosFormulario.fecha_hora_fin || ""}
                disabled
                className="w-full bg-gray-100 border border-gray-300 p-2 rounded-lg text-sm text-gray-600 cursor-not-allowed font-medium"
              />
            </div>

            {/* Notas / Observaciones */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notas de la Consulta</label>
              <textarea
                name="notas_consulta"
                rows={3}
                placeholder="Observaciones previas, alergias, o detalles del procedimiento..."
                value={datosFormulario.notas_consulta || ""}
                onChange={actualizarDatos}
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-gray-200 my-5" />

          {/* Acciones del Modal */}
          <div className="flex items-center justify-between">
            {/* LÓGICA CONDICIONAL DE ACCIONES SEGÚN EL ESTADO */}
            {editando ? (
              <div className="relative">
                {/* 1. SI ESTÁ PROGRAMADO / PENDIENTE */}
                {esProgramado && (
                  <div className="relative menu-acciones-container">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAccionesAbierto((prev) => !prev);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all"
                    >
                      <span>Estado</span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${
                          menuAccionesAbierto ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Menú Desplegable Flotante hacia arriba */}
                    {menuAccionesAbierto && (
                      <div className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 flex flex-col">
                        <button
                          type="button"
                          onClick={() => {
                            setMenuAccionesAbierto(false);
                            if (abrirParaAtender) abrirParaAtender();
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
                        >
                          <CheckSquare size={16} />
                          <span>Atender Turno</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuAccionesAbierto(false);
                            if (abrirParaReprogramar) abrirParaReprogramar();
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#3B7A94] hover:bg-[#f0f6f9] transition-colors text-left"
                        >
                          <CalendarDays size={16} />
                          <span>Reprogramar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuAccionesAbierto(false);
                            if (abrirParaInasistente) abrirParaInasistente();
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#2b5d73] hover:bg-[#f0f6f9] transition-colors text-left"
                        >
                          <UserRoundX size={16} />
                          <span>Marcar Inasistente</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuAccionesAbierto(false);
                            if (abrirParaCancelar) abrirParaCancelar();
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <XCircle size={16} />
                          <span>Cancelar Turno</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. SI ESTÁ ATENDIDO -> MOSTRAR OPCIÓN DE COBRAR */}
                {esAtendido && (
                  <button
                    type="button"
                    onClick={() => {
                      if (abrirModalCobrarDesdeEdicion) abrirModalCobrarDesdeEdicion();
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all"
                  >
                    <BanknoteArrowDown size={16} />
                    <span>Cobrar</span>
                  </button>
                )}
              </div>
            ) : (
              <div />
            )}

            {/* Botones Estándar de Guardado / Cancelar */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={cerrarModal}
                className="px-4 py-2.5 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] transition-all shadow-sm font-semibold text-sm"
              >
                {editando ? "Guardar Cambios" : "Confirmar Turno"}
              </button>
            </div>
          </div>
        </Modal>
      </form>

      {/* MINI-MODAL: CREAR PACIENTE RÁPIDO */}
      {modalPacienteRapidoAbierto && (
        <Modal
          isOpen={modalPacienteRapidoAbierto}
          onClose={() => setModalPacienteRapidoAbierto(false)}
          width="max-w-md"
          title="Registro Rápido de Paciente"
        >
          <form onSubmit={guardarPacienteRapido}>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={datosPacienteRapido.nombre}
                  onChange={actualizarDatosPacienteRapido}
                  placeholder="Ej: Juan"
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Apellido *</label>
                <input
                  type="text"
                  name="apellido"
                  value={datosPacienteRapido.apellido}
                  onChange={actualizarDatosPacienteRapido}
                  placeholder="Ej: Pérez"
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono *</label>
                <input
                  type="text"
                  name="telefono"
                  value={datosPacienteRapido.telefono}
                  onChange={actualizarDatosPacienteRapido}
                  placeholder="Ej: 3515551234"
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 my-4" />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalPacienteRapidoAbierto(false)}
                className="px-4 py-2 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] font-semibold text-sm transition-colors shadow-sm"
              >
                Guardar y Seleccionar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export function FormularioAtender({
  modalAtenderAbierto,
  cerrarModal,
  turnoSeleccionado,
  datosAtencion,
  setDatosAtencion,
  practicasLista,
  pacientesObrasSociales,
  agregarPracticaAtencion,
  actualizarPracticaAtencion,
  eliminarPracticaAtencion,
  procesarAtencionTurno,
}) {
  return (
    <>
      <form onSubmit={procesarAtencionTurno}>
        <Modal
          isOpen={modalAtenderAbierto}
          onClose={cerrarModal}
          width="max-w-2xl"
          title={`Atender Turno #${turnoSeleccionado?.id_turno} - ${
            turnoSeleccionado?.Paciente
              ? `${turnoSeleccionado.Paciente.nombre}${turnoSeleccionado.Paciente.apellido}`
              : ""
          }`}
        >
          <div className="flex flex-col gap-4">
            <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="w-full flex flex-col gap-1.5">
                <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Precio Base Calculado (Suma de Prácticas)
                </label>
                <div className="relative flex items-center max-w-xs">
                  <span className="absolute left-3.5 text-emerald-700 font-bold text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={datosAtencion.precio_final}
                    onChange={(e) =>
                      setDatosAtencion((prev) => ({
                        ...prev,
                        precio_final: e.target.value === "" ? "" : parseFloat(e.target.value),
                      }))
                    }
                    placeholder="0.00"
                    required
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-emerald-300/80 rounded-xl text-emerald-950 font-bold text-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                  />
                </div>
              </div>
            </div>

            {/* Sección de Prácticas Realizadas */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckSquare size={18} className="text-[#2eb086]" />
                  <h3 className="text-sm font-bold text-gray-800">Prácticas Realizadas y Cobertura</h3>
                </div>
                <button
                  type="button"
                  onClick={agregarPracticaAtencion}
                  className="flex items-center gap-1 text-xs font-semibold text-[#2eb086] hover:text-[#259370] bg-[#e8f7f1] px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  <span>Agregar Práctica</span>
                </button>
              </div>

              {datosAtencion.practicas.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  No se han agregado prácticas todavía. Haga clic en &quot;Agregar Práctica&quot; para
                  registrar los procedimientos.
                </p>
              ) : (
                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                  {datosAtencion.practicas.map((practicaItem, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200"
                    >
                      <select
                        value={practicaItem.id_practica}
                        onChange={(e) => actualizarPracticaAtencion(index, "id_practica", e.target.value)}
                        required
                        className="flex-1 w-full border border-gray-300 p-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
                      >
                        <option value="">Seleccione práctica...</option>
                        {practicasLista.map((p) => (
                          <option key={p.id_practica} value={p.id_practica}>
                            {p.nombre_referencia} ($
                            {Number(p.precio_referencia).toLocaleString("es-AR")})
                          </option>
                        ))}
                      </select>

                      <select
                        value={practicaItem.id_obra_social}
                        onChange={(e) => actualizarPracticaAtencion(index, "id_obra_social", e.target.value)}
                        className="flex-1 w-full border border-gray-300 p-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
                      >
                        <option value="">Particular / Sin Obra Social</option>
                        {pacientesObrasSociales.map((rel) => (
                          <option key={rel.id_obra_social || rel.id} value={rel.id_obra_social}>
                            {rel.ObraSocial?.nombre || `Obra Social #${rel.id_obra_social}`}{" "}
                            {rel.nro_afiliado ? `(Afiliado: ${rel.nro_afiliado})` : ""}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => eliminarPracticaAtencion(index)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-200 transition-colors self-end sm:self-center"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notas de la Consulta */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Notas de la Consulta / Diagnóstico
              </label>
              <textarea
                rows={3}
                value={datosAtencion.notas_consulta}
                onChange={(e) =>
                  setDatosAtencion((prev) => ({
                    ...prev,
                    notas_consulta: e.target.value,
                  }))
                }
                placeholder="Detalles sobre la atención, indicaciones médicas..."
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 my-5" />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={cerrarModal}
              className="px-4 py-2.5 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] transition-all shadow-sm font-semibold text-sm"
            >
              Finalizar y Marcar Atendido
            </button>
          </div>
        </Modal>
      </form>
    </>
  );
}

export function FormularioReprogramar({
  modalReprogramarAbierto,
  cerrarModal,
  turnoSeleccionado,
  datosReprogramacion,
  actualizarDatosReprogramacion,
  procesarReprogramacionTurno,
}) {
  return (
    <form onSubmit={procesarReprogramacionTurno}>
      <Modal
        isOpen={modalReprogramarAbierto}
        onClose={cerrarModal}
        width="max-w-md"
        title={`Reprogramar Turno #${turnoSeleccionado?.id_turno || ""}`}
      >
        <div className="flex flex-col gap-4">
          {/* Fecha y Hora de Inicio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nueva Fecha y Hora de Inicio *
            </label>
            <input
              type="datetime-local"
              name="fecha_hora_inicio"
              value={datosReprogramacion.fecha_hora_inicio || ""}
              onChange={actualizarDatosReprogramacion}
              required
              className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
            />
          </div>

          {/* Duración (Minutos) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Duración (Minutos)</label>
            <select
              name="duracion_minutos"
              value={datosReprogramacion.duracion_minutos || 30}
              onChange={actualizarDatosReprogramacion}
              className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>60 minutos (1 hora)</option>
              <option value={90}>90 minutos (1h 30m)</option>
              <option value={120}>120 minutos (2 horas)</option>
            </select>
          </div>

          {/* Fecha y Hora de Fin (Calculado) */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Nueva Fecha y Hora de Fin (Calculado automáticamente)
            </label>
            <input
              type="datetime-local"
              name="fecha_hora_fin"
              value={datosReprogramacion.fecha_hora_fin || ""}
              disabled
              className="w-full bg-gray-100 border border-gray-300 p-2 rounded-lg text-sm text-gray-600 cursor-not-allowed font-medium"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 my-4" />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={cerrarModal}
            className="px-4 py-2.5 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] transition-all shadow-sm font-semibold text-sm"
          >
            Confirmar Reprogramación
          </button>
        </div>
      </Modal>
    </form>
  );
}

export function FormularioCancelar({
  modalCancelarAbierto,
  cerrarModal,
  turnoSeleccionado,
  inasistente,
  notasCanceladoInasistente,
  setNotasCanceladoInasistente,
  procesarCancelacionTurno,
}) {
  return (
    <>
      <form onSubmit={procesarCancelacionTurno}>
        <Modal
          isOpen={modalCancelarAbierto}
          onClose={cerrarModal}
          width="max-w-2xl"
          title={`${inasistente ? "Inasistencia" : "Cancelación"} del Turno #${turnoSeleccionado?.id_turno} - ${
            turnoSeleccionado?.Paciente
              ? `${turnoSeleccionado.Paciente.nombre}${turnoSeleccionado.Paciente.apellido}`
              : ""
          }`}
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Notas de la {inasistente ? "Inasistencia" : "Cancelacion"}
              </label>
              <textarea
                rows={3}
                value={notasCanceladoInasistente.notas_consulta}
                onChange={(e) =>
                  setNotasCanceladoInasistente((prev) => ({
                    ...prev,
                    notas_consulta: e.target.value,
                  }))
                }
                placeholder={`Detalles sobre la ${inasistente ? "inasistencia" : "cancelación"}...`}
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 my-5" />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={cerrarModal}
              className="px-4 py-2.5 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-white ${inasistente ? "bg-yellow-600 hover:bg-yellow-700" : "bg-red-600 hover:bg-red-700"} transition-all shadow-sm font-semibold text-sm`}
            >
              Finalizar y Marcar {inasistente ? "inasistencia" : "cancelación"}
            </button>
          </div>
        </Modal>
      </form>
    </>
  );
}

export function FormularioEliminar({ modalEliminar, cerrarModal, turnoSeleccionado, ejecutarEliminacion }) {
  return (
    <Modal isOpen={modalEliminar} onClose={cerrarModal} width="max-w-md" title="Eliminar Turno">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">
          ¿Estás seguro de que deseas eliminar el turno{" "}
          <strong className="text-gray-800">#{turnoSeleccionado?.id_turno}</strong> del paciente{" "}
          <strong className="text-gray-800">
            {turnoSeleccionado?.Paciente
              ? `${turnoSeleccionado.Paciente.nombre} ${turnoSeleccionado.Paciente.apellido}`
              : `#${turnoSeleccionado?.id_paciente}`}
          </strong>
          ?
        </p>
      </div>

      <div className="border-t border-gray-200 my-4" />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={cerrarModal}
          className="px-4 py-2 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium text-sm"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={ejecutarEliminacion}
          className="px-4 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600 font-semibold text-sm transition-colors shadow-sm"
        >
          Sí, Eliminar
        </button>
      </div>
    </Modal>
  );
}
