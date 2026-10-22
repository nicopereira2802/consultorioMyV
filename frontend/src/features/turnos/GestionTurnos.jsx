/** @format */
//* ICONOS
import { Plus, Edit, Trash2, Clock, AlertCircle, CalendarClock, Eye } from "lucide-react";

//* COMPONENTES COMUNES
import Header from "../../components/common/Header";
import Tabla from "../../components/common/Tabla/Tabla";
import TablaHeader from "../../components/common/Tabla/TablaHeader";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";

//* COMPONENTES ESPECIFICOS DE TURNO
import { VistaTurno } from "./components/VistaTurno";
import { BotonAccionesTurno } from "./components/BotonAcciones";

//* PAGELAYOUT (PARA EL BOTON)
import PageLayout from "../../components/layout/PageLayout";

//* HOOKS
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { usePaginationSearch } from "../../hooks/usePaginationSearch";
import { useTurnoDependencies } from "./hooks/useTurnoDependencies";
import { useTurnoAtenderModal } from "./hooks/useTurnoAtenderModal";
import { useTurnoCancelarModal } from "./hooks/useTurnoCancelarModal";
import { useTurnoReprogramarModal } from "./hooks/useTurnoReprogramarModal";
import { useTurnoActions } from "./hooks/useTurnoActions";
import { useTurnoVer } from "./hooks/useTurnoVer";

//* FUNCIONES PARA FORMATEAR FECHAS Y UTILS
import { formatFechaTabla, formatDateTimeInput, formatSoloHora } from "../../utils/index";
import { formatearTurnoParaReprogramar } from "./utils/formatTurnoParaReprogramar";
import { estadosMap } from "./utils/estadosMap";

//* CONSTANTES
import { ESTADO_INICIAL_TURNO } from "./constants/turnosConstants";

//* FORMULARIOS Y VISTAS
import {
  FormularioAtender,
  FormularioCrearEditar,
  FormularioCancelar,
  FormularioEliminar,
  FormularioReprogramar,
} from "./components/FormulariosTurno";

