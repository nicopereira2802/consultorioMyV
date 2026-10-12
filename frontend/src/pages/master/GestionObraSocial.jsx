/** @format */

import { useState, useEffect } from "react";
import Modal from "../../components/ui/Modal";
import api from "../../services/api";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import Header from "../../components/ui/Header";
import Tabla from "../../components/ui/Tabla";

export default function GestionObrasSociales() {
  /* ─── ESTADOS GENERALES ─────────────────────────────────── */
  const [obrasSociales, setObrasSociales] = useState([]);
  const [cargando, setCargando] = useState(false);

  /* ─── ESTADOS PAGINACION, BÚSQUEDA Y ORDEN ───────────────── */
  const [page, setPage] = useState(1);
  const [totalObrasSociales, setTotalObrasSociales] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState({
    column: "id_obra_social",
    direction: "ASC",
  });

  /* ─── ESTADOS DEL MODAL Y FORMULARIO ─────────────────────── */
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [editando, setEditando] = useState(false);
  const [obraSocialSeleccionada, setObraSocialSeleccionada] = useState(null);

  const [datosFormulario, setDatosFormulario] = useState({
    nombre: "",
  });

  /* ─── USE-EFFECTS ─────────────────────────────────── */
  useEffect(() => {
    buscarObrasSociales();
  }, [page, search, order]);

  /* ─── PETICIONES API ─────────────────────────────────── */
  const buscarObrasSociales = async () => {
    setCargando(true);
    try {
      const respuesta = await api.get("/obras-sociales", {
        params: {
          page: page,
          search: search,
          sortField: order.column,
          sortOrder: order.direction,
        },
      });
      setObrasSociales(respuesta.data.data || []);
      setPage(respuesta.data.meta?.page || page);
      setTotalPages(respuesta.data.meta?.totalPages || 1);
      setTotalObrasSociales(respuesta.data.meta?.total || 0);
    } catch (error) {
      console.error("Error al cargar obras sociales:", error);
    } finally {
      setCargando(false);
    }
  };

  /* ─── MANEJO DE MODALES ─────────────────────────────────── */
  const modalCreando = () => {
    setEditando(false);
    setDatosFormulario({
      nombre: "",
    });
    setModalAbierto(true);
  };

  const modalEditando = (obraSocial) => {
    setEditando(true);
    setObraSocialSeleccionada(obraSocial);
    setDatosFormulario({
      nombre: obraSocial.nombre,
    });
    setModalAbierto(true);
  };

  const confirmarCambioEstado = (obraSocial) => {
    setObraSocialSeleccionada(obraSocial);
    setModalEliminar(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModalEliminar(false);
    setObraSocialSeleccionada(null);
    setDatosFormulario({
      nombre: "",
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

  /* ─── GUARDAR / EDITAR OBRA SOCIAL ──────────────────────── */
  const procesarFormulario = async (e) => {
    e.preventDefault();

    if (!datosFormulario.nombre.trim()) {
      alert("Por favor ingrese el nombre de la obra social.");
      return;
    }

    try {
      const payload = {
        nombre: datosFormulario.nombre.trim(),
      };

      if (editando) {
        await api.put(
          `/obras-sociales/${obraSocialSeleccionada.id_obra_social}`,
          payload,
        );
      } else {
        await api.post("/obras-sociales", payload);
      }

      buscarObrasSociales();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar la obra social:", error);
      alert("Ocurrió un error al intentar guardar la obra social.");
    }
  };

  /* ─── TOGGLE ACTIVO / INACTIVO (PATCH DELETE) ────────────── */
  const ejecutarCambioEstado = async () => {
    if (!obraSocialSeleccionada) return;
    try {
      await api.patch(
        `/obras-sociales/${obraSocialSeleccionada.id_obra_social}/delete`,
      );
      buscarObrasSociales();
      cerrarModal();
    } catch (error) {
      console.error("Error al cambiar el estado de la obra social:", error);
      alert("No se pudo actualizar el estado de la obra social.");
    }
  };

  const inicioRegistro = totalObrasSociales === 0 ? 0 : (page - 1) * 9 + 1;
  const finRegistro =
    totalObrasSociales === 0
      ? 0
      : page === totalPages
        ? totalObrasSociales
        : page * 9;

  return (
    <div className="w-full flex-1 flex flex-col gap-4 pb-24">
      {/* ─── CABECERA PRINCIPAL CON BOTÓN EXCLUSIVO PARA PC ───────────────── */}
      <Header
        icono={Shield}
        titulo="Catálogo de Obras Sociales"
        subtitulo="Gestión de coberturas médicas y mutuales del consultorio"
        badge={`${totalObrasSociales} Registradas`}
        botonAccion={
          <button
            type="button"
            onClick={modalCreando}
            className="hidden sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0"
          >
            <Plus size={18} />
            <span>Nueva Obra Social</span>
          </button>
        }
      />

      <div className="flex-1 w-full min-h-0 p-4 pt-0 flex flex-col gap-4">
        {/* ─── CONTENEDOR UNIFICADO ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {/* Barra superior */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-medium text-gray-500">
              Mostrando {inicioRegistro} a {finRegistro} de {totalObrasSociales}{" "}
              registros
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="relative flex-1 sm:w-80">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Buscar por nombre de obra social o prepaga..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Tabla adaptada */}
          <div className="overflow-x-auto flex-1">
            <Tabla
              cargando={cargando}
              sinDatosText="No se encontraron obras sociales registradas."
              columnas={[
                { label: "ID", className: "hidden md:table-cell" },
                { label: "Obra Social" },
                { label: "Estado" },
                { label: "Acciones", align: "center" },
              ]}
            >
              {obrasSociales.map((os) => (
                <tr
                  key={os.id_obra_social}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  <td className="hidden md:table-cell px-6 py-4 font-semibold text-gray-500 w-24 text-xs">
                    #{os.id_obra_social}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="hidden md:flex w-9 h-9 rounded-full bg-[#e8f7f1] text-[#2eb086] items-center justify-center font-bold text-sm shrink-0">
                        {os.nombre?.charAt(0)}
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">
                        {os.nombre}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {os.activo ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <CheckCircle2 size={14} />
                        <span>Activa</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                        <XCircle size={14} />
                        <span>Inactiva</span>
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => modalEditando(os)}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Editar Obra Social"
                      >
                        <Edit size={18} />
                      </button>

                      {os.activo ? (
                        <button
                          type="button"
                          onClick={() => confirmarCambioEstado(os)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Desactivar Obra Social"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => confirmarCambioEstado(os)}
                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Activar Obra Social"
                        >
                          <RotateCcw size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Tabla>
          </div>

          {/* Paginación */}
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

      {/* ─── BOTÓN FLOTANTE INFERIOR DERECHO (EXCLUSIVO PARA MÓVIL) ─── */}
      <button
        type="button"
        onClick={modalCreando}
        className="fixed bottom-20 right-4 z-40 flex md:hidden items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-3 py-3 rounded-full font-semibold text-sm shadow-2xl transition-all duration-300 active:scale-95 group"
        title="Nueva Obra Social"
      >
        <Plus
          size={20}
          className="transition-transform group-hover:rotate-90 duration-300"
        />
      </button>

      {/* MODAL CREAR / EDITAR OBRA SOCIAL */}
      {modalAbierto && (
        <form onSubmit={procesarFormulario}>
          <Modal
            isOpen={modalAbierto}
            onClose={cerrarModal}
            width="max-w-md"
            title={editando ? "Editar Obra Social" : "Nueva Obra Social"}
          >
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre de la Obra Social / Prepaga *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={datosFormulario.nombre}
                  onChange={actualizarDatos}
                  placeholder="Ej: OSDE, Swiss Medical, OSECAC..."
                  required
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
                {editando ? "Guardar Cambios" : "Crear Obra Social"}
              </button>
            </div>
          </Modal>
        </form>
      )}

      {/* MODAL CONFIRMAR CAMBIO DE ESTADO */}
      {modalEliminar && (
        <Modal
          isOpen={modalEliminar}
          onClose={cerrarModal}
          width="max-w-md"
          title={
            obraSocialSeleccionada?.activo
              ? "Desactivar Obra Social"
              : "Activar Obra Social"
          }
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que deseas{" "}
              {obraSocialSeleccionada?.activo ? "desactivar" : "activar"} la
              obra social{" "}
              <strong className="text-gray-800">
                {obraSocialSeleccionada?.nombre}
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
              onClick={ejecutarCambioEstado}
              className={`px-4 py-2 rounded-xl text-white font-semibold text-sm transition-colors shadow-sm ${
                obraSocialSeleccionada?.activo
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-[#2eb086] hover:bg-[#259370]"
              }`}
            >
              {obraSocialSeleccionada?.activo
                ? "Sí, Desactivar"
                : "Sí, Activar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
