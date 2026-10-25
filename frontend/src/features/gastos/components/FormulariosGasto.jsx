/** @format */

import { useState } from "react";
import Modal from "../../../components/common/Modal";
import InputFiltro from "../../../components/common/InputFiltro";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { manejarErrorApi } from "../../../utils/errorHandler";
import { Plus } from "lucide-react";

export function FormularioCrearEditar({
  guardarGasto,
  modalAbierto,
  cerrarModal,
  editando,
  datosFormulario,
  actualizarDatos,
  categorias,
  recargarCategorias, // Recibe la función de refrescar categorías del hook
}) {
  // Estado para el mini-modal de creación rápida de categoría
  const [modalCategoriaRapida, setModalCategoriaRapida] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: "", descripcion: "" });

  const guardarCategoriaRapida = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/categorias-gastos", {
        nombre: nuevaCategoria.nombre.trim(),
        descripcion: nuevaCategoria.descripcion.trim(),
      });

      const catCreada = res.data.data || res.data;
      toast.success("Categoría creada correctamente");

      // Recargamos el catálogo global de categorías si está disponible
      if (typeof recargarCategorias === "function") {
        await recargarCategorias();
      }

      // Auto-seleccionamos la nueva categoría en el formulario de gasto
      actualizarDatos({
        target: { name: "id_categoria_gasto", value: catCreada.id_categoria_gasto },
      });

      setNuevaCategoria({ nombre: "", descripcion: "" });
      setModalCategoriaRapida(false);
    } catch (error) {
      console.error("Error al crear categoría rápida:", error);
      manejarErrorApi(error, "No se pudo crear la categoría.");
    }
  };

  return (
    <>
      <form onSubmit={guardarGasto}>
        <Modal
          isOpen={modalAbierto}
          onClose={cerrarModal}
          width="max-w-2xl"
          title={editando ? "Editar Registro de Gasto" : "Registrar Nuevo Gasto"}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CATEGORÍA CON INPUTFILTRO Y BOTÓN NUEVO */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-700">Categoría *</label>
                <button
                  type="button"
                  onClick={() => setModalCategoriaRapida(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#2eb086] hover:text-[#259370] bg-[#e8f7f1] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Crear nueva categoría"
                >
                  <Plus size={14} />
                  <span>+ Nueva Categoría</span>
                </button>
              </div>

              <InputFiltro
                datos={categorias}
                camposFiltrado={["nombre", "descripcion"]}
                formatoVisual={(cat) => cat.nombre}
                placeholder="Buscar o seleccionar categoría de gasto..."
                valorInicial={datosFormulario.id_categoria_gasto || ""}
                alSeleccionar={(cat) => {
                  actualizarDatos({
                    target: { name: "id_categoria_gasto", value: cat.id_categoria_gasto },
                  });
                }}
              />
            </div>

            {/* MONTO */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Monto ($) *</label>
              <input
                type="number"
                step="0.01"
                name="monto"
                value={datosFormulario.monto}
                onChange={actualizarDatos}
                placeholder="Ej: 15000.00"
                required
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            {/* MÉTODO DE PAGO */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Método de Pago *</label>
              <select
                name="metodo_pago"
                value={datosFormulario.metodo_pago}
                onChange={actualizarDatos}
                required
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* CONCEPTO */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Concepto / Descripción *
              </label>
              <input
                type="text"
                name="concepto"
                value={datosFormulario.concepto}
                onChange={actualizarDatos}
                placeholder="Ej: Compra de insumos odontológicos, resinas y guantes"
                required
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            {/* FECHA */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha del Gasto</label>
              <input
                type="date"
                name="fecha_gasto"
                value={datosFormulario.fecha_gasto}
                onChange={actualizarDatos}
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            {/* COMPROBANTE */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                N° Comprobante / Ticket
              </label>
              <input
                type="text"
                name="comprobante"
                value={datosFormulario.comprobante}
                onChange={actualizarDatos}
                placeholder="Ej: FACT-A-0001-00004521"
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>

            {/* NOTAS */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notas Adicionales</label>
              <textarea
                name="notas"
                rows={2}
                value={datosFormulario.notas}
                onChange={actualizarDatos}
                placeholder="Observaciones adicionales..."
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
              {editando ? "Guardar Cambios" : "Registrar Gasto"}
            </button>
          </div>
        </Modal>
      </form>

      {/* MINI-MODAL: CREAR CATEGORÍA RÁPIDA */}
      {modalCategoriaRapida && (
        <Modal
          isOpen={modalCategoriaRapida}
          onClose={() => setModalCategoriaRapida(false)}
          width="max-w-md"
          title="Nueva Categoría de Gasto"
        >
          <form onSubmit={guardarCategoriaRapida}>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  value={nuevaCategoria.nombre}
                  onChange={(e) => setNuevaCategoria((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Insumos Odontológicos, Servicios..."
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  value={nuevaCategoria.descripcion}
                  onChange={(e) => setNuevaCategoria((prev) => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Ej: Compra de resinas, agujas, anestesias..."
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 my-4" />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalCategoriaRapida(false)}
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

export function FormularioToggle({ modalToggle, cerrarModal, gastoSeleccionado, toggleGasto }) {
  return (
    <Modal
      isOpen={modalToggle}
      onClose={cerrarModal}
      width="max-w-md"
      title={gastoSeleccionado?.activo ? "Desactivar Gasto" : "Activar Gasto"}
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-700">
          ¿Estás seguro de que deseas {gastoSeleccionado?.activo ? "desactivar" : "activar"} el gasto{" "}
          <strong className="text-gray-800">"{gastoSeleccionado?.concepto}"</strong> por un valor de{" "}
          <strong>
            ${Number(gastoSeleccionado?.monto || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
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
          onClick={toggleGasto}
          className={`px-4 py-2 rounded-xl text-white font-semibold text-sm transition-colors shadow-sm ${
            gastoSeleccionado?.activo ? "bg-red-500 hover:bg-red-600" : "bg-[#2eb086] hover:bg-[#259370]"
          }`}
        >
          {gastoSeleccionado?.activo ? "Sí, Desactivar" : "Sí, Activar"}
        </button>
      </div>
    </Modal>
  );
}

export function FormularioEliminar({ modalEliminar, cerrarModal, gastoSeleccionado, eliminarGasto }) {
  return (
    <Modal
      isOpen={modalEliminar}
      onClose={cerrarModal}
      width="max-w-md"
      title="Eliminar definitivamente Gasto"
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-black">
          ¿Deseas <strong>Eliminar definitivamente</strong> el registro de gasto{" "}
          <strong className="text-gray-800">"{gastoSeleccionado?.concepto}"</strong>?
        </p>
        <p className="text-sm text-red-500 mt-4">Esta acción no puede ser deshecha.</p>
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
          onClick={eliminarGasto}
          className="px-4 py-2 rounded-xl text-white font-semibold text-sm transition-colors shadow-sm bg-red-500 hover:bg-red-600"
        >
          Confirmar
        </button>
      </div>
    </Modal>
  );
}
