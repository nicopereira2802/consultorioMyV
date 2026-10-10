/** @format */

import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
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

export default function GestionObrasSociales() {
  /* ─── ESTADOS GENERALES ─────────────────────────────────── */
  const [obrasSociales, setObrasSociales] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);

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
  }, []);

  /* ─── PETICIONES API ─────────────────────────────────── */
  const buscarObrasSociales = async () => {
    setCargando(true);
    try {
      const respuesta = await api.get("/obras-sociales");
      setObrasSociales(respuesta.data.data || []);
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
          payload
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
        `/obras-sociales/${obraSocialSeleccionada.id_obra_social}/delete`
      );
      buscarObrasSociales();
      cerrarModal();
    } catch (error) {
      console.error("Error al cambiar el estado de la obra social:", error);
      alert("No se pudo actualizar el estado de la obra social.");
    }
  };

  /* ─── FILTRADO EN VIVO POR NOMBRE ───────────────────────── */
  const obrasSocialesFiltradas = obrasSociales.filter((os) =>
    os.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="w-full flex-1 flex flex-col gap-4">
      {/* ─── CABECERA PRINCIPAL ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#e8f7f1] text-[#2eb086] flex items-center justify-center shrink-0 shadow-sm">
            <Shield size={24} />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                Catálogo de Obras Sociales
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f7f1] text-[#2eb086] border border-[#2eb086]/20">
                {obrasSociales.length} Registradas
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">
              Gestión de coberturas médicas y mutuales del consultorio
            </p>
          </div>
        </div>

        {/* Botón Nueva Obra Social */}
        <button
          type="button"
          onClick={modalCreando}
          className="flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0"
        >
          <Plus size={18} />
          <span>Nueva Obra Social</span>
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
            placeholder="Buscar por nombre de obra social o prepaga..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all"
          />
        </div>
      </div>

      {/* ─── TABLA DE OBRAS SOCIALES ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Obra Social / Prepaga</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {cargando ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-gray-400">
                    Cargando obras sociales...
                  </td>
                </tr>
              ) : obrasSocialesFiltradas.length > 0 ? (
                obrasSocialesFiltradas.map((os) => (
                  <tr
                    key={os.id_obra_social}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    {/* ID */}
                    <td className="px-6 py-4 font-semibold text-gray-500 w-24">
                      #{os.id_obra_social}
                    </td>

                    {/* Nombre */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#e8f7f1] text-[#2eb086] flex items-center justify-center font-bold text-sm shrink-0">
                          {os.nombre?.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-800">
                          {os.nombre}
                        </span>
                      </div>
                    </td>

                    {/* Estado */}
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

                    {/* Acciones */}
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

                        {/* Botón Dinámico según Estado (Activar / Desactivar) */}
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
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="py-12 text-center text-gray-400 font-medium"
                  >
                    No se encontraron obras sociales registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL CREAR / EDITAR OBRA SOCIAL ─────────────────────── */}
      {modalAbierto && (
        <form onSubmit={procesarFormulario}>
          <Modal
            isOpen={modalAbierto}
            onClose={cerrarModal}
            width="max-w-md"
            title={editando ? "Editar Obra Social" : "Nueva Obra Social"}
          >
            <div className="grid grid-cols-1 gap-4">
              {/* Nombre */}
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
                {editando ? "Guardar Cambios" : "Crear Obra Social"}
              </button>
            </div>
          </Modal>
        </form>
      )}

      {/* ─── MODAL CONFIRMAR CAMBIO DE ESTADO (ACTIVAR / DESACTIVAR) ──── */}
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
              {obraSocialSeleccionada?.activo ? "desactivar" : "activar"} la obra
              social{" "}
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