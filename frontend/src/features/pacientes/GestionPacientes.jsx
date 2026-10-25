/** @format */

//* useSearchParams E ICONOS
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom"; // * PARA PERMITIR COMPLETAR PACIENTE DESDE AGENDA
import { Users, Plus, Edit, Phone, Ban, RotateCcw, Eye, Shield } from "lucide-react";

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
import { usePacienteVer } from "./hooks/usePacienteVer.jsx";

//* FUNCIONES PARA FORMATEAR FECHAS Y UTILIDADES
import { formatearPacienteParaEditar } from "./utils/formatearPacienteParaEditar.js";

//* CONSTANTES
import { ESTADO_INICIAL } from "./constants/pacienteConstants.js";

// * FORMULARIOS
import { FormularioCrearEditar, FormularioToggle } from "./components/FormulariosPaciente";
import { verificarCompletarPaciente } from "./utils/verificarCompletarPaciente.js";
import { VistaPaciente } from "./components/VistaPaciente.jsx";

export default function GestionPacientes() {
  const [searchParams, setSearchParams] = useSearchParams();

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
    abrirParaCrear,
    abrirParaEditar,
    abrirParaToggle,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL);

  // * HOOK DE MODAL VER
  const { modalCuenta, pacienteVerCuenta, abrirParaVer, cerrarVer } = usePacienteVer();

  // * HOOK PARA OBRAS SOCIALES
  const { obrasSocialesLista, agregarObraSocialForm, actualizarObraSocialForm, eliminarObraSocialForm } =
    useObrasSocialesCatalogo(actualizarDatos);

  //* HOOK PETICIONES API
  const { guardarPaciente, togglePaciente } = usePacienteActions(recargar, cerrarModal);

  // TODO: VER SI PUEDO SACAR ESTE USEEFECT
  useEffect(() => {
    verificarCompletarPaciente(cargando, searchParams, pacientes, abrirParaEditar, setSearchParams);
  }, [searchParams, pacientes, cargando, abrirParaEditar, setSearchParams]);

  return (
    <PageLayout onAdd={abrirParaCrear}>
      <div className="w-full flex-1 flex flex-col gap-4 pb-24">
        {/* //* HEADER PRINCIPAL */}
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
            {/* //* TABLA: HEADER */}
            {/* // TODO: VER SI PLACEHOLDER EN BUSCAR PACIENTE? O LE AGREGAMOS LOS CAMPOS? */}
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
                  { label: "Obras Sociales" },
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

                    {/* //* COLUMNA 2: BADGES DE OBRAS SOCIALES */}
                    <td className="hidden md:table-cell px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {paciente.PacienteObraSocials && paciente.PacienteObraSocials.length > 0 ? (
                          paciente.PacienteObraSocials.map((pos) => (
                            <span
                              key={pos.id_paciente_obra_social || pos.id_obra_social}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#e8f7f1] text-[#2eb086] border border-[#2eb086]/20"
                              title={
                                pos.nro_afiliado ? `N° Afiliado: ${pos.nro_afiliado}` : "Particular / S/N"
                              }
                            >
                              <Shield size={13} className="shrink-0" />
                              <span>{pos.ObraSocial?.nombre || "Obra Social"}</span>
                              {pos.nro_afiliado && (
                                <span className="text-[10px] opacity-75 font-normal border-l border-[#2eb086]/30 pl-1 ml-0.5">
                                  #{pos.nro_afiliado}
                                </span>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                            Particular
                          </span>
                        )}
                      </div>
                    </td>

                    {/* //* COLUMNAS: ACCIONES */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => abrirParaVer(paciente)}
                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Ver Ficha y Cuenta Corriente"
                        >
                          <Eye size={18} />
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

        {/* //* MODALES: VER */}
        {modalCuenta && (
          <VistaPaciente isOpen={modalCuenta} onClose={() => cerrarVer()} paciente={pacienteVerCuenta} />
        )}
      </div>
    </PageLayout>
  );
}
