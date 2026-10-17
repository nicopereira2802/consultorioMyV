/** @format */

//* IMPORTACION DE ICONOS Y useEffect
import { useState, useEffect } from "react";
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
  BanknoteArrowDown,
  MoreVertical,
} from "lucide-react";

//* IMPORTACION DE API
import api from "../../services/api";

//* IMPORTACION DE COMPONENTES COMUNES REUTILIZABLES
import Header from "../../components/common/Header";
import Tabla from "../../components/common/Tabla/Tabla";
import TablaHeader from "../../components/common/Tabla/TablaHeader";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";

//* IMPORTACION DE HOOKS (para modales y paginacion) Y CONTEXT (para el boton flotante para telefono)
import { useTurnoPaginationSearch } from "./hooks/useTurnoPaginationSearch";
import { useTurnoCRUDModal } from "./hooks/useTurnoCRUDModal";
import { useFloatingButton } from "../../context/BotonFlotanteContext";

//* IMPORTACION DE FUNCIONES PARA FORMATEAR FECHAS
import { formatFechaTabla, formatDateTimeInput, formatSoloHora } from "../../utils/index";

//* IMPORTACION DE FORMULARIOS
import {
  FormularioAtender,
  FormularioCrearEditar,
  FormularioCancelar,
  FormularioEliminar,
  FormularioReprogramar,
} from "./components/FormulariosTurno";
import { VistaTurno } from "./components/VistaTurno";