export default function GestionTurnos() {
  //* HOOK DE PAGINACIÓN
  const {
    datos: turnos,
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
  } = usePaginationSearch("/turnos");

  //* HOOK DE DEPENDENCIAS
  const { pacientes } = useTurnoDependencies();

  //* HOOK DE CRUD MODAL
  const {
    modalAbierto,
    modalEliminar,
    editando,
    itemSeleccionado: turnoSeleccionado,
    datosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaEliminar,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL_TURNO);

  //* HOOK DE MODAL VER
  const { modalVer, turnoVer, practicasLista, abrirParaVer, cerrarVer } = useTurnoVer();

  //* HOOK DE MODAL ATENCION
  const {
    modalAtender,
    turnoSeleccionadoAtender,
    datosAtencion,
    obrasSocialesPaciente,
    abrirParaAtender,
    cerrarModalAtender,
    agregarPracticaAtencion,
    actualizarPracticaAtencion,
    actualizarDatosAtencion,
    eliminarPracticaAtencion,
  } = useTurnoAtenderModal();

  //* HOOK DE MODAL CANCELACION E INASISTENTE
  const {
    modalCancelar,
    inasistente,
    turnoSeleccionadoCancelar,
    datosCancelacion,
    abrirParaCancelar,
    abrirParaInasistente,
    actualizarDatosCancelacion,
    cerrarModalCancelar,
  } = useTurnoCancelarModal();

  //* HOOK DE MODAL REPROGRAMACION
  const {
    modalReprogramar,
    turnoSeleccionadoReprogramar,
    datosReprogramacion,
    abrirParaReprogramar,
    cerrarModalReprogramar,
    actualizarDatosReprogramacion,
  } = useTurnoReprogramarModal();

  //* HOOK DE PETICIONES API
  const {
    guardarTurno,
    procesarAtencionTurno,
    procesarCancelacionTurno,
    procesarReprogramacionTurno,
    ejecutarEliminacion,
  } = useTurnoActions(recargar, cerrarModal);

  return (
    <PageLayout onAdd={abrirParaCrear}>
      <div className="w-full flex flex-col gap-4 pb-24">
        {/* //* HEADER PRINCIPAL */}
        <Header
          icono={CalendarClock}
          titulo="Gestión de Turnos"
          subtitulo="Listado general y administración de turnos del consultorio"
          badge={`${total} Registrados`}
          botonAccion={
            <button
              type="button"
              onClick={abrirParaCrear}
              className="sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0"
            >
              <Plus size={18} />
              <span>Agendar Turno</span>
            </button>
          }
        />

        {/* //* BODY: TABLA */}
        <div className="w-full px-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            {/* //* TABLA: HEADER */}
            <TablaHeader
              inicioRegistro={inicioRegistro}
              finRegistro={finRegistro}
              total={total}
              search={search}
              setSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Buscar turnos..."
            />

            <div className="overflow-x-auto w-full">
              {/* //* TABLA: TABLA */}
              <Tabla
                cargando={cargando}
                sinDatosText="No se encontraron turnos registrados."
                columnas={[
                  { label: "ID", className: "hidden md:table-cell" },
                  { label: "Paciente" },
                  { label: "Fecha y Hora" },
                  { label: "Precio ($)", className: "hidden md:table-cell" },
                  { label: "Estado" },
                  { label: "Notas", className: "hidden md:table-cell" },
                  { label: "Acciones", align: "center" },
                ]}
              >
                {turnos.map((turno) => {
                  const estadoInfo = estadosMap[turno.EstadoTurno.estado] || {
                    color: "bg-gray-100 text-gray-600 border-gray-200",
                    icon: AlertCircle,
                  };
                  const IconoEstado = estadoInfo.icon;

                  return (
                    <tr key={turno.id_turno} className="hover:bg-gray-50/60 transition-colors">
                      {/* //* COLUMNAS: ID TURNO */}
                      <td className="hidden md:table-cell px-5 py-4 font-semibold text-gray-500 w-16 text-xs">
                        #{turno.id_turno}
                      </td>

                      {/* //* COLUMNAS: PACIENTE */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="hidden md:flex w-8 h-8 rounded-full bg-[#e8f7f1] text-[#2eb086] items-center justify-center font-bold text-xs shrink-0">
                            {turno.Paciente?.nombre?.charAt(0) || "P"}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800 text-sm">
                              {turno.Paciente
                                ? `${turno.Paciente.nombre} ${turno.Paciente.apellido}`
                                : `Paciente #${turno.id_paciente}`}
                            </span>
                            {turno.Paciente?.dni && (
                              <span className="text-xs text-gray-400 mt-0.5">DNI: {turno.Paciente.dni}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* //* COLUMNAS: FECHA INICIO Y FIN */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-0.5">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatFechaTabla(turno.fecha_hora_inicio)}
                          </span>
                          <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                            <Clock size={12} className="text-gray-400" />
                            {formatSoloHora(turno.fecha_hora_inicio)} - {formatSoloHora(turno.fecha_hora_fin)}{" "}
                            hs
                          </span>
                        </div>
                      </td>

                      {/* //* COLUMNAS: PRECIO FINAL */}
                      <td className="hidden md:table-cell px-5 py-4 font-semibold text-gray-800 text-sm">
                        ${Number(turno.precio_final).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>

                      {/* //* COLUMNAS: ESTADO */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${estadoInfo.color}`}
                        >
                          <IconoEstado size={14} />
                          <span>{turno.EstadoTurno.estado}</span>
                        </span>
                      </td>

                      {/* //* COLUMNAS: NOTAS CONSULTA */}
                      <td className="hidden md:table-cell px-5 py-4 text-gray-500 text-xs max-w-50 truncate">
                        {turno.notas_consulta || <span className="text-gray-300 italic">Sin notas</span>}
                      </td>

                      {/* //* COLUMNAS: ACCIONES */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              abrirParaVer(turno);
                            }}
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              abrirParaEditar(turno, (item) => ({
                                ...item,
                                fecha_hora_inicio: formatDateTimeInput(item.fecha_hora_inicio),
                                fecha_hora_fin: formatDateTimeInput(item.fecha_hora_fin),
                                duracion_minutos: item.duracion_minutos || 30,
                              }))
                            }
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Editar Turno"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirParaEliminar(turno)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Eliminar Turno"
                          >
                            <Trash2 size={18} />
                          </button>

                          {turno.EstadoTurno.estado === "Programado" && (
                            <BotonAccionesTurno
                              turno={turno}
                              abrirParaAtender={abrirParaAtender}
                              abrirParaReprogramar={(t) =>
                                abrirParaReprogramar(t, formatearTurnoParaReprogramar)
                              }
                              abrirParaCancelar={abrirParaCancelar}
                              abrirParaInasistente={abrirParaInasistente}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </Tabla>
            </div>

            {/* //* TABLA: PAGINACION */}
            <TablaPaginacion page={page} setPage={setPage} totalPages={totalPages} />
          </div>
        </div>

        {/* //* MODALES: VISTA TURNO */}
        <VistaTurno
          isOpen={modalVer}
          onClose={() => cerrarVer()}
          turno={turnoVer}
          abrirParaReprogramar={(turno) => abrirParaReprogramar(turno, formatearTurnoParaReprogramar)}
        />

        {/* //* MODALES: CREAR Y EDITAR */}
        {modalAbierto && (
          <FormularioCrearEditar
            modalAbierto={modalAbierto}
            cerrarModal={cerrarModal}
            editando={editando}
            pacientes={pacientes}
            datosFormulario={datosFormulario}
            actualizarDatos={actualizarDatos}
            guardarTurno={(e) => {
              e.preventDefault();
              guardarTurno(datosFormulario, editando, turnoSeleccionado);
            }}
            abrirModalAtenderDesdeEdicion={() => abrirParaAtender(turnoSeleccionado)}
            abrirModalCancelarDesdeEdicion={() => abrirParaCancelar(turnoSeleccionado)}
            abrirModalInasistenteDesdeEdicion={() => abrirParaInasistente(turnoSeleccionado)}
            abrirModalReprogramarDesdeEdicion={() =>
              abrirParaReprogramar(turnoSeleccionado, formatearTurnoParaReprogramar)
            }
          />
        )}

        {/* //* MODALES: ATENDER */}
        {modalAtender && (
          <FormularioAtender
            modalAtenderAbierto={modalAtender}
            cerrarModal={cerrarModalAtender}
            turnoSeleccionado={turnoSeleccionadoAtender}
            datosAtencion={datosAtencion}
            practicasLista={practicasLista}
            pacientesObrasSociales={obrasSocialesPaciente}
            agregarPracticaAtencion={agregarPracticaAtencion}
            actualizarPracticaAtencion={actualizarPracticaAtencion}
            actualizarDatosAtencion={actualizarDatosAtencion}
            eliminarPracticaAtencion={eliminarPracticaAtencion}
            procesarAtencionTurno={(e) => {
              e.preventDefault();
              procesarAtencionTurno(datosAtencion, turnoSeleccionadoAtender, cerrarModalAtender);
            }}
          />
        )}

        {/* //* MODALES: CANCELAR E INASISTENTE */}
        {modalCancelar && (
          <FormularioCancelar
            modalCancelarAbierto={modalCancelar}
            cerrarModal={cerrarModalCancelar}
            turnoSeleccionado={turnoSeleccionadoCancelar}
            inasistente={inasistente}
            notasCanceladoInasistente={datosCancelacion}
            actualizarDatosCancelacion={actualizarDatosCancelacion}
            procesarCancelacionTurno={(e) => {
              e.preventDefault();
              procesarCancelacionTurno(
                inasistente,
                turnoSeleccionadoCancelar,
                datosCancelacion,
                cerrarModalCancelar,
              );
            }}
          />
        )}

        {/* //* MODALES: REPROGRAMAR */}
        {modalReprogramar && (
          <FormularioReprogramar
            modalReprogramarAbierto={modalReprogramar}
            cerrarModal={cerrarModalReprogramar}
            turnoSeleccionado={turnoSeleccionadoReprogramar}
            datosReprogramacion={datosReprogramacion}
            actualizarDatosReprogramacion={actualizarDatosReprogramacion}
            procesarReprogramacionTurno={(e) => {
              e.preventDefault();
              procesarReprogramacionTurno(
                datosReprogramacion,
                turnoSeleccionadoReprogramar,
                cerrarModalReprogramar,
              );
            }}
          />
        )}

        {/* //* MODALES: ELIMINAR */}
        {modalEliminar && (
          <FormularioEliminar
            modalEliminar={modalEliminar}
            cerrarModal={cerrarModal}
            turnoSeleccionado={turnoSeleccionado}
            ejecutarEliminacion={() => ejecutarEliminacion(turnoSeleccionado)}
          />
        )}
      </div>
    </PageLayout>
  );
}
