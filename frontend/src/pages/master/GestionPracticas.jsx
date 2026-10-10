/** @format */

import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import api from "../../services/api";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Tag,
} from "lucide-react";

export default function GestionPracticas() {
  /* ─── ESTADOS GENERALES ─────────────────────────────────── */
  const [practicas, setPracticas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);

  /* ─── ESTADOS DEL MODAL Y FORMULARIO ─────────────────────── */
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [editando, setEditando] = useState(false);
  const [practicaSeleccionada, setPracticaSeleccionada] = useState(null);

  const [datosFormulario, setDatosFormulario] = useState({
    codigo_nomenclador: "",
    nombre_nomenclador: "",
    nombre_referencia: "",
    especialidad: "",
    precio_referencia: "",
  });

  /* ─── USE-EFFECTS ─────────────────────────────────── */
  useEffect(() => {
    buscarPracticas();
  }, []);

  /* ─── PETICIONES API ─────────────────────────────────── */
  const buscarPracticas = async () => {
    setCargando(true);
    try {
      const respuesta = await api.get("/practicas");
      setPracticas(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar prácticas:", error);
    } finally {
      setCargando(false);
    }
  };

  /* ─── MANEJO DE MODALES ─────────────────────────────────── */
  const modalCreando = () => {
    setEditando(false);
    setDatosFormulario({
      codigo_nomenclador: "",
      nombre_nomenclador: "",
      nombre_referencia: "",
      especialidad: "",
      precio_referencia: "",
    });
    setModalAbierto(true);
  };

  const modalEditando = (practica) => {
    setEditando(true);
    setPracticaSeleccionada(practica);
    setDatosFormulario({
      codigo_nomenclador: practica.codigo_nomenclador || "",
      nombre_nomenclador: practica.nombre_nomenclador || "",
      nombre_referencia: practica.nombre_referencia || "",
      especialidad: practica.especialidad || "",
      precio_referencia: practica.precio_referencia || "",
    });
    setModalAbierto(true);
  };

  const confirmarCambioEstado = (practica) => {
    setPracticaSeleccionada(practica);
    setModalEliminar(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModalEliminar(false);
    setPracticaSeleccionada(null);
    setDatosFormulario({
      codigo_nomenclador: "",
      nombre_nomenclador: "",
      nombre_referencia: "",
      especialidad: "",
      precio_referencia: "",
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

  /* ─── GUARDAR / EDITAR PRÁCTICA ─────────────────────────── */
  const procesarFormulario = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        codigo_nomenclador: datosFormulario.codigo_nomenclador.trim(),
        nombre_nomenclador: datosFormulario.nombre_nomenclador.trim(),
        nombre_referencia: datosFormulario.nombre_referencia.trim(),
        especialidad: datosFormulario.especialidad.trim(),
        precio_referencia: parseFloat(datosFormulario.precio_referencia),
      };

      if (editando) {
        await api.put(
          `/practicas/${practicaSeleccionada.id_practica}`,
          payload
        );
      } else {
        await api.post("/practicas", payload);
      }

      buscarPracticas();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar la práctica:", error);
      alert("Ocurrió un error al intentar guardar la práctica.");
    }
  };

  /* ─── TOGGLE ACTIVO / INACTIVO (PATCH DELETE) ────────────── */
  const ejecutarCambioEstado = async () => {
    if (!practicaSeleccionada) return;
    try {
      await api.patch(
        `/practicas/${practicaSeleccionada.id_practica}/delete`
      );
      buscarPracticas();
      cerrarModal();
    } catch (error) {
      console.error("Error al cambiar estado de la práctica:", error);
      alert("No se pudo actualizar el estado de la práctica.");
    }
  };

  /* ─── FILTRADO EN VIVO ──────────────────────────────────── */
  const practicasFiltradas = practicas.filter((p) => {
    const termino = busqueda.toLowerCase();
    const codigo = p.codigo_nomenclador?.toLowerCase() || "";
    const nombreNom = p.nombre_nomenclador?.toLowerCase() || "";
    const nombreRef = p.nombre_referencia?.toLowerCase() || "";
    const especialidad = p.especialidad?.toLowerCase() || "";

    return (
      codigo.includes(termino) ||
      nombreNom.includes(termino) ||
      nombreRef.includes(termino) ||
      especialidad.includes(termino)
    );
  });

  return (
    <div className="w-full flex-1 flex flex-col gap-4">
      {/* ─── CABECERA PRINCIPAL ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#e8f7f1] text-[#2eb086] flex items-center justify-center shrink-0 shadow-sm">
            <FileText size={24} />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                Catálogo de Prácticas
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f7f1] text-[#2eb086] border border-[#2eb086]/20">
                {practicas.length} Registradas
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">
              Nomenclador de tratamientos, prestaciones y aranceles
            </p>
          </div>
        </div>

        {/* Botón Nueva Práctica */}
        <button
          type="button"
          onClick={modalCreando}
          className="flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0"
        >
          <Plus size={18} />
          <span>Nueva Práctica</span>
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
            placeholder="Buscar por código, tratamiento o especialidad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all"
          />
        </div>
      </div>

      {/* ─── TABLA DE PRÁCTICAS ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Tratamiento / Nomenclador</th>
                <th className="px-6 py-4">Especialidad</th>
                <th className="px-6 py-4">Precio Ref.</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    Cargando catálogo de prácticas...
                  </td>
                </tr>
              ) : practicasFiltradas.length > 0 ? (
                practicasFiltradas.map((practica) => (
                  <tr
                    key={practica.id_practica}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Código Nomenclador */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200">
                        <Tag size={12} className="text-[#2eb086]" />
                        {practica.codigo_nomenclador}
                      </span>
                    </td>

                    {/* Nombres (Referencia y Nomenclador) */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">
                          {practica.nombre_referencia}
                        </span>
                        <span className="text-xs text-gray-400">
                          {practica.nombre_nomenclador}
                        </span>
                      </div>
                    </td>

                    {/* Especialidad */}
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {practica.especialidad}
                    </td>

                    {/* Precio de Referencia */}
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      ${Number(practica.precio_referencia).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      {practica.activo ? (
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
                          onClick={() => modalEditando(practica)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar Práctica"
                        >
                          <Edit size={18} />
                        </button>

                        {/* Botón Activar / Desactivar */}
                        {practica.activo ? (
                          <button
                            type="button"
                            onClick={() => confirmarCambioEstado(practica)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Desactivar Práctica"
                          >
                            <Trash2 size={18} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => confirmarCambioEstado(practica)}
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Activar Práctica"
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
                    colSpan="6"
                    className="py-12 text-center text-gray-400 font-medium"
                  >
                    No se encontraron prácticas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL CREAR / EDITAR PRÁCTICA ─────────────────────── */}
      {modalAbierto && (
        <form onSubmit={procesarFormulario}>
          <Modal
            isOpen={modalAbierto}
            onClose={cerrarModal}
            width="max-w-2xl"
            title={editando ? "Editar Práctica" : "Nueva Práctica Odontológica"}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Código Nomenclador */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Código Nomenclador *
                </label>
                <input
                  type="text"
                  name="codigo_nomenclador"
                  value={datosFormulario.codigo_nomenclador}
                  onChange={actualizarDatos}
                  placeholder="Ej: 01.01"
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                />
              </div>

              {/* Especialidad */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Especialidad *
                </label>
                <input
                  type="text"
                  name="especialidad"
                  value={datosFormulario.especialidad}
                  onChange={actualizarDatos}
                  placeholder="Ej: Operatoria, Endodoncia, Cirugía..."
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                />
              </div>

              {/* Nombre Nomenclador */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre Nomenclador (Oficial) *
                </label>
                <input
                  type="text"
                  name="nombre_nomenclador"
                  value={datosFormulario.nombre_nomenclador}
                  onChange={actualizarDatos}
                  placeholder="Ej: Consulta de diagnóstico y ficha odontológica"
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                />
              </div>

              {/* Nombre Referencia (Nombre Corto / Informal) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre de Referencia *
                </label>
                <input
                  type="text"
                  name="nombre_referencia"
                  value={datosFormulario.nombre_referencia}
                  onChange={actualizarDatos}
                  placeholder="Ej: Consulta General"
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                />
              </div>

              {/* Precio de Referencia */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Precio de Referencia ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="precio_referencia"
                  value={datosFormulario.precio_referencia}
                  onChange={actualizarDatos}
                  placeholder="Ej: 12500.00"
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
                {editando ? "Guardar Cambios" : "Crear Práctica"}
              </button>
            </div>
          </Modal>
        </form>
      )}

      {/* ─── MODAL CONFIRMAR CAMBIO DE ESTADO ───────────────────── */}
      {modalEliminar && (
        <Modal
          isOpen={modalEliminar}
          onClose={cerrarModal}
          width="max-w-md"
          title={
            practicaSeleccionada?.activo
              ? "Desactivar Práctica"
              : "Activar Práctica"
          }
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que deseas{" "}
              {practicaSeleccionada?.activo ? "desactivar" : "activar"} la práctica{" "}
              <strong className="text-gray-800">
                {practicaSeleccionada?.nombre_referencia}
              </strong>{" "}
              (Código: {practicaSeleccionada?.codigo_nomenclador})?
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
                practicaSeleccionada?.activo
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-[#2eb086] hover:bg-[#259370]"
              }`}
            >
              {practicaSeleccionada?.activo
                ? "Sí, Desactivar"
                : "Sí, Activar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}