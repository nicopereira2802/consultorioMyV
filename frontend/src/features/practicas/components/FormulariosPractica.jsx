import Modal from "../../../components/common/Modal";

export function FormularioCrearEditar({
  guardarPractica,
  modalAbierto,
  cerrarModal,
  editando,
  datosFormulario,
  actualizarDatos,
}) {
  return (
    <form onSubmit={guardarPractica}>
      <Modal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        width="max-w-2xl"
        title={editando ? "Editar Práctica" : "Nueva Práctica Odontológica"}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Código Nomenclador *</label>
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Especialidad *</label>
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de Referencia *</label>
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
            {editando ? "Guardar Cambios" : "Crear Práctica"}
          </button>
        </div>
      </Modal>
    </form>
  );
}

export function FormularioToggle({ modalToggle, cerrarModal, practicaSeleccionada, togglePractica }) {
  return (
    <Modal
      isOpen={modalToggle}
      onClose={cerrarModal}
      width="max-w-md"
      title={practicaSeleccionada?.activo ? "Desactivar Práctica" : "Activar Práctica"}
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-700">
          ¿Estás seguro de que deseas {practicaSeleccionada?.activo ? "desactivar" : "activar"} la práctica{" "}
          <strong className="text-gray-800">{practicaSeleccionada?.codigo_nomenclador}</strong> <br />(
          {practicaSeleccionada?.nombre_referencia})?
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
          onClick={togglePractica}
          className={`px-4 py-2 rounded-xl text-white font-semibold text-sm transition-colors shadow-sm ${
            practicaSeleccionada?.activo ? "bg-red-500 hover:bg-red-600" : "bg-[#2eb086] hover:bg-[#259370]"
          }`}
        >
          {practicaSeleccionada?.activo ? "Sí, Desactivar" : "Sí, Activar"}
        </button>
      </div>
    </Modal>
  );
}
export function FormularioEliminar({ modalEliminar, cerrarModal, practicaSeleccionada, eliminarPractica }) {
  return (
    <Modal
      isOpen={modalEliminar}
      onClose={cerrarModal}
      width="max-w-md"
      title="Eliminar definitivamente Practica"
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-black">
          ¿Deseas <strong>Eliminar definitivamente</strong> a{" "}
          <strong className="text-gray-800">
            {practicaSeleccionada?.codigo_nomenclador}, {practicaSeleccionada?.nombre_referencia}
          </strong>
          ?
        </p>
        <p className="text-sm text-red-500 mt-4">Esta acción no puede ser desecha.</p>
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
          onClick={eliminarPractica}
          className="px-4 py-2 rounded-xl text-white font-semibold text-sm transition-colors shadow-sm bg-red-500 hover:bg-red-600"
        >
          Confirmar
        </button>
      </div>
    </Modal>
  );
}