// Mapeo básico de estados
const estadosMap = {
  Programado: {
    id_estado: 1,
    color: "bg-amber-50 text-amber-700 border-amber-200/60",
    icon: Clock,
  },
  Atendido: {
    id_estado: 2,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    icon: CheckCircle2,
  },
  Cancelado: {
    id_estado: 3,
    color: "bg-red-50 text-red-700 border-red-200/60",
    icon: XCircle,
  },
  Inasistente: {
    id_estado: 4,
    color: "bg-[#f0f6f9] text-[#2b5d73] border-[#93BBCF]",
    icon: UserRoundX,
  },
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

const ESTADO_INICIAL_ATENCION = {
  notas_consulta: "",
  precio_final: 0,
  practicas: [],
};

const ESTADO_INICIAL_REPROGRAMAR = {
  fecha_hora_inicio: "",
  duracion_minutos: 30,
  fecha_hora_fin: "",
};

const ESTADO_INICIAL_CANCELAR = {
  notas_consulta: "",
};

export default function GestionTurnos() {
  //* MOSTRAMOS EL BOTON FLOTANTE
  const { setFloatingAction } = useFloatingButton();

  //* CARGAMOS CON DATOS LOS HOOKS
  const {
    // Estados de modales
    modalAbierto,
    editando,
    modalAtender,
    modalReprogramar,
    modalCancelar,
    inasistente,
    modalVer,
    setModalVer,
    modalEliminar,

    // Selección y datos
    itemSeleccionado: turnoSeleccionado,
    setItemSeleccionado: setTurnoSeleccionado,
    datosFormulario,
    setDatosFormulario,
    datosAtencion,
    setDatosAtencion,
    datosReprogramacion,
    setDatosReprogramacion,
    datosCancelacion,
    setDatosCancelacion,

    // Funciones de apertura
    abrirParaVer,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaAtender,
    abrirParaCancelar,
    abrirParaInasistente,
    abrirParaReprogramar,
    abrirParaEliminar,

    // Utilidades y acciones
    cerrarModal,
    actualizarDatos,
    actualizarDatosReprogramacion,
    agregarPracticaAtencion,
    actualizarPracticaAtencion,
    eliminarPracticaAtencion,
  } = useTurnoCRUDModal(
    ESTADO_INICIAL,
    ESTADO_INICIAL_ATENCION,
    ESTADO_INICIAL_REPROGRAMAR,
    ESTADO_INICIAL_CANCELAR,
  );

  const {
    turnos: turnos,
    pacientes: pacientes,
    practicasLista: practicasLista,
    obrasSocialesPaciente: obrasSocialesPaciente,
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

  /* ─── ESTADO PARA MENÚ DESPLEGABLE DE ACCIONES ───────────── */
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);

  // * useEffect PARA QUE AL TOCAR EL BOTON SE ABRA EL MODAL
  // ? NO ENTIENDO MUY BIEN QUE HACE
  // ! DEBERIAMOS CORREGIR ESTO, NO ES UNA BUENA PRACTICA
  useEffect(() => {
    setFloatingAction(() => modalAbierto);

    return () => setFloatingAction(null);
  }, [modalAbierto, setFloatingAction]);

  useEffect(() => {
    if (datosFormulario.fecha_hora_inicio && datosFormulario.duracion_minutos) {
      calcularHoraFin(datosFormulario.fecha_hora_inicio, datosFormulario.duracion_minutos);
    }
  }, [datosFormulario.fecha_hora_inicio, datosFormulario.duracion_minutos]);

  // UseEffect específico para calcular la fecha fin en el modal de reprogramar
  useEffect(() => {
    if (datosReprogramacion.fecha_hora_inicio && datosReprogramacion.duracion_minutos) {
      const inicio = new Date(datosReprogramacion.fecha_hora_inicio);
      const minutos = parseInt(datosReprogramacion.duracion_minutos, 10);
      if (!isNaN(inicio.getTime()) && !isNaN(minutos)) {
        const fin = new Date(inicio.getTime() + minutos * 60000);
        const isoFin = new Date(fin.getTime() - fin.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setDatosReprogramacion((prev) => ({ ...prev, fecha_hora_fin: isoFin }));
      }
    }
  }, [datosReprogramacion.fecha_hora_inicio, datosReprogramacion.duracion_minutos]);

  useEffect(() => {
    if (turnoSeleccionado && turnoSeleccionado.id_paciente) {
      buscarOSPaciente(turnoSeleccionado.id_paciente);
    }
  }, [modalAtender === true]);

  useEffect(() => {
    let total = 0;
    datosAtencion.practicas.forEach((item) => {
      if (item.id_practica) {
        const encontrada = practicasLista.find((p) => Number(p.id_practica) === Number(item.id_practica));
        if (encontrada) {
          total += Number(encontrada.precio_referencia || 0);
        }
      }
    });
    setDatosAtencion((prev) => ({ ...prev, precio_final: total }));
  }, [datosAtencion.practicas, practicasLista]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuAbiertoId !== null && !event.target.closest(".menu-acciones-container")) {
        setMenuAbiertoId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuAbiertoId]);

  /* ─── PETICIONES API ─────────────────────────────────── */

  const calcularHoraFin = (fecha_inicio, duracion_minutos) => {
    const inicio = new Date(fecha_inicio);
    const minutos = parseInt(duracion_minutos, 10);

    if (!isNaN(inicio.getTime()) && !isNaN(minutos)) {
      const fin = new Date(inicio.getTime() + minutos * 60000);
      const isoFin = new Date(fin.getTime() - fin.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

      setDatosFormulario((prev) => ({
        ...prev,
        fecha_hora_fin: isoFin,
      }));
    }
  };

  const procesarFormulario = async (e) => {
    e.preventDefault();
    if (!datosFormulario.id_paciente) {
      alert("Por favor seleccione un paciente.");
      return;
    }

    try {
      const { duracion_minutos, ...restoDatos } = datosFormulario;
      const payload = {
        ...restoDatos,
        id_paciente: Number(restoDatos.id_paciente),
        id_estado: Number(restoDatos.id_estado),
        precio_final: parseFloat(restoDatos.precio_final),
        fecha_hora_inicio: new Date(restoDatos.fecha_hora_inicio).toISOString(),
        fecha_hora_fin: new Date(restoDatos.fecha_hora_fin).toISOString(),
        notas_consulta: restoDatos.notas_consulta?.trim() || "",
      };

      if (editando) {
        await api.put(`/turnos/${turnoSeleccionado.id_turno}`, payload);
      } else {
        await api.post("/turnos", payload);
      }

      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar el turno:", error);
      if (error.response?.status === 409) {
        alert("El horario seleccionado se superpone con otro turno existente.");
      } else {
        alert("Ocurrió un error al procesar el turno.");
      }
    }
  };

  const procesarAtencionTurno = async (e) => {
    e.preventDefault();
    if (!turnoSeleccionado) return;

    try {
      const payloadAtencion = {
        notas_consulta: datosAtencion.notas_consulta.trim(),
        precio_final: parseFloat(datosAtencion.precio_final),
        practicas_realizadas: datosAtencion.practicas
          .filter((p) => p.id_practica)
          .map((p) => Number(p.id_practica)),
        obras_sociales: datosAtencion.practicas
          .filter((p) => p.id_practica)
          .map((p) => (p.id_obra_social ? Number(p.id_obra_social) : null)),
      };

      await api.patch(`/turnos/${turnoSeleccionado.id_turno}/atender`, payloadAtencion);

      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al registrar la atención del turno:", error);
      alert(error.response?.data?.error || "Ocurrió un error al registrar la atención.");
    }
  };

  const procesarCancelacionTurno = async (e) => {
    e.preventDefault();
    if (!turnoSeleccionado) return;

    try {
      const payloadAtencion = {
        notas_consulta: datosCancelacion.notas_consulta.trim(),
      };

      if (inasistente) {
        await api.patch(`/turnos/${turnoSeleccionado.id_turno}/inasistente`, payloadAtencion);
      } else {
        await api.patch(`/turnos/${turnoSeleccionado.id_turno}/cancelar`, payloadAtencion);
      }

      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al registrar la cancelación del turno:", error);
      alert(error.response?.data?.error || "Ocurrió un error al registrar la cancelación.");
    }
  };

  // Función que procesa la petición PATCH hacia turnos/:id/reprogramado
  const procesarReprogramacionTurno = async (e) => {
    e.preventDefault();
    if (!turnoSeleccionado) return;

    try {
      await api.patch(`/turnos/${turnoSeleccionado.id_turno}/reprogramado`, {
        fecha_hora_inicio: new Date(datosReprogramacion.fecha_hora_inicio).toISOString(),
        fecha_hora_fin: new Date(datosReprogramacion.fecha_hora_fin).toISOString(),
      });

      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al reprogramar el turno:", error);
      if (error.response?.status === 409) {
        alert("El horario seleccionado se superpone con otro turno existente.");
      } else {
        alert(error.response?.data?.error || "No se pudo reprogramar el turno.");
      }
    }
  };

  const eliminarTurno = async () => {
    if (!turnoSeleccionado) return;
    try {
      await api.patch(`/turnos/${turnoSeleccionado.id_turno}/delete`);
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al eliminar turno:", error);
      alert("No se pudo eliminar el turno.");
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-24">
      {/* //* HEADER CON TITULO Y BOTON */}
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
          {/* //* TABLA: BARRA SUPERIOR REUTILIZABLE */}
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

          {/* //* TABLA: TABLA */}
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
              {turnos.map((turno, index) => {
                const estadoInfo = estadosMap[turno.EstadoTurno.estado] || {
                  nombre: "Desconocido",
                  color: "bg-gray-100 text-gray-600 border-gray-200",
                  icon: AlertCircle,
                };
                const IconoEstado = estadoInfo.icon;
                const menuEstaAbierto = menuAbiertoId === turno.id_turno;
                const esUltimasFilas = index >= turnos.length - 2;
                return (
                  <tr key={turno.id_turno} className="hover:bg-gray-50/60 transition-colors">
                    {/* //* COLUMNAS: ID TURNO */}
                    <td className="hidden md:table-cell px-5 py-4 font-semibold text-gray-500 w-16 text-xs">
                      #{turno.id_turno}
                    </td>

                    {/* //* COLUMNAS: NOMBRE Y APELLIDO */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="hidden md:flex w-8 h-8 rounded-full bg-[#e8f7f1] text-[#2eb086] items-center justify-center font-bold text-xs shrink-0">
                          {turno.Paciente?.nombre?.charAt(0) || "P"}
                          {turno.Paciente?.apellido?.charAt(0) || ""}
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

                    {/* //* COLUMNAS: NOMBRE Y APELLIDO */}
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
                      $
                      {Number(turno.precio_final).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
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

                    {/* //* COLUMNAS: NOTAS DE CONSULTA */}
                    <td className="hidden md:table-cell px-5 py-4 text-gray-500 text-xs max-w-50 truncate">
                      {turno.notas_consulta || <span className="text-gray-300 italic">Sin notas</span>}
                    </td>

                    {/* //* COLUMNAS: ACCIONES */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 relative">
                        <button
                          type="button"
                          onClick={() => abrirParaVer(turno)}
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
                          <div className="relative menu-acciones-container">
                            <button
                              type="button"
                              onClick={() => setMenuAbiertoId(menuEstaAbierto ? null : turno.id_turno)}
                              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                              title="Más opciones"
                            >
                              <MoreVertical size={18} />
                            </button>

                            {menuEstaAbierto && (
                              <div
                                className={`absolute right-0 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 flex flex-col ${
                                  esUltimasFilas ? "bottom-full mb-2" : "top-full mt-2"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuAbiertoId(null);
                                    abrirParaAtender(turno);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
                                >
                                  <CheckSquare size={16} />
                                  <span>Atender Turno</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuAccionesAbierto(false);
                                    if (abrirParaReprogramar) abrirParaReprogramar();
                                  }}
                                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#3B7A94] hover:bg-[#f0f6f9] transition-colors text-left"
                                >
                                  <CalendarDays size={16} />
                                  <span>Reprogramar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuAbiertoId(null);
                                    abrirParaCancelar(turno);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                                >
                                  <X size={16} />
                                  <span>Cancelar Turno</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuAbiertoId(null);
                                    abrirParaInasistente(turno);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium hover:bg-[#f0f6f9] text-[#2b5d73] transition-colors text-left"
                                >
                                  <UserRoundX size={16} />
                                  <span>Inasistente</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {turno.EstadoTurno.estado === "Atendido" && (
                          <div className="relative menu-acciones-container">
                            <button
                              type="button"
                              onClick={() => setMenuAbiertoId(menuEstaAbierto ? null : turno.id_turno)}
                              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                              title="Más opciones"
                            >
                              <MoreVertical size={18} />
                            </button>

                            {menuEstaAbierto && (
                              <div
                                className={`absolute right-0 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 flex flex-col ${
                                  esUltimasFilas ? "bottom-full mb-2" : "top-full mt-2"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuAbiertoId(null);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <BanknoteArrowDown size={16} />
                                  <span>Cobrar</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Tabla>
          </div>

          {/* //* PAGINACION */}
          <TablaPaginacion page={page} setPage={setPage} totalPages={totalPages} />
        </div>
      </div>

      {/* //* MODALES: VER TURNO */}
      <VistaTurno
        isOpen={modalVer}
        onClose={() => {
          setModalVer(false);
          setTurnoSeleccionado(null);
        }}
        turno={turnoSeleccionado}
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
          procesarFormulario={procesarFormulario}
        />
      )}

      {/* //* MODALES: REPROGRAMAR */}
      {modalReprogramar && (
        <FormularioReprogramar
          modalReprogramarAbierto={modalReprogramar}
          cerrarModal={cerrarModal}
          turnoSeleccionado={turnoSeleccionado}
          datosReprogramacion={datosReprogramacion}
          actualizarDatosReprogramacion={actualizarDatosReprogramacion}
          procesarReprogramacionTurno={procesarReprogramacionTurno}
        />
      )}

      {/* //* MODALES: ATENDER */}
      {modalAtender && (
        <FormularioAtender
          modalAtenderAbierto={modalAtender}
          cerrarModal={cerrarModal}
          turnoSeleccionado={turnoSeleccionado}
          datosAtencion={datosAtencion}
          setDatosAtencion={setDatosAtencion}
          practicasLista={practicasLista}
          pacientesObrasSociales={obrasSocialesPaciente}
          agregarPracticaAtencion={agregarPracticaAtencion}
          actualizarPracticaAtencion={actualizarPracticaAtencion}
          eliminarPracticaAtencion={eliminarPracticaAtencion}
          procesarAtencionTurno={procesarAtencionTurno}
        />
      )}

      {/* //* MODALES: CANCELAR */}
      {modalCancelar && (
        <FormularioCancelar
          modalCancelarAbierto={modalCancelar}
          cerrarModal={cerrarModal}
          turnoSeleccionado={turnoSeleccionado}
          inasistente={inasistente}
          notasCanceladoInasistente={datosCancelacion}
          setNotasCanceladoInasistente={setDatosCancelacion}
          procesarCancelacionTurno={procesarCancelacionTurno}
        />
      )}

      {/* //* MODALES: ELIMINAR */}
      {modalEliminar && (
        <FormularioEliminar
          modalEliminar={modalEliminar}
          cerrarModal={cerrarModal}
          turnoSeleccionado={turnoSeleccionado}
          ejecutarEliminacion={eliminarTurno}
        />
      )}
    </div>
  );
}
