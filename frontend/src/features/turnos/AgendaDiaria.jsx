/** @format */

import { useState } from "react";

//* ICONOS Y TOAST
import { Calendar } from "lucide-react";
import toast from "react-hot-toast";

// * COMPONENTES COMUNES
import Header from "../../components/common/Header";
import AgendaCalendario from "./components/AgendaCalendario";

//* COMPONENTES ESPECIFICOS DE TURNO
import { VistaTurno } from "./components/VistaTurno";
import { AdvertenciaPacienteIncompleto } from "./components/AdvertenciaPacienteIncompleto";

//* HOOKS
import { useTurnoSearchAgenda } from "./hooks/useTurnoSearchAgenda";
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { useTurnoAtenderModal } from "./hooks/useTurnoAtenderModal";
import { useTurnoCancelarModal } from "./hooks/useTurnoCancelarModal";
import { useTurnoReprogramarModal } from "./hooks/useTurnoReprogramarModal";
import { useTurnoActions } from "./hooks/useTurnoActions";
import { usePacienteFaltante } from "./hooks/usePacienteFaltante";
import { useTurnoVer } from "./hooks/useTurnoVer";

//* FUNCIONES PARA FORMATEAR FECHAS Y UTILIDADES
import { formatFechaCortaTexto } from "../../utils/index";
import { formatearTurnoParaReprogramar } from "./utils/formatTurnoParaReprogramar";

//* CONSTANTES
import { ESTADO_INICIAL_TURNO } from "./constants/turnosConstants";

//* FORMULARIOS
import {
  FormularioCrearEditar,
  FormularioAtender,
  FormularioCancelar,
  FormularioReprogramar,
} from "./components/FormulariosTurno";

export default function AgendaDiaria() {
  // TODO: TENDRIA QUE VER COMO SACAR ESTO
  const [turnoReprogramando, setTurnoReprogramando] = useState(null);

  //* HOOK DE CRUD MODAL
  const {
    modalAbierto,
    editando,
    abrirParaCrear,
    abrirParaEditar,
    itemSeleccionado: turnoSeleccionado,
    datosFormulario,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL_TURNO);

  //* HOOK ESPECIFICO PARA AGENDA
  const { turnos, pacientes, setPacientes, practicasLista, recargar } =
    useTurnoSearchAgenda("/turnos/agenda");

  //* HOOK DE MODAL VER
  const { modalVer, turnoVer, abrirParaVer, cerrarVer } = useTurnoVer();

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

  //* HOOK DE MODAL CANCELAR E INASISTENTE
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

  //* HOOK DE MODAL REPROGRAMAR
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
    manejarSeleccionFechaCalendario,
    procesarClickEnTurno,
  } = useTurnoActions(recargar, cerrarModal);

  //* HOOK DE PACIENTE INCOMPLETO
  const { advertenciaVisible, pacientesIncompletos, obtenerCamposFaltantes, cerrarAdvertencia } =
    usePacienteFaltante(pacientes);

  /* ─── RETORNO DE LA PAGINA ─────────────────────────────────── */
  return (
    <div className="w-full h-screen flex flex-col pb-20 md:pb-0">
      {/* //* HEADER PRINCIPAL */}
      <Header
        icono={Calendar}
        titulo="Agenda de Turnos"
        subtitulo="Gestión horaria y turnos del consultorio odontológico"
        badge={formatFechaCortaTexto(new Date())}
      />

      {/* //* ADVERTENCIA PACIENTE INCOMPLETO */}
      <AdvertenciaPacienteIncompleto
        advertenciaVisible={advertenciaVisible}
        pacientesIncompletos={pacientesIncompletos}
        obtenerCamposFaltantes={obtenerCamposFaltantes}
        cerrarAdvertencia={cerrarAdvertencia}
      />

      <div className="flex-1 w-full min-h-0 p-2 md:p-4 text-black flex flex-col">
        <div className="w-full h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-2 md:p-4 flex flex-col">
          {/* //* BODY: AGENDA */}
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

      {/* //* MODALES: CREAR Y EDITAR */}
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

      {/* //* MODALES: VER */}
      {/* //? SE PUEDE MEJORAR??? */}
      {modalVer && (
        <VistaTurno
          isOpen={modalVer}
          onClose={() => cerrarVer()}
          turno={turnoVer}
          abrirParaReprogramar={(turnoTarget) => {
            cerrarVer();
            setTurnoReprogramando(turnoTarget);
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

      {/* //* MODALES: CANCELAR */}
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
    </div>
  );
}
