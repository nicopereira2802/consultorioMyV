/** @format */

import { useState, useEffect } from "react";
import Modal from "../components/Modal";
import api from "../services/api";
import {
  formatFechaTabla,
  formatFechaHoraTabla,
  formatDateTimeInput,
} from "../utils/index";
import {
  CalendarDays,
  Plus,
  Edit,
  Trash2,
  Search,
  Clock,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function GestionTurnos() {
  /* ─── ESTADOS GENERALES ─────────────────────────────────── */
  const [turnos, setTurnos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);

  // Mapeo básico de estados
  const estadosMap = {
    1: { nombre: "Pendiente", color: "bg-amber-50 text-amber-700 border-amber-200/60", icon: Clock },
    2: { nombre: "Confirmado", color: "bg-blue-50 text-blue-700 border-blue-200/60", icon: UserCheck },
    3: { nombre: "Atendido", color: "bg-emerald-50 text-emerald-700 border-emerald-200/60", icon: CheckCircle2 },
    4: { nombre: "Cancelado", color: "bg-red-50 text-red-700 border-red-200/60", icon: XCircle },
  };

  /* ─── ESTADOS DEL MODAL Y FORMULARIO ─────────────────────── */
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [editando, setEditando] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);

  const [datosFormulario, setDatosFormulario] = useState({
    id_paciente: "",
    id_estado: 1,
    fecha_hora_inicio: "",
    fecha_hora_fin: "",
    duracion_minutos: 30,
    precio_final: 0,
    notas_consulta: "",
  });

  /* ─── USE-EFFECTS ─────────────────────────────────── */
  useEffect(() => {
    buscarTurnos();
    buscarPacientes();
  }, []);

  // Cálculo automático de fecha_hora_fin
  useEffect(() => {
    if (datosFormulario.fecha_hora_inicio && datosFormulario.duracion_minutos) {
      calcularHoraFin(
        datosFormulario.fecha_hora_inicio,
        datosFormulario.duracion_minutos
      );
    }
  }, [datosFormulario.fecha_hora_inicio, datosFormulario.duracion_minutos]);

  /* ─── PETICIONES API ─────────────────────────────────── */
  const buscarTurnos = async () => {
    setCargando(true);
    try {
      const respuesta = await api.get("/turnos");
      setTurnos(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar turnos:", error);
    } finally {
      setCargando(false);
    }
  };

  const buscarPacientes = async () => {
    try {
      const respuesta = await api.get("/pacientes");
      setPacientes(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
    }
  };

  /* ─── CÁLCULO DE FECHA FIN ───────────────────────────────── */
  const calcularHoraFin = (fecha_inicio, duracion_minutos) => {
    const inicio = new Date(fecha_inicio);
    const minutos = parseInt(duracion_minutos, 10);

    if (!isNaN(inicio.getTime()) && !isNaN(minutos)) {
      const fin = new Date(inicio.getTime() + minutos * 60000);
      const isoFin = new Date(fin.getTime() - fin.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      setDatosFormulario((prev) => ({
        ...prev,
        fecha_hora_fin: isoFin,
      }));
    }
  };

  /* ─── MANEJO DE MODALES ─────────────────────────────────── */
  const modalCreando = () => {
    setEditando(false);
    setDatosFormulario({
      id_paciente: "",
      id_estado: 1,
      fecha_hora_inicio: "",
      fecha_hora_fin: "",
      duracion_minutos: 30,
      precio_final: 0,
      notas_consulta: "",
    });
    setModalAbierto(true);
  };

  const modalEditando = (turno) => {
    setEditando(true);
    setTurnoSeleccionado(turno);
    setDatosFormulario({
      ...turno,
      fecha_hora_inicio: formatDateTimeInput(turno.fecha_hora_inicio),
      fecha_hora_fin: formatDateTimeInput(turno.fecha_hora_fin),
      duracion_minutos: turno.duracion_minutos || 30,
    });
    setModalAbierto(true);
  };

  const confirmarEliminar = (turno) => {
    setTurnoSeleccionado(turno);
    setModalEliminar(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModalEliminar(false);
    setTurnoSeleccionado(null);
    setDatosFormulario({
      id_paciente: "",
      id_estado: 1,
      fecha_hora_inicio: "",
      fecha_hora_fin: "",
      duracion_minutos: 30,
      precio_final: 0,
      notas_consulta: "",
    });
  };

  /* ─── CAMPOS FORMULARIO ─────────────────────────────────── */
  const actualizarDatos = (e) => {
    const { name, value } = e.target;
    setDatosFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ─── GUARDAR / EDITAR TURNO ─────────────────────────────── */
  const procesarFormulario = async (e) => {
    e.preventDefault();

    if (!datosFormulario.id_paciente) {
      alert("Por favor seleccione un paciente.");
      return;
    }

    try {
      const { duracion_minutos, ...restoDatos } = datosFormulario;

      const payload = {
        ...restoDatos,
        id_paciente: Number(restoDatos.id_paciente),
        id_estado: Number(restoDatos.id_estado),
        precio_final: parseFloat(restoDatos.precio_final),
        fecha_hora_inicio: new Date(restoDatos.fecha_hora_inicio).toISOString(),
        fecha_hora_fin: new Date(restoDatos.fecha_hora_fin).toISOString(),
        notas_consulta: restoDatos.notas_consulta?.trim() || "",
      };

      if (editando) {
        await api.put(`/turnos/${turnoSeleccionado.id_turno}`, payload);
      } else {
        await api.post("/turnos", payload);
      }

      buscarTurnos();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar el turno:", error);
      if (error.response?.status === 409) {
        alert("El horario seleccionado se superpone con otro turno existente.");
      } else {
        alert("Ocurrió un error al procesar el turno.");
      }
    }
  };

  /* ─── ELIMINAR TURNO (DELETE) ────────────────────────────── */
  const ejecutarEliminacion = async () => {
    if (!turnoSeleccionado) return;
    try {
      await api.delete(`/turnos/${turnoSeleccionado.id_turno}`);
      buscarTurnos();
      cerrarModal();
    } catch (error) {
      console.error("Error al eliminar turno:", error);
      alert("No se pudo eliminar el turno.");
    }
  };

  /* ─── FILTRADO EN VIVO ──────────────────────────────────── */
  const turnosFiltrados = turnos.filter((t) => {
    const termino = busqueda.toLowerCase();
    const nombrePaciente = t.Paciente
      ? `${t.Paciente.nombre} ${t.Paciente.apellido}`.toLowerCase()
      : "";
    const dniPaciente = t.Paciente?.dni ? String(t.Paciente.dni) : "";
    const notas = t.notas_consulta?.toLowerCase() || "";

    return (
      nombrePaciente.includes(termino) ||
      dniPaciente.includes(termino) ||
      notas.includes(termino)
    );
  });

  return (
    <div className="w-full flex-1 flex flex-col gap-4">
      {/* ─── CABECERA PRINCIPAL ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#e8f7f1] text-[#2eb086] flex items-center justify-center shrink-0 shadow-sm">
            <CalendarDays size={24} />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                Gestión de Turnos
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f7f1] text-[#2eb086] border border-[#2eb086]/20">
                {turnos.length} Registrados
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">
              Listado general y administración de turnos del consultorio
            </p>
          </div>
        </div>

        {/* Botón Nuevo Turno */}
        <button
          type="button"
          onClick={modalCreando}
          className="flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0"
        >
          <Plus size={18} />
          <span>Agendar Turno</span>
        </button>
      </div>

      {/* ─── BARRA DE BÚSQUEDA Y FILTROS ───────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar por paciente, DNI o nota..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all"
          />
        </div>
      </div>

      {/* ─── TABLA DE TURNOS ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Precio ($)</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Notas</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {cargando ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    Cargando turnos...
                  </td>
                </tr>
              ) : turnosFiltrados.length > 0 ? (
                turnosFiltrados.map((turno) => {
                  const estadoInfo = estadosMap[turno.id_estado] || {
                    nombre: "Desconocido",
                    color: "bg-gray-100 text-gray-600 border-gray-200",
                    icon: AlertCircle,
                  };
                  const IconoEstado = estadoInfo.icon;

                  return (
                    <tr
                      key={turno.id_turno}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      {/* ID */}
                      <td className="px-6 py-4 font-semibold text-gray-500 w-16">
                        #{turno.id_turno}
                      </td>

                      {/* Paciente */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#e8f7f1] text-[#2eb086] flex items-center justify-center font-bold text-sm shrink-0">
                            {turno.Paciente?.nombre?.charAt(0) || "P"}
                            {turno.Paciente?.apellido?.charAt(0) || ""}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800">
                              {turno.Paciente
                                ? `${turno.Paciente.nombre} ${turno.Paciente.apellido}`
                                : `Paciente #${turno.id_paciente}`}
                            </span>
                            {turno.Paciente?.dni && (
                              <span className="text-xs text-gray-400">
                                DNI: {turno.Paciente.dni}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Fecha y Hora */}
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {formatFechaHoraTabla(turno.fecha_hora_inicio)}
                      </td>

                      {/* Precio */}
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        ${Number(turno.precio_final).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${estadoInfo.color}`}
                        >
                          <IconoEstado size={14} />
                          <span>{estadoInfo.nombre}</span>
                        </span>
                      </td>

                      {/* Notas */}
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                        {turno.notas_consulta || (
                          <span className="text-gray-300 italic">Sin notas</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => modalEditando(turno)}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Editar Turno"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmarEliminar(turno)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Eliminar Turno"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="py-12 text-center text-gray-400 font-medium"
                  >
                    No se encontraron turnos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL CREAR / EDITAR TURNO ─────────────────────────── */}
      {modalAbierto && (
        <form onSubmit={procesarFormulario}>
          <Modal
            isOpen={modalAbierto}
            onClose={cerrarModal}
            width="max-w-2xl"
            title={editando ? "Editar Turno" : "Agendar Nuevo Turno"}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Paciente */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Paciente *
                </label>
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
                      {p.nombre} {p.apellido} - DNI: {p.dni || "S/D"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Estado *
                </label>
                <select
                  name="id_estado"
                  value={datosFormulario.id_estado || 1}
                  onChange={actualizarDatos}
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                >
                  <option value={1}>Pendiente</option>
                  <option value={2}>Confirmado</option>
                  <option value={3}>Atendido</option>
                  <option value={4}>Cancelado</option>
                </select>
              </div>

              {/* Precio Final */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Precio Final ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="precio_final"
                  value={datosFormulario.precio_final}
                  onChange={actualizarDatos}
                  placeholder="Ej: 15000.00"
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                />
              </div>

              {/* Fecha y Hora Inicio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Fecha y Hora de Inicio *
                </label>
                <input
                  type="datetime-local"
                  name="fecha_hora_inicio"
                  value={datosFormulario.fecha_hora_inicio || ""}
                  onChange={actualizarDatos}
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                />
              </div>

              {/* Duración en minutos */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Duración
                </label>
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

              {/* Fecha y Hora Fin (Calculada) */}
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

              {/* Notas de la Consulta */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Notas / Motivo de Consulta
                </label>
                <textarea
                  name="notas_consulta"
                  rows={3}
                  value={datosFormulario.notas_consulta || ""}
                  onChange={actualizarDatos}
                  placeholder="Detalles sobre la atención, procedimiento a realizar..."
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                />
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-gray-200 my-5" />

            {/* Acciones */}
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
                {editando ? "Guardar Cambios" : "Confirmar Turno"}
              </button>
            </div>
          </Modal>
        </form>
      )}

      {/* ─── MODAL CONFIRMAR ELIMINACIÓN ─────────────────────────── */}
      {modalEliminar && (
        <Modal
          isOpen={modalEliminar}
          onClose={cerrarModal}
          width="max-w-md"
          title="Eliminar Turno"
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que deseas eliminar el turno{" "}
              <strong className="text-gray-800">
                #{turnoSeleccionado?.id_turno}
              </strong>{" "}
              del paciente{" "}
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
      )}
    </div>
  );
}