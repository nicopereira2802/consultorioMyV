/** @format */

import { useState } from "react";
import { useSearchParams } from "react-router-dom"; // * PARA PERMITIR COMPLETAR PACIENTE DESDE AGENDA
import { Users, Plus, Edit, Phone, Ban, RotateCcw, CalendarClock } from "lucide-react";

//* COMPONENTES COMUNES
import Header from "../../components/common/Header";
import Tabla from "../../components/common/Tabla/Tabla";
import TablaHeader from "../../components/common/Tabla/TablaHeader";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";

// * PAGELAYOUT (PARA EL BOTON)
import PageLayout from "../../components/layout/PageLayout";

//* HOOKS
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { usePaginationSearch } from "../../hooks/usePaginationSearch";
import { usePacienteActions } from "./hooks/usePacienteActions";
import { useObrasSocialesCatalogo } from "./hooks/useObrasSocialesCatalogo";

// * FUNCIONES PARA FORMATEAR
import { formatFechaTabla } from "../../utils/index";
import { formatearPacienteParaEditar } from "./utils/formatearPacienteParaEditar.js";

// * FORMULARIOS
import { FormularioCrearEditar, FormularioToggle } from "./components/FormulariosPaciente";
import { ModalTurnosPaciente } from "./components/ModalTurnosPaciente";

const ESTADO_INICIAL = {
  nombre: "",
  apellido: "",
  dni: "",
  fecha_nacimiento: "",
  telefono: "",
  domicilio: "",
  obrasSociales: [],
  obrasSocialesEliminadas: [],
};

