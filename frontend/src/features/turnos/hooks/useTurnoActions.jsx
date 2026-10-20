import { useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { manejarErrorApi } from "../../../utils/errorHandler";
import { formatDateTimeInput } from "../../../utils";
import { formatearTurnoParaReprogramar } from "../utils/formatTurnoParaReprogramar";

export function useTurnoActions(recargar, cerrarModal) {
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const guardarTurno = async (datosFormulario, editando, turnoSeleccionadoCRUD) => {
    setCargandoAccion(true);
    try {
      let payload;

      if (editando) {
        payload = {
          id_paciente: Number(datosFormulario.id_paciente),
          id_estado: Number(datosFormulario.id_estado),
          precio_final: parseFloat(datosFormulario.precio_final || 0),
          notas_consulta: datosFormulario.notas_consulta?.trim() || "",
        };

        await api.put(`/turnos/${turnoSeleccionadoCRUD.id_turno}`, payload);
      } else {
        // Al crear, sí requerimos las fechas y la duración completa
        const { duracion_minutos, ...restoDatos } = datosFormulario;
        payload = {
          ...restoDatos,
          id_paciente: Number(restoDatos.id_paciente),
          id_estado: Number(restoDatos.id_estado),
          precio_final: parseFloat(restoDatos.precio_final || 0),
          fecha_hora_inicio: new Date(restoDatos.fecha_hora_inicio).toISOString(),
          fecha_hora_fin: new Date(restoDatos.fecha_hora_fin).toISOString(),
          notas_consulta: restoDatos.notas_consulta?.trim() || "",
        };

        await api.post("/turnos", payload);
      }

      toast.success(editando ? "Turno actualizado correctamente" : "Turno registrado correctamente");
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar el turno:", error);
      manejarErrorApi(error, "No se pudo guardar el turno.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const procesarAtencionTurno = async (datosAtencion, turnoSeleccionado, cerrarModalAtender) => {
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

      toast.success("Turno atendido correctamente");
      recargar();
      cerrarModalAtender();
    } catch (error) {
      console.error("Error al registrar la atención del turno:", error);
      manejarErrorApi(error, "No se pudo atender el turno.");
    }
  };

  const procesarCancelacionTurno = async (
    inasistente,
    turnoSeleccionadoCancelar,
    datosCancelacion,
    cerrarModalCancelar,
  ) => {
    if (!turnoSeleccionadoCancelar) return;
    try {
      const payloadAtencion = { notas_consulta: datosCancelacion.notas_consulta.trim() };
      if (inasistente) {
        await api.patch(`/turnos/${turnoSeleccionadoCancelar.id_turno}/inasistente`, payloadAtencion);
      } else {
        await api.patch(`/turnos/${turnoSeleccionadoCancelar.id_turno}/cancelar`, payloadAtencion);
      }

      toast.success(
        inasistente ? "Turno marcado como inasistente correctamente" : "Turno cancelado correctamente",
      );
      recargar();
      cerrarModalCancelar();
    } catch (error) {
      console.error("Error al registrar la cancelación:", error);
      manejarErrorApi(
        error,
        inasistente ? "No se pudo marcar como inasistente" : "No se pudo cancelar el turno.",
      );
    }
  };

  const procesarReprogramacionTurno = async (
    datosReprogramacion,
    turnoSeleccionado,
    cerrarModalReprogramar,
  ) => {
    if (!turnoSeleccionado) return;

    try {
      await api.patch(`/turnos/${turnoSeleccionado.id_turno}/reprogramado`, {
        fecha_hora_inicio: new Date(datosReprogramacion.fecha_hora_inicio).toISOString(),
        fecha_hora_fin: new Date(datosReprogramacion.fecha_hora_fin).toISOString(),
      });

      toast.success("Turno reprogramado correctamente");
      recargar();
      cerrarModalReprogramar();
    } catch (error) {
      console.error("Error al reprogramar el turno:", error);
      manejarErrorApi(error, "No se pudo reprogramar el turno.");
    }
  };

  const ejecutarEliminacion = async (turnoSeleccionado) => {
    if (!turnoSeleccionado) return;
    try {
      await api.patch(`/turnos/${turnoSeleccionado.id_turno}/delete`);

      toast.success("Turno eliminado correctamente");
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al eliminar turno:", error);
      manejarErrorApi(error, "No se pudo eliminar el turno.");
    }
  };

  const manejarSeleccionFechaCalendario = (
    selectInfo,
    abrirParaCrear,
    abrirParaReprogramar,
    actualizarDatos,
    turnoReprogramando,
    setTurnoReprogramando,
  ) => {
    if (selectInfo && selectInfo.startStr) {
      const nuevaFechaInicio = formatDateTimeInput(selectInfo.startStr);

      // Si había un turno esperando ser reprogramado:
      if (turnoReprogramando) {
        const turnoConNuevaFecha = {
          ...turnoReprogramando,
          fecha_hora_inicio: nuevaFechaInicio,
        };

        // Abrimos el modal de reprogramar con la nueva fecha seleccionada
        abrirParaReprogramar(turnoConNuevaFecha, formatearTurnoParaReprogramar);

        // Limpiamos el estado y el toast
        setTurnoReprogramando(null);
        toast.dismiss();
        return;
      }

      // Si no había ningún turno para reprogramar, funciona como siempre (Crear Turno)
      abrirParaCrear();
      actualizarDatos({
        target: { name: "fecha_hora_inicio", value: nuevaFechaInicio },
      });
    }
  };

  const procesarClickEnTurno = (clickInfo, abrirParaEditar, abrirParaVer) => {
    const turnoEncontrado = clickInfo.event._def.extendedProps;
    if (!turnoEncontrado) return;

    abrirParaVer(turnoEncontrado);
  };

  return {
    guardarTurno,
    procesarAtencionTurno,
    procesarCancelacionTurno,
    procesarReprogramacionTurno,
    ejecutarEliminacion,
    manejarSeleccionFechaCalendario,
    procesarClickEnTurno,
    cargandoAccion,
  };
}
