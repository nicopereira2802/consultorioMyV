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
  CalendarDays,
} from "lucide-react";
import { formatDateTimeInput } from "../../../utils";
import toast from "react-hot-toast";
import { manejarErrorApi } from "../../../utils/errorHandler";
import InputFiltro from "../../../components/common/InputFiltro";
import { verificarSolapamientoConRestricciones } from "../hooks/useRestricciones";
import { verificarSolapamientoTurnos } from "../utils/validacionesTurno";

export function FormularioCrearEditar({
  modalAbierto,
  cerrarModal,
  editando,
  turnos = [],
  pacientes = [],
  setPacientes,
  datosFormulario,
  actualizarDatos,
  guardarTurno,
  procesarFormulario,
  abrirParaAtender,
  abrirModalAtenderDesdeEdicion,
  abrirParaCancelar,
  abrirModalCancelarDesdeEdicion,
  abrirParaInasistente,
  abrirModalInasistenteDesdeEdicion,
  abrirParaReprogramar,
  abrirModalReprogramarDesdeEdicion,
}) {
  const [modalPacienteRapidoAbierto, setModalPacienteRapidoAbierto] = useState(false);
  const [datosPacienteRapido, setDatosPacienteRapido] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
  });

    const [pacienteNuevo, setPacienteNuevo] = useState(null);

  const [menuAccionesAbierto, setMenuAccionesAbierto] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuAccionesAbierto && !event.target.closest(".menu-acciones-container")) {
        setMenuAccionesAbierto(false);
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
      setPacienteNuevo(nuevoPaciente);

      if (typeof setPacientes === "function") {
        setPacientes((prev) => [...prev, nuevoPaciente]);
      }

      if (typeof actualizarDatos === "function") {
        actualizarDatos({
          target: { name: "id_paciente", value: nuevoId },
        });
      }

      toast.success("Paciente creado correctamente");
      setDatosPacienteRapido({ nombre: "", apellido: "", telefono: "" });
      setModalPacienteRapidoAbierto(false);
    } catch (error) {
      console.error("Error al crear paciente rápido:", error);
      manejarErrorApi(error, "No se pudo crear el paciente.");
    }
  };

  const idEstadoActual = Number(datosFormulario?.id_estado);
  const esProgramado = idEstadoActual === 1 || !editando;

  const conflictoRestriccion = !editando && datosFormulario?.fecha_hora_inicio
    ? verificarSolapamientoConRestricciones(
        datosFormulario.fecha_hora_inicio,
        datosFormulario.duracion_minutos || 30
      )
    : null;

  const conflictoTurnoSolapamiento = datosFormulario?.fecha_hora_inicio
    ? verificarSolapamientoTurnos(
        datosFormulario.fecha_hora_inicio,
        new Date(
          new Date(datosFormulario.fecha_hora_inicio).getTime() +
            (Number(datosFormulario.duracion_minutos) || 30) * 60000
        ),
        editando ? datosFormulario?.id_turno : null,
        turnos
      )
    : null;

  const onAtender = abrirParaAtender || abrirModalAtenderDesdeEdicion;
  const onCancelar = abrirParaCancelar || abrirModalCancelarDesdeEdicion;
  const onInasistente = abrirParaInasistente || abrirModalInasistenteDesdeEdicion;
  const onReprogramar = abrirParaReprogramar || abrirModalReprogramarDesdeEdicion;

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (conflictoRestriccion) {
      toast.error(conflictoRestriccion.mensaje, { icon: "🔒" });
      return;
    }
    if (conflictoTurnoSolapamiento) {
      toast.error(conflictoTurnoSolapamiento.mensaje);
      return;
    }
    const accion = guardarTurno || procesarFormulario;
    if (typeof accion === "function") {
      if (accion.length >= 2) {
        accion(datosFormulario, editando, datosFormulario);
      } else {
        accion(e);
      }
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
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
              <InputFiltro
                datos={pacientes}
                camposFiltrado={["nombre", "apellido", "dni", "telefono", "domicilio"]}
                formatoVisual={(p) =>
                  `${p.nombre} ${p.apellido} (DNI: ${p.dni || "S/D"} - Tel: ${p.telefono || "S/D"})`
                }
                placeholder="Busca un paciente..."
                                alSeleccionar={(p) => {
                  setPacienteNuevo(null);
                  actualizarDatos({ target: { name: "id_paciente", value: p.id_paciente } });
                }}
                valorInicial={
                  pacienteNuevo &&
                  String(pacienteNuevo.id_paciente) === String(datosFormulario.id_paciente)
                    ? pacienteNuevo
                    : datosFormulario.id_paciente || ""
                }
              />
            </div>

            {/* Fecha y Hora de Inicio */}
            {!editando && (
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
            )}

            {/* Duración (Minutos) */}
            {!editando && (
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
            )}

            {/* Fecha y Hora de Fin (Calculado) */}
            {!editando && (
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
            )}

            {/* Aviso de Conflicto con Restricción / Bloqueo */}
            {conflictoRestriccion && (
              <div className="col-span-1 md:col-span-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <span className="text-base flex-shrink-0">🔒</span>
                <span className="font-semibold">{conflictoRestriccion.mensaje}</span>
              </div>
            )}

            {/* Aviso de Conflicto por Solapamiento con otro turno */}
            {conflictoTurnoSolapamiento && (
              <div className="col-span-1 md:col-span-2 p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                <span className="text-base flex-shrink-0">⚠️</span>
                <span className="font-semibold">{conflictoTurnoSolapamiento.mensaje}</span>
              </div>
            )}

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

          <div className="border-t border-gray-200 my-5" />

          {/* Acciones del Modal */}
          <div className={`flex items-center ${editando ? "justify-between" : "justify-end"}`}>
            {editando && esProgramado && (
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

                {menuAccionesAbierto && (
                  <div className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 flex flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuAccionesAbierto(false);
                        if (onAtender) onAtender();
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
                        if (onReprogramar) onReprogramar();
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
                        if (onInasistente) onInasistente();
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
                        if (onCancelar) onCancelar();
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
                disabled={Boolean(conflictoRestriccion || conflictoTurnoSolapamiento)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                  conflictoRestriccion || conflictoTurnoSolapamiento
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "text-white bg-[#2eb086] hover:bg-[#259370]"
                }`}
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
  practicasLista = [],
  pacientesObrasSociales = [],
  agregarPracticaAtencion,
  actualizarPracticaAtencion,
  actualizarDatosAtencion,
  eliminarPracticaAtencion,
  procesarAtencionTurno,
}) {
  const nombrePaciente = turnoSeleccionado?.Paciente
    ? ` - ${turnoSeleccionado.Paciente.nombre} ${turnoSeleccionado.Paciente.apellido}`
    : "";

  return (
    <form onSubmit={procesarAtencionTurno}>
      <Modal
        isOpen={modalAtenderAbierto}
        onClose={cerrarModal}
        width="max-w-2xl"
        title={`Atender Turno #${turnoSeleccionado?.id_turno || ""}${nombrePaciente}`}
      >
        <div className="flex flex-col gap-4">
          <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="w-full flex flex-col gap-1.5">
              <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Monto a Cobrar / Precio Final
              </label>
              <div className="relative flex items-center max-w-xs">
                <span className="absolute left-3.5 text-emerald-700 font-bold text-sm">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={datosAtencion?.precio_final ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^[0-9]*[.,]?[0-9]*$/.test(val)) {
                      actualizarDatosAtencion("precio_final", val);
                    }
                  }}
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

            {(!Array.isArray(datosAtencion?.practicas) || datosAtencion.practicas.length === 0) ? (
              <p className="text-xs text-gray-400 italic">
                No se han agregado prácticas todavía. Haga clic en &quot;Agregar Práctica&quot; para
                registrar los procedimientos.
              </p>
            ) : (
              <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                {(Array.isArray(datosAtencion?.practicas) ? datosAtencion.practicas : []).map((practicaItem, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200"
                  >
                    <div className="flex-1 w-full">
                      <InputFiltro
                        datos={practicasLista}
                        camposFiltrado={[
                          "codigo_nomenclador",
                          "nombre_nomenclador",
                          "nombre_referencia",
                          "especialidad",
                        ]}
                        formatoVisual={(p) =>
                          `${p.nombre_referencia || p.nombre_nomenclador} ($ ${Number(p.precio_referencia || 0).toLocaleString("es-AR")})`
                        }
                        placeholder="Busca una práctica..."
                        alSeleccionar={(p) =>
                          actualizarPracticaAtencion(index, "id_practica", p.id_practica)
                        }
                        valorInicial={practicaItem.id_practica || ""}
                      />
                    </div>

                    <div className="flex-1 w-full">
                      <InputFiltro
                        datos={pacientesObrasSociales}
                        camposFiltrado={["nombre"]}
                        formatoVisual={(rel) =>
                          `${rel.ObraSocial?.nombre || `Obra Social #${rel.id_obra_social}`} ${
                            rel.nro_afiliado ? `(Afiliado: ${rel.nro_afiliado})` : ""
                          }`
                        }
                        placeholder="Busca una obra social..."
                        alSeleccionar={(os) =>
                          actualizarPracticaAtencion(index, "id_obra_social", os.id_obra_social)
                        }
                        valorInicial={practicaItem.id_obra_social || ""}
                        defaultValue="Particular / Sin Obra Social"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => eliminarPracticaAtencion(index)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-200 transition-colors self-end sm:self-center"
                      title="Eliminar práctica"
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
              value={datosAtencion?.notas_consulta || ""}
              onChange={(e) =>
                actualizarDatosAtencion("notas_consulta", e.target.value)
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
  );
}

export function FormularioReprogramar({
  modalReprogramarAbierto,
  cerrarModal,
  turnoSeleccionado,
  datosReprogramacion,
  actualizarDatosReprogramacion,
  procesarReprogramacionTurno,
  turnos = [],
}) {
  const conflictoRestriccionReprog = datosReprogramacion?.fecha_hora_inicio
    ? verificarSolapamientoConRestricciones(
        datosReprogramacion.fecha_hora_inicio,
        datosReprogramacion.duracion_minutos || 30
      )
    : null;

  const conflictoTurnoReprog = datosReprogramacion?.fecha_hora_inicio
    ? verificarSolapamientoTurnos(
        datosReprogramacion.fecha_hora_inicio,
        new Date(
          new Date(datosReprogramacion.fecha_hora_inicio).getTime() +
            (Number(datosReprogramacion.duracion_minutos) || 30) * 60000
        ),
        turnoSeleccionado?.id_turno,
        turnos
      )
    : null;

  const handleReprogramarSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (conflictoRestriccionReprog) {
      toast.error(conflictoRestriccionReprog.mensaje, { icon: "🔒" });
      return;
    }
    if (conflictoTurnoReprog) {
      toast.error(conflictoTurnoReprog.mensaje);
      return;
    }
    if (typeof procesarReprogramacionTurno === "function") {
      procesarReprogramacionTurno(e);
    }
  };

  return (
    <form onSubmit={handleReprogramarSubmit}>
      <Modal
        isOpen={modalReprogramarAbierto}
        onClose={cerrarModal}
        width="max-w-md"
        title={`Reprogramar Turno #${turnoSeleccionado?.id_turno || ""}`}
      >
        <div className="flex flex-col gap-4">
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

          {/* Aviso de Conflicto con Restricción */}
          {conflictoRestriccionReprog && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <span className="text-base flex-shrink-0">🔒</span>
              <span className="font-semibold">{conflictoRestriccionReprog.mensaje}</span>
            </div>
          )}

          {/* Aviso de Conflicto por Solapamiento con otro turno */}
          {conflictoTurnoReprog && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center gap-2">
              <span className="text-base flex-shrink-0">⚠️</span>
              <span className="font-semibold">{conflictoTurnoReprog.mensaje}</span>
            </div>
          )}
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
            disabled={Boolean(conflictoRestriccionReprog || conflictoTurnoReprog)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
              conflictoRestriccionReprog || conflictoTurnoReprog
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "text-white bg-[#2eb086] hover:bg-[#259370]"
            }`}
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
  actualizarDatosCancelacion,
  procesarCancelacionTurno,
}) {
  const nombrePaciente = turnoSeleccionado?.Paciente
    ? ` - ${turnoSeleccionado.Paciente.nombre} ${turnoSeleccionado.Paciente.apellido}`
    : "";

  return (
    <form onSubmit={procesarCancelacionTurno}>
      <Modal
        isOpen={modalCancelarAbierto}
        onClose={cerrarModal}
        width="max-w-2xl"
        title={`${inasistente ? "Inasistencia" : "Cancelación"} del Turno #${turnoSeleccionado?.id_turno || ""}${nombrePaciente}`}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Notas de la {inasistente ? "Inasistencia" : "Cancelación"}
            </label>
            <textarea
              rows={3}
              value={notasCanceladoInasistente.notas_consulta || ""}
              onChange={(e) =>
                actualizarDatosCancelacion("notas_consulta", e.target.value)
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
            className={`px-5 py-2.5 rounded-xl text-white ${
              inasistente ? "bg-yellow-600 hover:bg-yellow-700" : "bg-red-600 hover:bg-red-700"
            } transition-all shadow-sm font-semibold text-sm`}
          >
            Finalizar y Marcar {inasistente ? "Inasistencia" : "Cancelación"}
          </button>
        </div>
      </Modal>
    </form>
  );
}

export function FormularioEliminar({
  modalEliminar,
  cerrarModal,
  turnoSeleccionado,
  ejecutarEliminacion,
}) {
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