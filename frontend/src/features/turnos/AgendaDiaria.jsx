/** @format */

import { useState, useEffect } from "react";
import { Calendar, AlertTriangle, X, UserCheck } from "lucide-react";

import api from "../../services/api";

import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import AgendaCalendario from "./components/AgendaCalendario";

//* IMPORTACION DE HOOKS (para modales y paginacion) Y CONTEXT (para el boton flotante para telefono)
import { useTurnoPaginationSearch } from "./hooks/useTurnoPaginationSearch";
import { useTurnoCRUDModal } from "./hooks/useTurnoCRUDModal";
import { useFloatingButton } from "../../context/BotonFlotanteContext";

//* IMPORTACION DE FUNCIONES PARA FORMATEAR FECHAS
import { formatDateTimeInput, formatFechaCortaTexto } from "../../utils/index";

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

export default function AgendaDiaria() {
  //* MOSTRAMOS EL BOTON FLOTANTE
  const { setFloatingAction } = useFloatingButton();

  const navigate = useNavigate();

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

  /* ─── ESTADO PARA LA ADVERTENCIA DE PACIENTES INCOMPLETOS ─── */
  const [advertenciaVisible, setAdvertenciaVisible] = useState(true);

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

  /* ─── PETICIONES API ─────────────────────────────────── */

  const pacientesIncompletos = pacientes.filter((p) => !p.dni || !p.domicilio || !p.fecha_nacimiento);

  const obtenerCamposFaltantes = (p) => {
    const faltantes = [];
    if (!p.dni) faltantes.push("DNI");
    if (!p.domicilio) faltantes.push("domicilio");
    if (!p.fecha_nacimiento) faltantes.push("fecha de nacimiento");
    return faltantes.join(", ");
  };

  /* ─── FUNCION CALCULAR HORA FIN ─────────────────────────────────── */
  const calcularHoraFin = (fecha_inicio, duracion_minutos) => {
    const inicio = new Date(fecha_inicio);
    const minutos = parseInt(duracion_minutos, 10);

    if (!isNaN(inicio.getTime()) && !isNaN(minutos)) {
      const fin = new Date(inicio.getTime() + minutos * 60000);

      // Formato YYYY-MM-THH:mm para input datetime-local
      const isoFin = new Date(fin.getTime() - fin.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

      setDatosFormulario((prev) => ({
        ...prev,
        fecha_hora_fin: isoFin,
      }));
    }
  };

  /* ─── ENVIAR EL FORMULARIO DE TURNO ─────────────────────────── */
  const procesarFormulario = async (e) => {
    e.preventDefault();

    if (!datosFormulario.id_paciente) {
      alert("Por favor seleccione un paciente.");
      return;
    }

    try {
      const { duracion_minutos, ...restoDatos } = datosFormulario;

      const datosAEnviar = {
        ...restoDatos,
        id_paciente: Number(restoDatos.id_paciente),
        precio_final: parseFloat(restoDatos.precio_final),
        fecha_hora_inicio: new Date(restoDatos.fecha_hora_inicio).toISOString(),
        fecha_hora_fin: new Date(restoDatos.fecha_hora_fin).toISOString(),
        notas_consulta: restoDatos.notas_consulta?.trim() || "",
      };
      if (editando) {
        await api.put(`/turnos/${datosAEnviar.id_turno}`, datosAEnviar);
      } else {
        await api.post(`/turnos`, datosAEnviar);
      }
      buscarTurnos();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar el turno:", error.response);

      const status = error.response?.status || error.status;
      const errors = error.response?.data?.errors;

      if (status === 409) {
        alert("El horario seleccionado se superpone con otro turno");
      }

      if (status === 400 && errors && ("fecha_hora_inicio" in errors || "fecha_hora_fin" in errors)) {
        alert("El horario seleccionado debe ser como minimo la hora actual");
      }
    }
  };

  /* ─── PROCESAR ATENCIÓN DEL TURNO (PATCH /atender) ───────── */
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
        practicas_detalle: datosAtencion.practicas
          .filter((p) => p.id_practica)
          .map((p) => ({
            id_practica: Number(p.id_practica),
            id_obra_social: p.id_obra_social ? Number(p.id_obra_social) : null,
          })),
      };

      await api.patch(`/turnos/${turnoSeleccionado.id_turno}/atender`, payloadAtencion);

      buscarTurnos();
      cerrarModal();
    } catch (error) {
      console.error("Error al registrar la atención del turno:", error);
      alert(error.response?.data?.error || "Ocurrió un error al registrar la atención.");
    }
  };

  /* ─── PROCESAR CANCELACION O INASISTENCIA DEL TURNO (PATCH /cancelar o /inasistente) ───────── */
  const procesarCancelacionTurno = async (e) => {
    e.preventDefault();
    if (!turnoSeleccionado) return;

    try {
      const payloadAtencion = {
        notas_consulta: notasCancelarInasistente.trim(),
      };

      if (inasistente) {
        await api.patch(`/turnos/${turnoSeleccionado.id_turno}/inasistente`, payloadAtencion);
      } else {
        await api.patch(`/turnos/${turnoSeleccionado.id_turno}/cancelar`, payloadAtencion);
      }

      buscarTurnos();
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

      buscarTurnos();
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

  const procesarClickEnTurno = (clickInfo) => {
    const turnoSeleccionado = turnos.find((t) => String(t.id_turno) === String(clickInfo.event.id));
    if (turnoSeleccionado) {
      abrirParaEditar(turnoSeleccionado);
    }
  };

  /* ─── RETORNO DE LA PAGINA ─────────────────────────────────── */
  return (
    <div className="w-full h-screen flex flex-col pb-20 md:pb-0">
      {/* ─── CABECERA PRINCIPAL ─────────────────────────────────── */}
      <Header
        icono={Calendar}
        titulo="Agenda de Turnos"
        subtitulo="Gestión horaria y turnos del consultorio odontológico"
        badge={formatFechaCortaTexto(new Date())}
      />

      {/* ─── ADVERTENCIA DINÁMICA DE PACIENTES INCOMPLETOS ──────── */}
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
              title="Cerrar advertencia"
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
                  onClick={() => {
                    navigate(`/pacientes?editarId=${paciente.id_paciente}`);
                  }}
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

      {/* ─── CONTENEDOR DEL CALENDARIO (OCUPA TODO EL ESPACIO RESTANTE) ─── */}
      <div className="flex-1 w-full min-h-0 p-2 md:p-4 text-black flex flex-col">
        <div className="w-full h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-2 md:p-4 flex flex-col">
          <AgendaCalendario
            turnos={turnos}
            onDateSelect={abrirParaCrear}
            onEventClick={procesarClickEnTurno}
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
          datosFormulario={datosFormulario}
          actualizarDatos={actualizarDatos}
          procesarFormulario={procesarFormulario}
          abrirParaAtender={abrirParaAtender}
          abrirParaCancelar={abrirParaCancelar}
          abrirParaInasistente={abrirParaInasistente}
          abrirParaReprogramar={abrirParaReprogramar}
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
    </div>
  );
}