export default function GestionPacientes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalTurnosAbierto, setModalTurnosAbierto] = useState(false);
  const [pacienteParaTurnos, setPacienteParaTurnos] = useState(null);

  const abrirTurnosPaciente = (paciente) => {
    setPacienteParaTurnos(paciente);
    setModalTurnosAbierto(true);
  };

  const cerrarModalTurnos = () => {
    setModalTurnosAbierto(false);
    setPacienteParaTurnos(null);
  };

  //* HOOK DE PAGINACIÓN
  const {
    datos: pacientes,
    cargando,
    page,
    setPage,
    total,
    totalPages,
    search,
    setSearch,
    inicioRegistro,
    finRegistro,
    recargar,
  } = usePaginationSearch("/pacientes");

  // * HOOK DE CRUD MODAL
  const {
    modalAbierto,
    modalToggle,
    editando,
    itemSeleccionado: pacienteSeleccionado,
    datosFormulario,
    setDatosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaToggle,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL);

  // * HOOK PARA OBRAS SOCIALES
  const { obrasSocialesLista, agregarObraSocialForm, actualizarObraSocialForm, eliminarObraSocialForm } =
    useObrasSocialesCatalogo(setDatosFormulario);

  //* HOOK PETICIONES API
  const { guardarPaciente, togglePaciente } = usePacienteActions(recargar, cerrarModal);

  return (
    <PageLayout onAdd={abrirParaCrear}>
      <div className="w-full flex-1 flex flex-col gap-4 pb-24">
        {/* //* HEADER CON TITULO Y BOTON */}
        <Header
          icono={Users}
          titulo="Gestión de Pacientes"
          subtitulo="Administración de historias clínicas, datos personales y coberturas"
          badge={`${total} Registrados`}
          botonAccion={
            <button
              type="button"
              onClick={abrirParaCrear}
              className="hidden sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm shrink-0"
            >
              <Plus size={18} />
              <span>Nuevo Paciente</span>
            </button>
          }
        />

        {/* //* BODY: TABLA */}
        <div className="flex-1 w-full min-h-0 p-4 pt-0 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            {/* //* TABLA: BARRA SUPERIOR REUTILIZABLE */}
            {/* //? PLACEHOLDER EN BUSCAR PACIENTE? O LE AGREGAMOS LOS CAMPOS? */}
            <TablaHeader
              inicioRegistro={inicioRegistro}
              finRegistro={finRegistro}
              total={total}
              search={search}
              setSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Buscar pacientes..."
            />

            {/* //* TABLA: TABLA */}
            <div className="overflow-x-auto flex-1">
              <Tabla
                cargando={cargando}
                search={search}
                sinDatosText="No se encontraron pacientes registrados."
                columnas={[
                  { label: "Paciente" },
                  { label: "DNI" },
                  { label: "Teléfono" },
                  { label: "F. Nac." },
                  { label: "Domicilio" },
                  { label: "Acciones", align: "center" },
                ]}
              >
                {pacientes.map((paciente) => (
                  <tr key={paciente.id_paciente} className="hover:bg-gray-50/60 transition-colors">
                    {/* //* COLUMNAS: NOMBRE Y APELLIDO */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="hidden md:flex w-9 h-9 rounded-full bg-[#e8f7f1] text-[#2eb086] items-center justify-center font-bold text-sm shrink-0">
                          {paciente.nombre?.charAt(0)}
                          {paciente.apellido?.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-800">
                          {paciente.nombre} {paciente.apellido}
                        </span>
                      </div>
                    </td>

                    {/* //* COLUMNAS: DNI */}
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {paciente.dni || <span className="text-gray-400 italic">S/D</span>}
                    </td>

                    {/* //* COLUMNAS: TELEFONO */}
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-gray-400" />
                        <span>{paciente.telefono}</span>
                      </div>
                    </td>

                    {/* //* COLUMNAS: FECHA NACIMIENTO */}
                    {/* //? DEMAJOS FEC. NAC. ???? */}
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {formatFechaTabla(paciente.fecha_nacimiento)}
                    </td>

                    {/* //* COLUMNAS: DOMICILIO */}
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                      {paciente.domicilio || <span className="text-gray-400 italic">S/D</span>}
                    </td>

                    {/* //* COLUMNAS: ACCIONES */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => abrirTurnosPaciente(paciente)}
                          className="p-2 rounded-lg text-[#3B7A94] hover:bg-[#f0f6f9] transition-colors"
                          title="Ver Turnos del Paciente"
                        >
                          <CalendarClock size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirParaEditar(paciente, formatearPacienteParaEditar)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar Paciente"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirParaToggle(paciente)}
                          className={`p-2 rounded-lg transition-colors ${
                            paciente.activo
                              ? "text-red-500 hover:bg-red-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {paciente.activo ? <Ban size={18} /> : <RotateCcw size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </Tabla>
            </div>

            {/* //* PAGINACION */}
            <TablaPaginacion page={page} setPage={setPage} totalPages={totalPages} />
          </div>
        </div>

        {/* //* MODALES: CREAR Y EDITAR */}
        {modalAbierto && (
          <FormularioCrearEditar
            guardarPaciente={(e) => {
              e.preventDefault();
              guardarPaciente(datosFormulario, editando, pacienteSeleccionado);
            }}
            modalAbierto={modalAbierto}
            cerrarModal={cerrarModal}
            editando={editando}
            datosFormulario={datosFormulario}
            actualizarDatos={actualizarDatos}
            agregarObraSocialForm={agregarObraSocialForm}
            obrasSocialesLista={obrasSocialesLista}
            actualizarObraSocialForm={actualizarObraSocialForm}
            eliminarObraSocialForm={eliminarObraSocialForm}
            onVerTurnos={() => abrirTurnosPaciente(pacienteSeleccionado)}
          />
        )}

        {/* //* MODALES: TOGGLE */}
        {modalToggle && (
          <FormularioToggle
            modalToggle={modalToggle}
            cerrarModal={cerrarModal}
            pacienteSeleccionado={pacienteSeleccionado}
            togglePaciente={() => togglePaciente(pacienteSeleccionado)}
          />
        )}

        {/* //* MODALES: TURNOS DEL PACIENTE */}
        {modalTurnosAbierto && (
          <ModalTurnosPaciente
            isOpen={modalTurnosAbierto}
            onClose={cerrarModalTurnos}
            paciente={pacienteParaTurnos}
          />
        )}
      </div>
    </PageLayout>
  );
}
