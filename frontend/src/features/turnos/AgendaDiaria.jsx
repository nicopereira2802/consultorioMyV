/** @format */

import { useState, useEffect } from "react";
import { Calendar, AlertTriangle, X, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/common/Header";
import AgendaCalendario from "./components/AgendaCalendario";

//* IMPORTACION DE HOOKS
import { useTurnoSearchAgenda } from "./hooks/useTurnoSearchAgenda";
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { useTurnoAtenderModal } from "./hooks/useTurnoAtenderModal";
import { useTurnoCancelarModal } from "./hooks/useTurnoCancelarModal";
import { useTurnoReprogramarModal } from "./hooks/useTurnoReprogramarModal";
import { useTurnoActions } from "./hooks/useTurnoActions";

//* UTILIDADES Y FUNCIONES EXTERNAS
import { formatDateTimeInput, formatFechaCortaTexto } from "../../utils/index";
import { calcularHoraFin } from "./utils/calcularHoraFin";
import { formatearTurnoParaReprogramar } from "./utils/formatTurnoParaReprogramar";

//* IMPORTACION DE FORMULARIOS
import {
  FormularioCrearEditar,
  FormularioAtender,
  FormularioCancelar,
  FormularioReprogramar,
} from "./components/FormulariosTurno";

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

export default function AgendaDiaria() {
  const navigate = useNavigate();
  const [advertenciaVisible, setAdvertenciaVisible] = useState(true);

  // 1. Hook CRUD Genérico (Crear, Editar)
  const {
    modalAbierto,
    editando,
    itemSeleccionado: turnoSeleccionado,
    datosFormulario,
    setDatosFormulario,
    abrirParaCrear,
    abrirParaEditar,
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

  // 3. Paginación y Búsqueda de Turnos
  const { turnos, pacientes, practicasLista, obrasSocialesPaciente, recargar, buscarOSPaciente } =
    useTurnoSearchAgenda("/turnos/agenda");

  // 4. Hook de Acciones API unificadas
  const { guardarTurno, procesarAtencionTurno, procesarCancelacionTurno, procesarReprogramacionTurno } =
    useTurnoActions(recargar, cerrarModal);

  /* ─── EFECTOS ─────────────────────────────────────────── */
  // Cálculo de hora fin (Creación / Edición) usando la utilidad externa
  useEffect(() => {
    calcularHoraFin(datosFormulario, setDatosFormulario);
  }, [datosFormulario.fecha_hora_inicio, datosFormulario.duracion_minutos]);

  // Cálculo de hora fin (Reprogramación) usando la utilidad externa
  useEffect(() => {
    calcularHoraFin(datosReprogramacion, setDatosReprogramacion);
  }, [datosReprogramacion.fecha_hora_inicio, datosReprogramacion.duracion_minutos]);

  // Cargar obras sociales al atender
  useEffect(() => {
    if (turnoSeleccionadoAtender && turnoSeleccionadoAtender.id_paciente && modalAtender) {
      buscarOSPaciente(turnoSeleccionadoAtender.id_paciente);
    }
  }, [modalAtender, turnoSeleccionadoAtender]);

  // Cálculo automático del precio en base a las prácticas seleccionadas
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

  const pacientesIncompletos = pacientes.filter((p) => !p.dni || !p.domicilio || !p.fecha_nacimiento);

  const obtenerCamposFaltantes = (p) => {
    const faltantes = [];
    if (!p.dni) faltantes.push("DNI");
    if (!p.domicilio) faltantes.push("domicilio");
    if (!p.fecha_nacimiento) faltantes.push("fecha de nacimiento");
    return faltantes.join(", ");
  };

  const manejarSeleccionFechaCalendario = (selectInfo) => {
    if (selectInfo && selectInfo.startStr) {
      const fechaInicioFormateada = formatDateTimeInput(selectInfo.startStr);

      abrirParaCrear();

      setDatosFormulario((prev) => ({
        ...prev,
        fecha_hora_inicio: fechaInicioFormateada,
      }));
    }
  };

  const procesarClickEnTurno = (clickInfo) => {
    const turnoEncontrado = turnos.find((t) => String(t.id_turno) === String(clickInfo.event.id));
    if (turnoEncontrado) {
      abrirParaEditar(turnoEncontrado, (item) => ({
        ...item,
        fecha_hora_inicio: formatDateTimeInput(item.fecha_hora_inicio),
        fecha_hora_fin: formatDateTimeInput(item.fecha_hora_fin),
        duracion_minutos: item.duracion_minutos || 30,
      }));
    }
  };

  /* ─── RETORNO DE LA PAGINA ─────────────────────────────────── */
  return (
    <div className="w-full h-screen flex flex-col pb-20 md:pb-0">
      <Header
        icono={Calendar}
        titulo="Agenda de Turnos"
        subtitulo="Gestión horaria y turnos del consultorio odontológico"
        badge={formatFechaCortaTexto(new Date())}
      />

      {advertenciaVisible && pacientesIncompletos.length > 0 && (
        <div className="mx-4 mt-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-2 text-amber-800 shadow-sm transition-all duration-200 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm font-semibold">
                Hay {pacientesIncompletos.length}{" "}
                {pacientesIncompletos.length > 1 ? "pacientes creados " : "paciente creado "}
                con datos faltantes:
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAdvertenciaVisible(false)}
              className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="pl-8 flex flex-col gap-1 text-xs">
            {pacientesIncompletos.map((paciente) => (
              <div
                key={paciente.id_paciente}
                className="flex items-center justify-between py-1 border-b border-amber-200/50 last:border-0"
              >
                <span>
                  <strong className="font-medium text-amber-900">
                    {paciente.nombre} {paciente.apellido}
                  </strong>{" "}
                  - Faltan:{" "}
                  <span className="text-amber-700 font-medium">{obtenerCamposFaltantes(paciente)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => navigate(`/pacientes?editarId=${paciente.id_paciente}`)}
                  className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg font-medium transition-colors shadow-sm"
                >
                  <UserCheck size={14} />
                  <span>Completar</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 w-full min-h-0 p-2 md:p-4 text-black flex flex-col">
        <div className="w-full h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-2 md:p-4 flex flex-col">
          <AgendaCalendario
            turnos={turnos}
            onDateSelect={(selectInfo) => manejarSeleccionFechaCalendario(selectInfo)}
            onEventClick={procesarClickEnTurno}
          />
        </div>
      </div>

      {/* //* MODALES */}
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
          abrirParaAtender={() => {
            cerrarModal(); // Cierra el modal de edición
            abrirParaAtender(turnoSeleccionado); // Abre el de atención
          }}
          abrirParaCancelar={() => {
            cerrarModal();
            abrirParaCancelar(turnoSeleccionado);
          }}
          abrirParaInasistente={() => {
            cerrarModal();
            abrirParaInasistente(turnoSeleccionado);
          }}
          abrirParaReprogramar={() => {
            cerrarModal();
            abrirParaReprogramar(turnoSeleccionado, formatearTurnoParaReprogramar);
          }}
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
            procesarReprogramacionTurno(
              datosReprogramacion,
              turnoSeleccionadoReprogramar,
              cerrarModalReprogramar,
            );
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
            procesarAtencionTurno(datosAtencion, turnoSeleccionadoAtender, cerrarModalAtender);
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
            procesarCancelacionTurno(
              inasistente,
              turnoSeleccionadoCancelar,
              datosCancelacion,
              cerrarModalCancelar,
            );
          }}
        />
      )}
    </div>
  );
}
