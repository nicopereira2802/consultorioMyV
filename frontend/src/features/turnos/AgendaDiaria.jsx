/** @format */

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import toast from "react-hot-toast";

import Header from "../../components/common/Header";
import AgendaCalendario from "./components/AgendaCalendario";
import { VistaTurno } from "./components/VistaTurno";

//* IMPORTACION DE HOOKS
import { useTurnoSearchAgenda } from "./hooks/useTurnoSearchAgenda";
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { useTurnoAtenderModal } from "./hooks/useTurnoAtenderModal";
import { useTurnoCancelarModal } from "./hooks/useTurnoCancelarModal";
import { useTurnoReprogramarModal } from "./hooks/useTurnoReprogramarModal";
import { useTurnoActions } from "./hooks/useTurnoActions";

//* UTILIDADES Y FUNCIONES EXTERNAS
import { formatFechaCortaTexto } from "../../utils/index";
import { calcularHoraFin } from "./utils/calcularHoraFin";
import { formatearTurnoParaReprogramar } from "./utils/formatTurnoParaReprogramar";

//* IMPORTACION DE FORMULARIOS
import {
  FormularioCrearEditar,
  FormularioAtender,
  FormularioCancelar,
  FormularioReprogramar,
} from "./components/FormulariosTurno";
import { calcularPrecioPracticas } from "./utils/calcularPrecioPracticas";
import { usePacienteFaltante } from "./hooks/usePacienteFaltante";
import { AdvertenciaPacienteIncompleto } from "./components/AdvertenciaPacienteIncompleto";
import { useTurnoVer } from "./hooks/useTurnoVer";

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
  const [turnoReprogramando, setTurnoReprogramando] = useState(null);

  // 1. Hook CRUD Genérico (Crear, Editar)
  const {
    modalAbierto,
    editando,
    abrirParaCrear,
    abrirParaEditar,
    itemSeleccionado: turnoSeleccionado,
    datosFormulario,
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
  const {
    turnos,
    pacientes,
    setPacientes,
    practicasLista,
    obrasSocialesPaciente,
    recargar,
    buscarOSPaciente,
  } = useTurnoSearchAgenda("/turnos/agenda");

  // 4. Hook de Acciones API unificadas
  const {
    guardarTurno,
    procesarAtencionTurno,
    procesarCancelacionTurno,
    procesarReprogramacionTurno,
    manejarSeleccionFechaCalendario,
    procesarClickEnTurno,
  } = useTurnoActions(recargar, cerrarModal);

  const { advertenciaVisible, pacientesIncompletos, obtenerCamposFaltantes, cerrarAdvertencia } =
    usePacienteFaltante(pacientes);

  const { modalVer, turnoVer, abrirParaVer, cerrarVer } = useTurnoVer();

  /* ─── EFECTOS ─────────────────────────────────────────── */
  // Cálculo de hora fin (Creación / Edición) usando la utilidad externa
  useEffect(() => {
    calcularHoraFin(datosFormulario, actualizarDatos);
  }, [datosFormulario.fecha_hora_inicio, datosFormulario.duracion_minutos]);

  // Cálculo de hora fin (Reprogramación) usando la utilidad externa
  useEffect(() => {
    calcularHoraFin(datosReprogramacion, actualizarDatosReprogramacion);
  }, [datosReprogramacion.fecha_hora_inicio, datosReprogramacion.duracion_minutos]);

  // Cargar obras sociales al atender
  useEffect(() => {
    if (turnoSeleccionadoAtender && turnoSeleccionadoAtender.id_paciente && modalAtender) {
      buscarOSPaciente(turnoSeleccionadoAtender.id_paciente);
    }
  }, [modalAtender, turnoSeleccionadoAtender]);

  // Cálculo automático del precio en base a las prácticas seleccionadas
  useEffect(() => {
    calcularPrecioPracticas(datosAtencion, practicasLista, setDatosAtencion);
  }, [datosAtencion.practicas, practicasLista]);

  /* ─── RETORNO DE LA PAGINA ─────────────────────────────────── */
  return (
    <div className="w-full h-screen flex flex-col pb-20 md:pb-0">
      <Header
        icono={Calendar}
        titulo="Agenda de Turnos"
        subtitulo="Gestión horaria y turnos del consultorio odontológico"
        badge={formatFechaCortaTexto(new Date())}
      />
      <AdvertenciaPacienteIncompleto
        advertenciaVisible={advertenciaVisible}
        pacientesIncompletos={pacientesIncompletos}
        obtenerCamposFaltantes={obtenerCamposFaltantes}
        cerrarAdvertencia={cerrarAdvertencia}
      />

      <div className="flex-1 w-full min-h-0 p-2 md:p-4 text-black flex flex-col">
        <div className="w-full h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-2 md:p-4 flex flex-col">
          <AgendaCalendario
            turnos={turnos}
            onDateSelect={(selectInfo) =>
              manejarSeleccionFechaCalendario(
                selectInfo,
                abrirParaCrear,
                abrirParaReprogramar,
                actualizarDatos,
                turnoReprogramando,
                setTurnoReprogramando,
              )
            }
            onEventClick={(clickInfo) => procesarClickEnTurno(clickInfo, abrirParaEditar, abrirParaVer)}
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
          setPacientes={setPacientes}
          datosFormulario={datosFormulario}
          actualizarDatos={actualizarDatos}
          guardarTurno={(e) => {
            e.preventDefault();
            guardarTurno(datosFormulario, editando, turnoSeleccionado);
          }}
          abrirParaAtender={() => {
            cerrarModal();
            abrirParaAtender(turnoSeleccionado);
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

      {/* MODAL PARA VER DETALLE DEL TURNO */}
      {modalVer && (
        <VistaTurno
          isOpen={modalVer}
          onClose={() => cerrarVer()}
          turno={turnoVer}
          // AQUÍ CAMBIAMOS LA ACCIÓN DEL BOTÓN REPROGRAMAR:
          abrirParaReprogramar={(turnoTarget) => {
            cerrarVer(); // 1. Cierra el modal de vista
            setTurnoReprogramando(turnoTarget); // 2. Guarda el turno en el estado

            // 3. Muestra el toast indicándole al odontólogo que elija horario en la agenda
            toast("Seleccione el nuevo horario haciendo clic en la agenda...", {
              icon: "📅",
              duration: 5000,
              style: {
                background: "#3B7A94",
                color: "#fff",
                fontWeight: "bold",
              },
            });
          }}
          abrirParaAtender={(turnoTarget) => {
            cerrarVer();
            if (turnoTarget) abrirParaAtender(turnoTarget);
          }}
          abrirParaCancelar={(turnoTarget) => {
            cerrarVer();
            if (turnoTarget) abrirParaCancelar(turnoTarget);
          }}
          abrirParaInasistente={(turnoTarget) => {
            cerrarVer();
            if (turnoTarget) abrirParaInasistente(turnoTarget);
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
