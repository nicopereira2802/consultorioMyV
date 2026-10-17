/** @format */
import Modal from "../../../components/common/Modal";
import { CreditCard, ShieldPlus, X } from "lucide-react";
import InputFiltro from "../../../components/common/InputFiltro";

export function FormularioCrearEditar({
  guardarPaciente,
  modalAbierto,
  cerrarModal,
  editando,
  datosFormulario,
  actualizarDatos,
  agregarObraSocialForm,
  obrasSocialesLista,
  actualizarObraSocialForm,
  eliminarObraSocialForm,
}) {
  return (
    <form onSubmit={guardarPaciente}>
      <Modal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        width="max-w-2xl"
        title={editando ? "Editar Paciente" : "Registrar Nuevo Paciente"}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* //* NOMBRE */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre *</label>
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

          {/* //* APELLIDO */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Apellido *</label>
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

          {/* //* DNI */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">DNI</label>
            <input
              type="text"
              name="dni"
              value={datosFormulario.dni || ""}
              onChange={actualizarDatos}
              placeholder="Ej: 38123456"
              className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
            />
          </div>

          {/* //* TELEFONO */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono / Celular *</label>
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

          {/* //* FECHA NACIMIENTO */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de Nacimiento</label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={datosFormulario.fecha_nacimiento || ""}
              onChange={actualizarDatos}
              className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
            />
          </div>

          {/* //* DOMICILIO */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Domicilio</label>
            <input
              type="text"
              name="domicilio"
              value={datosFormulario.domicilio || ""}
              onChange={actualizarDatos}
              placeholder="Ej: Av. Colón 1234"
              className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
            />
          </div>

          {/* //* SECCION: OBRAS SOCIALES */}
          <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#2eb086]" />
                <h3 className="text-sm font-bold text-gray-800">Cobertura de Obra Social</h3>
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
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200"
                  >
                    {/* //* SELECTOR DE OBRA SOCIAL */}
                    <InputFiltro
                      datos={obrasSocialesLista}
                      camposFiltrado={["nombre"]}
                      formatoVisual={(os) => `${os.nombre}`}
                      placeholder="Busca una obra social..."
                      alSeleccionar={(os) =>
                        actualizarObraSocialForm(index, "id_obra_social", os.id_obra_social)
                      }
                      valorInicial={osItem.id_obra_social}
                    />

                    <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1">
                      {/* //* NRO AFILIADO */}
                      <input
                        type="text"
                        placeholder="N° de Afiliado *"
                        value={osItem.nro_afiliado}
                        onChange={(e) => actualizarObraSocialForm(index, "nro_afiliado", e.target.value)}
                        required
                        className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
                      />

                      {/* //* ELIMINAR OBRA SOCIAL */}
                      <button
                        type="button"
                        onClick={() => eliminarObraSocialForm(index)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
                        title="Quitar obra social"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* //* SEPARADOR */}
        <div className="border-t border-gray-200 my-5" />

        {/* //* ACCIONES MODAL */}
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
  );
}

export function FormularioToggle({ modalToggle, cerrarModal, pacienteSeleccionado, togglePaciente }) {
  return (
    <Modal isOpen={modalToggle} onClose={cerrarModal} width="max-w-md" title="Desactivar Paciente">
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
          onClick={togglePaciente}
          className="px-4 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600 font-semibold text-sm transition-colors shadow-sm"
        >
          Sí, Desactivar
        </button>
      </div>
    </Modal>
  );
}
export function FormularioEliminar({ modalEliminar, cerrarModal, pacienteSeleccionado, eliminarPaciente }) {
  return (
    <Modal isOpen={modalEliminar} onClose={cerrarModal} width="max-w-md" title="Desactivar Paciente">
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
          onClick={eliminarPaciente}
          className="px-4 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600 font-semibold text-sm transition-colors shadow-sm"
        >
          Sí, Desactivar
        </button>
      </div>
    </Modal>
  );
}
