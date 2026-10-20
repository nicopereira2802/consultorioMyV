/** @format */

import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import { formatFechaTabla, formatDateTimeInput, formatSoloHora } from "../../utils/index";
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CalendarClock,
  CheckSquare,
  X,
  UserRoundX,
  CalendarDays,
  Eye,
  MoreVertical,
} from "lucide-react";

import Header from "../../components/common/Header";
import Tabla from "../../components/common/Tabla/Tabla";
import TablaHeader from "../../components/common/Tabla/TablaHeader";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";
import MenuFlotantePortal from "../../components/common/MenuFlotantePortal";
import PageLayout from "../../components/layout/PageLayout";

//* HOOKS
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { useTurnoPaginationSearch } from "./hooks/useTurnoPaginationSearch";
import { useTurnoAtenderModal } from "./hooks/useTurnoAtenderModal";
import { useTurnoCancelarModal } from "./hooks/useTurnoCancelarModal";
import { useTurnoReprogramarModal } from "./hooks/useTurnoReprogramarModal";
import { useTurnoActions } from "./hooks/useTurnoActions";

//* FORMULARIOS Y VISTAS
import {
  FormularioAtender,
  FormularioCrearEditar,
  FormularioCancelar,
  FormularioEliminar,
  FormularioReprogramar,
} from "./components/FormulariosTurno";
import { VistaTurno } from "./components/VistaTurno";
import { formatearTurnoParaReprogramar } from "./utils/formatTurnoParaReprogramar";
import { calcularHoraFin } from "./utils/calcularHoraFin";

const estadosMap = {
  Programado: { id_estado: 1, color: "bg-amber-50 text-amber-700 border-amber-200/60", icon: Clock },
  Atendido: {
    id_estado: 2,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    icon: CheckCircle2,
  },
  Cancelado: { id_estado: 3, color: "bg-red-50 text-red-700 border-red-200/60", icon: XCircle },
  Inasistente: { id_estado: 4, color: "bg-[#f0f6f9] text-[#2b5d73] border-[#93BBCF]", icon: UserRoundX },
};

const ESTADO_INICIAL = {
  id_paciente: "",
  id_estado: 1,
  fecha_hora_inicio: "",
  fecha_hora_fin: "",
  duracion_minutos: 30,
  precio_final: 0,
  notas_consulta: "",
};

const ESTADO_INICIAL_ATENCION = { notas_consulta: "", precio_final: 0, practicas: [] };
const ESTADO_INICIAL_REPROGRAMAR = { fecha_hora_inicio: "", duracion_minutos: 30, fecha_hora_fin: "" };
const ESTADO_INICIAL_CANCELAR = { notas_consulta: "" };

