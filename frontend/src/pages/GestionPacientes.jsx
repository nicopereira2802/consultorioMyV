/** @format */

import { useState, useEffect } from "react";
import Modal from "../components/ui/Modal";
import api from "../services/api";
import { formatFechaTabla, formatFechaInput } from "../utils/index";
import { Users, Plus, Edit, Trash2, Search, X, Phone } from "lucide-react";
import Header from "../components/ui/Header";
import Tabla from "../components/ui/Tabla";
import {
  FormularioCrearEditar,
  FormularioEliminar,
} from "../components/ui/Paciente/FormulariosPaciente";
import { useSearchParams } from "react-router-dom";

export default function GestionPacientes() {
  /* ─── ESTADOS GENERALES ─────────────────────────────────── */
  const [searchParams, setSearchParams] = useSearchParams();
  const [pacientes, setPacientes] = useState([]);
  const [obrasSocialesLista, setObrasSocialesLista] = useState([]);
  const [cargando, setCargando] = useState(false);

  /* ─── ESTADOS PAGINACION, BÚSQUEDA Y ORDEN ───────────────── */
  const [page, setPage] = useState(1);
  const [totalPacientes, setTotalPacientes] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState({
    column: "id_paciente",
    direction: "ASC",
  });

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
    buscarObrasSociales();
  }, []);

  // Recargar pacientes al cambiar página, búsqueda u orden
  useEffect(() => {
    buscarPacientes();
  }, [page, search, order]);

  // Manejo de parámetros en la URL para auto-abrir modal de edición (por ejemplo, desde la agenda)
  useEffect(() => {
    const idParaEditar = searchParams.get("editarId");

    if (idParaEditar && pacientes.length > 0) {
      const pacienteEncontrado = pacientes.find(
        (p) => String(p.id_paciente) === String(idParaEditar),
      );

      if (pacienteEncontrado) {
        modalEditando(pacienteEncontrado);
        setSearchParams({});
      }
    }
  }, [searchParams, pacientes]);

  /* ─── PETICIONES API ─────────────────────────────────── */
  const buscarPacientes = async () => {
    setCargando(true);
    try {
      const respuesta = await api.get("/pacientes", {
        params: {
          page: page,
          search: search,
          sortField: order.column,
          sortOrder: order.direction,
        },
      });
      setPacientes(respuesta.data.data || []);
      // Mapeo seguro de metadatos de paginación del backend
      setPage(respuesta.data.meta?.page || page);
      setTotalPages(respuesta.data.meta?.totalPages || 1);
      setTotalPacientes(respuesta.data.meta?.total || 0);
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
        (item) => Number(item.id_paciente) === Number(paciente.id_paciente),
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
        id_relacion: os.id,
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
        idPacienteGuardado =
          resCrear.data.data?.id_paciente || resCrear.data.id_paciente;
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

  // Cálculos dinámicos para los índices del texto de paginación
  const inicioRegistro = totalPacientes === 0 ? 0 : (page - 1) * 9 + 1;
  const finRegistro =
    totalPacientes === 0 ? 0 : page === totalPages ? totalPacientes : page * 9;

  return (
    <div className="w-full flex-1 flex flex-col gap-4">
      {/* ─── CABECERA PRINCIPAL ─────────────────────────────────── */}
      <Header
        icono={Users}
        titulo="Gestión de Pacientes"
        subtitulo="Administración de historias clínicas, datos personales y coberturas"
        badge={`${totalPacientes} Registrados`}
        botonAccion={
          <button
            type="button"
            onClick={modalCreando}
            className="flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0"
          >
            <Plus size={18} />
            <span>Nuevo Paciente</span>
          </button>
        }
      />

      <div className="flex-1 w-full min-h-0 p-4 pt-0 flex flex-col gap-4">
        {/* ─── CONTENEDOR UNIFICADO (BÚSQUEDA, TABLA Y PAGINACIÓN) ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {/* 1. Barra superior interna: Contador y Buscador */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-medium text-gray-500">
              Mostrando {inicioRegistro} a {finRegistro} de {totalPacientes}{" "}
              registros
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {/* Buscador conectado a la API */}
              <div className="relative flex-1 sm:w-80">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido o DNI..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1); // Resetear a la página 1 al buscar
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all"
                />
              </div>
            </div>
          </div>

          {/* 2. Cuerpo de la Tabla */}
          <div className="overflow-x-auto flex-1">
            <Tabla
              cargando={cargando}
              sinDatosText="No se encontraron pacientes registrados."
              columnas={[
                { label: "Paciente" },
                { label: "DNI" },
                { label: "Teléfono" },
                { label: "F. Nacimiento" },
                { label: "Domicilio" },
                { label: "Acciones", align: "center" },
              ]}
            >
              {pacientes.map((paciente) => (
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
                    {paciente.dni || (
                      <span className="text-gray-400 italic">S/D</span>
                    )}
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
              ))}
            </Tabla>
          </div>

          {/* 3. Paginación Inferior integrada con selector directo de página */}
          <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-white">
            <div className="text-xs text-gray-500">
              Página {page} de {totalPages || 1}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 transition-all"
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </button>

              {/* Selector directo de página */}
              <select
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="px-3 py-1.5 bg-[#2eb086] text-white rounded-xl text-xs font-semibold shadow-sm focus:outline-none cursor-pointer"
              >
                {Array.from({ length: totalPages }, (_, index) => (
                  <option
                    key={index + 1}
                    value={index + 1}
                    className="bg-white text-gray-800"
                  >
                    {index + 1}
                  </option>
                ))}
              </select>

              <button
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 transition-all"
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODALES ────────────────────────────────────────────── */}
      {modalAbierto && (
        <FormularioCrearEditar
          procesarFormulario={procesarFormulario}
          modalAbierto={modalAbierto}
          cerrarModal={cerrarModal}
          editando={editando}
          datosFormulario={datosFormulario}
          actualizarDatos={actualizarDatos}
          agregarObraSocialForm={agregarObraSocialForm}
          obrasSocialesLista={obrasSocialesLista}
          actualizarObraSocialForm={actualizarObraSocialForm}
        />
      )}

      {modalEliminar && (
        <FormularioEliminar
          modalEliminar={modalEliminar}
          cerrarModal={cerrarModal}
          pacienteSeleccionado={pacienteSeleccionado}
          ejecutarEliminacion={ejecutarEliminacion}
        />
      )}
    </div>
  );
}
