/** @format */

import { useState, useEffect } from "react";
import Modal from "../components/Modal";
import api from "../services/api";
import { formatFechaTabla, formatFechaInput } from "../utils/index";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  ShieldPlus,
  X,
  CreditCard,
  Phone,
  UserCheck,
} from "lucide-react";

export default function GestionPacientes() {
  /* ─── ESTADOS GENERALES ─────────────────────────────────── */
  const [pacientes, setPacientes] = useState([]);
  const [obrasSocialesLista, setObrasSocialesLista] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);

  /* ─── ESTADOS DEL MODAL Y FORMULARIO ─────────────────────── */
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [editando, setEditando] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);

  /* 
    Formulario del paciente con sub-lista dinámica para manejar
    la relación N:M con PacienteObraSocial
  */
  const [datosFormulario, setDatosFormulario] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    fecha_nacimiento: "",
    telefono: "",
    domicilio: "",
    obrasSociales: [], // Array de objetos { id_obra_social, nro_afiliado }
  });

  /* ─── USE-EFFECTS ─────────────────────────────────── */
  useEffect(() => {
    buscarPacientes();
    buscarObrasSociales();
  }, []);

  /* ─── PETICIONES API ─────────────────────────────────── */
  const buscarPacientes = async () => {
    setCargando(true);
    try {
      const respuesta = await api.get("/pacientes");
      setPacientes(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
    } finally {
      setCargando(false);
    }
  };

  const buscarObrasSociales = async () => {
    try {
      const respuesta = await api.get("/obras-sociales");
      setObrasSocialesLista(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar catálogo de obras sociales:", error);
    }
  };

  /* ─── MANEJO DE MODALES ─────────────────────────────────── */
  const modalCreando = () => {
    setEditando(false);
    setDatosFormulario({
      nombre: "",
      apellido: "",
      dni: "",
      fecha_nacimiento: "",
      telefono: "",
      domicilio: "",
      obrasSociales: [],
    });
    setModalAbierto(true);
  };

  const modalEditando = async (paciente) => {
    setEditando(true);
    setPacienteSeleccionado(paciente);

    // Cargar las obras sociales asociadas a este paciente si existen
    let obrasSocialesPaciente = [];
    try {
      const resOS = await api.get("/pacientes-por-obras-sociales");
      const todasLasOS = resOS.data.data || [];
      obrasSocialesPaciente = todasLasOS.filter(
        (item) => Number(item.id_paciente) === Number(paciente.id_paciente)
      );
    } catch (err) {
      console.error("Error al obtener obras sociales del paciente:", err);
    }

    setDatosFormulario({
      ...paciente,
      fecha_nacimiento: formatFechaInput(paciente.fecha_nacimiento),
      obrasSociales: obrasSocialesPaciente.map((os) => ({
        id_obra_social: os.id_obra_social,
        nro_afiliado: os.nro_afiliado,
        id_relacion: os.id, // Si tu backend usa ID único para la relación
      })),
    });

    setModalAbierto(true);
  };

  const confirmarEliminar = (paciente) => {
    setPacienteSeleccionado(paciente);
    setModalEliminar(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModalEliminar(false);
    setPacienteSeleccionado(null);
    setDatosFormulario({
      nombre: "",
      apellido: "",
      dni: "",
      fecha_nacimiento: "",
      telefono: "",
      domicilio: "",
      obrasSociales: [],
    });
  };

  /* ─── CAMPOS FORMULARIO PACIENTE ─────────────────────────── */
  const actualizarDatos = (e) => {
    const { name, value } = e.target;
    setDatosFormulario((prev) => ({ ...prev, [name]: value }));
  };

  /* ─── MANEJO DINÁMICO DE OBRAS SOCIALES ───────────────────── */
  const agregarObraSocialForm = () => {
    setDatosFormulario((prev) => ({
      ...prev,
      obrasSociales: [
        ...prev.obrasSociales,
        { id_obra_social: "", nro_afiliado: "" },
      ],
    }));
  };

  const actualizarObraSocialForm = (index, campo, valor) => {
    setDatosFormulario((prev) => {
      const nuevasOS = [...prev.obrasSociales];
      nuevasOS[index][campo] = valor;
      return { ...prev, obrasSociales: nuevasOS };
    });
  };

  const eliminarObraSocialForm = (index) => {
    setDatosFormulario((prev) => ({
      ...prev,
      obrasSociales: prev.obrasSociales.filter((_, i) => i !== index),
    }));
  };

  /* ─── GUARDAR / EDITAR PACIENTE ──────────────────────────── */
  const procesarFormulario = async (e) => {
    e.preventDefault();

    try {
      const payloadPaciente = {
        nombre: datosFormulario.nombre.trim(),
        apellido: datosFormulario.apellido.trim(),
        dni: datosFormulario.dni ? datosFormulario.dni.trim() : null,
        fecha_nacimiento: datosFormulario.fecha_nacimiento || null,
        telefono: datosFormulario.telefono.trim(),
        domicilio: datosFormulario.domicilio
          ? datosFormulario.domicilio.trim()
          : null,
      };

      let idPacienteGuardado = datosFormulario.id_paciente;

      if (editando) {
        await api.put(`/pacientes/${idPacienteGuardado}`, payloadPaciente);
      } else {
        const resCrear = await api.post("/pacientes", payloadPaciente);
        idPacienteGuardado = resCrear.data.data?.id_paciente || resCrear.data.id_paciente;
      }

      // Procesar asignación de obras sociales si se seleccionaron
      if (datosFormulario.obrasSociales.length > 0 && idPacienteGuardado) {
        for (const os of datosFormulario.obrasSociales) {
          if (os.id_obra_social && os.nro_afiliado) {
            try {
              await api.post("/pacientes-por-obras-sociales", {
                id_paciente: Number(idPacienteGuardado),
                id_obra_social: Number(os.id_obra_social),
                nro_afiliado: os.nro_afiliado.trim(),
              });
            } catch (errOS) {
              // Si ya existía la relación en edición, ignoramos duplicado
              console.warn("Aviso al guardar obra social:", errOS);
            }
          }
        }
      }

      buscarPacientes();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar el paciente:", error);
      alert("Ocurrió un error al intentar guardar los datos del paciente.");
    }
  };

  /* ─── ELIMINAR PACIENTE (SOFT DELETE) ────────────────────── */
  const ejecutarEliminacion = async () => {
    if (!pacienteSeleccionado) return;
    try {
      await api.patch(`/pacientes/${pacienteSeleccionado.id_paciente}/delete`);
      buscarPacientes();
      cerrarModal();
    } catch (error) {
      console.error("Error al borrar paciente:", error);
      alert("No se pudo desactivar el paciente.");
    }
  };

  /* ─── FILTRADO EN VIVO POR NOMBRE/DNI ─────────────────────── */
  const pacientesFiltrados = pacientes.filter((p) => {
    const termino = busqueda.toLowerCase();
    const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
    const dni = p.dni ? String(p.dni) : "";
    return nombreCompleto.includes(termino) || dni.includes(termino);
  });

  return (
    <div className="w-full flex-1 flex flex-col gap-4">
      {/* ─── CABECERA PRINCIPAL ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#e8f7f1] text-[#2eb086] flex items-center justify-center shrink-0 shadow-sm">
            <Users size={24} />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                Gestión de Pacientes
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f7f1] text-[#2eb086] border border-[#2eb086]/20">
                {pacientes.length} Registrados
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">
              Administración de historias clínicas, datos personales y coberturas
            </p>
          </div>
        </div>

        {/* Botón de Agregar Paciente */}
        <button
          type="button"
          onClick={modalCreando}
          className="flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0"
        >
          <Plus size={18} />
          <span>Nuevo Paciente</span>
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
            placeholder="Buscar por nombre, apellido o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all"
          />
        </div>
      </div>

      {/* ─── TABLA DE PACIENTES ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">DNI</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4">F. Nacimiento</th>
                <th className="px-6 py-4">Domicilio</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    Cargando listado de pacientes...
                  </td>
                </tr>
              ) : pacientesFiltrados.length > 0 ? (
                pacientesFiltrados.map((paciente) => (
                  <tr
                    key={paciente.id_paciente}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Nombre y Apellido */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#e8f7f1] text-[#2eb086] flex items-center justify-center font-bold text-sm shrink-0">
                          {paciente.nombre?.charAt(0)}
                          {paciente.apellido?.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">
                            {paciente.nombre} {paciente.apellido}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* DNI */}
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {paciente.dni || <span className="text-gray-400 italic">S/D</span>}
                    </td>

                    {/* Teléfono */}
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-gray-400" />
                        <span>{paciente.telefono}</span>
                      </div>
                    </td>

                    {/* Fecha Nacimiento */}
                    <td className="px-6 py-4 text-gray-600">
                      {formatFechaTabla(paciente.fecha_nacimiento)}
                    </td>

                    {/* Domicilio */}
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                      {paciente.domicilio || (
                        <span className="text-gray-400 italic">S/D</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => modalEditando(paciente)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar Paciente"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmarEliminar(paciente)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Desactivar Paciente"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="py-12 text-center text-gray-400 font-medium"
                  >
                    No se encontraron pacientes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL CREAR / EDITAR PACIENTE ─────────────────────────── */}
      {modalAbierto && (
        <form onSubmit={procesarFormulario}>
          <Modal
            isOpen={modalAbierto}
            onClose={cerrarModal}
            width="max-w-2xl"
            title={editando ? "Editar Paciente" : "Registrar Nuevo Paciente"}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={datosFormulario.nombre}
                  onChange={actualizarDatos}
                  placeholder="Ej: Juan"
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                />
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={datosFormulario.apellido}
                  onChange={actualizarDatos}
                  placeholder="Ej: Pérez"
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                />
              </div>

              {/* DNI */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  DNI
                </label>
                <input
                  type="text"
                  name="dni"
                  value={datosFormulario.dni || ""}
                  onChange={actualizarDatos}
                  placeholder="Ej: 38123456"
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Teléfono / Celular *
                </label>
                <input
                  type="text"
                  name="telefono"
                  value={datosFormulario.telefono}
                  onChange={actualizarDatos}
                  placeholder="Ej: 3515551234"
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                />
              </div>

              {/* Fecha de Nacimiento */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={datosFormulario.fecha_nacimiento || ""}
                  onChange={actualizarDatos}
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                />
              </div>

              {/* Domicilio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Domicilio
                </label>
                <input
                  type="text"
                  name="domicilio"
                  value={datosFormulario.domicilio || ""}
                  onChange={actualizarDatos}
                  placeholder="Ej: Av. Colón 1234"
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                />
              </div>

              {/* ─── SECCIÓN: OBRAS SOCIALES (MUCHAS A MUCHAS) ────────────── */}
              <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-[#2eb086]" />
                    <h3 className="text-sm font-bold text-gray-800">
                      Cobertura de Obra Social
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={agregarObraSocialForm}
                    className="flex items-center gap-1 text-xs font-semibold text-[#2eb086] hover:text-[#259370] bg-[#e8f7f1] px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <ShieldPlus size={14} />
                    <span>Agregar Obra Social</span>
                  </button>
                </div>

                {datosFormulario.obrasSociales.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    Sin obras sociales asociadas. El paciente se registrará como Particular.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {datosFormulario.obrasSociales.map((osItem, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200"
                      >
                        {/* Selector de Obra Social */}
                        <select
                          value={osItem.id_obra_social}
                          onChange={(e) =>
                            actualizarObraSocialForm(
                              index,
                              "id_obra_social",
                              e.target.value
                            )
                          }
                          required
                          className="flex-1 border border-gray-300 p-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
                        >
                          <option value="">Seleccione obra social...</option>
                          {obrasSocialesLista.map((os) => (
                            <option key={os.id_obra_social} value={os.id_obra_social}>
                              {os.nombre}
                            </option>
                          ))}
                        </select>

                        {/* N° de Afiliado */}
                        <input
                          type="text"
                          placeholder="N° de Afiliado *"
                          value={osItem.nro_afiliado}
                          onChange={(e) =>
                            actualizarObraSocialForm(
                              index,
                              "nro_afiliado",
                              e.target.value
                            )
                          }
                          required
                          className="flex-1 border border-gray-300 p-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
                        />

                        {/* Botón Eliminar fila de OS */}
                        <button
                          type="button"
                          onClick={() => eliminarObraSocialForm(index)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-gray-200 my-5" />

            {/* Acciones del Modal */}
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
                {editando ? "Guardar Cambios" : "Registrar Paciente"}
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
          title="Desactivar Paciente"
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que deseas desactivar a{" "}
              <strong className="text-gray-800">
                {pacienteSeleccionado?.nombre} {pacienteSeleccionado?.apellido}
              </strong>
              ? El paciente dejará de figurar en el listado activo.
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
              Sí, Desactivar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}