/* ─── SUBCOMPONENTE DE ACCIONES CON PORTAL ─────────────────── */
function BotonAccionesTurno({
  turno,
  menuEstaAbierto,
  setMenuAbiertoId,
  abrirParaAtender,
  abrirParaReprogramar,
  abrirParaCancelar,
  abrirParaInasistente,
}) {
  const botonRef = useRef(null);

  const ejecutarAccion = (e, callback) => {
    e.stopPropagation();
    setMenuAbiertoId(null);
    setTimeout(() => {
      if (typeof callback === "function") {
        callback(turno);
      }
    }, 0);
  };

  return (
    <div className="relative menu-acciones-container">
      <button
        ref={botonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setMenuAbiertoId(menuEstaAbierto ? null : turno.id_turno);
        }}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={18} />
      </button>

      <MenuFlotantePortal targetRef={botonRef} isOpen={menuEstaAbierto}>
        <button
          type="button"
          onClick={(e) => ejecutarAccion(e, abrirParaAtender)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 text-left transition-colors"
        >
          <CheckSquare size={16} />
          <span>Atender Turno</span>
        </button>

        <button
          type="button"
          onClick={(e) => ejecutarAccion(e, (t) => abrirParaReprogramar(t, formatearTurnoParaReprogramar))}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#3B7A94] hover:bg-[#f0f6f9] text-left transition-colors"
        >
          <CalendarDays size={16} />
          <span>Reprogramar</span>
        </button>

        <button
          type="button"
          onClick={(e) => ejecutarAccion(e, abrirParaCancelar)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 text-left transition-colors"
        >
          <X size={16} />
          <span>Cancelar Turno</span>
        </button>

        <button
          type="button"
          onClick={(e) => ejecutarAccion(e, abrirParaInasistente)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#2b5d73] hover:bg-[#f0f6f9] text-left transition-colors"
        >
          <UserRoundX size={16} />
          <span>Inasistente</span>
        </button>
      </MenuFlotantePortal>
    </div>
  );
}

/* ─── COMPONENTE PRINCIPAL ─────────────────────────────────── */
export default function GestionTurnos() {
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);
  const [modalVer, setModalVer] = useState(false);
  const [turnoVer, setTurnoVer] = useState(null);

  // 1. Hook CRUD Genérico (Crear, Editar, Eliminar)
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
  } = useCRUDModal(ESTADO_INICIAL);

  // 2. Hooks Modulares Específicos
  const {
    modalAtender,
    turnoSeleccionadoAtender,
    datosAtencion,
    setDatosAtencion,
    abrirParaAtender,
    cerrarModalAtender,
    agregarPracticaAtencion,
    actualizarPracticaAtencion,
    eliminarPracticaAtencion,
  } = useTurnoAtenderModal(ESTADO_INICIAL_ATENCION);

  const {
    modalCancelar,
    inasistente,
    turnoSeleccionadoCancelar,
    datosCancelacion,
    setDatosCancelacion,
    abrirParaCancelar,
    abrirParaInasistente,
    cerrarModalCancelar,
  } = useTurnoCancelarModal(ESTADO_INICIAL_CANCELAR);

  const {
    modalReprogramar,
    turnoSeleccionadoReprogramar,
    datosReprogramacion,
    setDatosReprogramacion,
    abrirParaReprogramar,
    cerrarModalReprogramar,
    actualizarDatosReprogramacion,
  } = useTurnoReprogramarModal(ESTADO_INICIAL_REPROGRAMAR);

  // 3. Hook de Paginación y Búsqueda
  const {
    turnos,
    pacientes,
    practicasLista,
    obrasSocialesPaciente,
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
    buscarOSPaciente,
  } = useTurnoPaginationSearch("/turnos");

  const {
    guardarTurno,
    procesarAtencionTurno,
    procesarCancelacionTurno,
    procesarReprogramacionTurno,
    ejecutarEliminacion,
  } = useTurnoActions(recargar, cerrarModal);

  // Cálculos de hora fin (Creación / Edición)
  useEffect(() => {
    calcularHoraFin(datosFormulario, actualizarDatos);
  }, [datosFormulario.fecha_hora_inicio, datosFormulario.duracion_minutos]);

  // Cálculos de hora fin (Reprogramación)
  useEffect(() => {
    calcularHoraFin(datosReprogramacion, actualizarDatosReprogramacion);
  }, [datosReprogramacion.fecha_hora_inicio, datosReprogramacion.duracion_minutos]);

  // Cargar obras sociales al atender
  useEffect(() => {
    if (turnoSeleccionadoAtender && turnoSeleccionadoAtender.id_paciente && modalAtender) {
      buscarOSPaciente(turnoSeleccionadoAtender.id_paciente);
    }
  }, [modalAtender, turnoSeleccionadoAtender]);

  // Calcular precio final según prácticas
  useEffect(() => {
    let totalPrecio = 0;
    datosAtencion.practicas.forEach((item) => {
      if (item.id_practica) {
        const encontrada = practicasLista.find((p) => Number(p.id_practica) === Number(item.id_practica));
        if (encontrada) totalPrecio += Number(encontrada.precio_referencia || 0);
      }
    });
    setDatosAtencion((prev) => ({ ...prev, precio_final: totalPrecio }));
  }, [datosAtencion.practicas, practicasLista]);

  // Cerrar menú de acciones al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuAbiertoId !== null && !event.target.closest(".menu-acciones-container")) {
        setMenuAbiertoId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuAbiertoId]);

  return (
    <PageLayout onAdd={abrirParaCrear}>
      <div className="w-full flex flex-col gap-4 pb-24">
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

        <div className="w-full px-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
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
                  const menuEstaAbierto = menuAbiertoId === turno.id_turno;

                  return (
                    <tr key={turno.id_turno} className="hover:bg-gray-50/60 transition-colors">
                      <td className="hidden md:table-cell px-5 py-4 font-semibold text-gray-500 w-16 text-xs">
                        #{turno.id_turno}
                      </td>
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
                      <td className="hidden md:table-cell px-5 py-4 font-semibold text-gray-800 text-sm">
                        ${Number(turno.precio_final).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${estadoInfo.color}`}
                        >
                          <IconoEstado size={14} />
                          <span>{turno.EstadoTurno.estado}</span>
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-5 py-4 text-gray-500 text-xs max-w-50 truncate">
                        {turno.notas_consulta || <span className="text-gray-300 italic">Sin notas</span>}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTurnoVer(turno);
                              setModalVer(true);
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
                              menuEstaAbierto={menuEstaAbierto}
                              setMenuAbiertoId={setMenuAbiertoId}
                              abrirParaAtender={abrirParaAtender}
                              abrirParaReprogramar={abrirParaReprogramar}
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

            <TablaPaginacion page={page} setPage={setPage} totalPages={totalPages} />
          </div>
        </div>

        {/* MODALES */}
        <VistaTurno
          isOpen={modalVer}
          onClose={() => setModalVer(false)}
          turno={turnoVer}
          abrirParaReprogramar={(turno) => abrirParaReprogramar(turno, formatearTurnoParaReprogramar)}
        />

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

        {modalReprogramar && (
          <FormularioReprogramar
            modalReprogramarAbierto={modalReprogramar}
            cerrarModal={cerrarModalReprogramar}
            turnoSeleccionado={turnoSeleccionadoReprogramar}
            datosReprogramacion={datosReprogramacion}
            actualizarDatosReprogramacion={actualizarDatosReprogramacion}
            procesarReprogramacionTurno={(e) => {
              e.preventDefault();
              procesarReprogramacionTurno(datosReprogramacion, turnoSeleccionado);
            }}
          />
        )}

        {modalAtender && (
          <FormularioAtender
            modalAtenderAbierto={modalAtender}
            cerrarModal={cerrarModalAtender}
            turnoSeleccionado={turnoSeleccionadoAtender}
            datosAtencion={datosAtencion}
            setDatosAtencion={setDatosAtencion}
            practicasLista={practicasLista}
            pacientesObrasSociales={obrasSocialesPaciente}
            agregarPracticaAtencion={agregarPracticaAtencion}
            actualizarPracticaAtencion={actualizarPracticaAtencion}
            eliminarPracticaAtencion={eliminarPracticaAtencion}
            procesarAtencionTurno={(e) => {
              e.preventDefault();
              procesarAtencionTurno(datosAtencion, turnoSeleccionado);
            }}
          />
        )}

        {modalCancelar && (
          <FormularioCancelar
            modalCancelarAbierto={modalCancelar}
            cerrarModal={cerrarModalCancelar}
            turnoSeleccionado={turnoSeleccionadoCancelar}
            inasistente={inasistente}
            notasCanceladoInasistente={datosCancelacion}
            setNotasCanceladoInasistente={setDatosCancelacion}
            procesarCancelacionTurno={(e) => {
              e.preventDefault();
              procesarCancelacionTurno(inasistente, turnoSeleccionadoCancelar, datosCancelacion);
            }}
          />
        )}

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
