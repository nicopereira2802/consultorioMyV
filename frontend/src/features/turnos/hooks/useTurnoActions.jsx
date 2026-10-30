import { useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { manejarErrorApi } from "../../../utils/errorHandler";
import { formatDateTimeInput } from "../../../utils";
import { formatearTurnoParaReprogramar } from "../utils/formatTurnoParaReprogramar";

export function useTurnoActions(recargar, cerrarModal) {
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const guardarTurno = async (datosFormulario, editando, turnoSeleccionadoCRUD) => {
    // Validar que se haya seleccionado un paciente de la lista
    const idPacienteNum = Number(datosFormulario.id_paciente);
    if (!datosFormulario.id_paciente || isNaN(idPacienteNum) || idPacienteNum <= 0) {
      toast.error("Por favor, seleccione un paciente de la lista.");
      return;
    }

    // Validar fecha de inicio al crear
    const fechaInicioDate = new Date(datosFormulario.fecha_hora_inicio);
    if (!editando && isNaN(fechaInicioDate.getTime())) {
      toast.error("Por favor, indique una fecha y hora de inicio válida.");
      return;
    }

    setCargandoAccion(true);
    try {
      let payload;

      if (editando) {
        payload = {
          id_paciente: idPacienteNum,
          id_estado: Number(datosFormulario.id_estado),
          precio_final: parseFloat(datosFormulario.precio_final || 0),
          notas_consulta: datosFormulario.notas_consulta?.trim() || "",
        };

        await api.put(`/turnos/${turnoSeleccionadoCRUD.id_turno}`, payload);
      } else {
        // Al crear: payload explícito (nunca hacer spread del formulario, puede traer objetos no serializables)
        const durMin = Number(datosFormulario.duracion_minutos) || 30;
        const fechaFinDate = new Date(datosFormulario.fecha_hora_fin);
        const finDate = isNaN(fechaFinDate.getTime())
          ? new Date(fechaInicioDate.getTime() + durMin * 60000)
          : fechaFinDate;

        // Validar horario comercial de atención (09:00 a 20:00 hs)
        const horaInicio = fechaInicioDate.getHours() + fechaInicioDate.getMinutes() / 60;
        const horaFin = finDate.getHours() + finDate.getMinutes() / 60;
        if (horaInicio < 9 || horaFin > 20 || horaInicio >= horaFin) {
          toast.error("El horario de atención es de 09:00 a 20:00 hs. El turno debe comenzar a partir de las 09:00 y finalizar a más tardar a las 20:00 hs.");
          setCargandoAccion(false);
          return;
        }

        const fechaFinIso = finDate.toISOString();

        payload = {
          id_paciente: idPacienteNum,
          duracion_minutos: durMin,
          precio_final: parseFloat(datosFormulario.precio_final || 0),
          fecha_hora_inicio: fechaInicioDate.toISOString(),
          fecha_hora_fin: fechaFinIso,
          notas_consulta: datosFormulario.notas_consulta?.trim() || "",
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
      // Manejar formato string (ej: "5000", "5000.50", "5000,50") o número
      const rawPrecio = datosAtencion.precio_final;
      const precioLimpio = typeof rawPrecio === "string"
        ? parseFloat(rawPrecio.replace(",", "."))
        : Number(rawPrecio);

      const precioFinalValido = isNaN(precioLimpio) ? 0 : precioLimpio;

      const payloadAtencion = {
        notas_consulta: datosAtencion.notas_consulta?.trim() || "",
        precio_final: precioFinalValido,
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

    const fechaInicioDate = new Date(datosReprogramacion.fecha_hora_inicio);
    const durMin = Number(datosReprogramacion.duracion_minutos) || 30;
    const fechaFinDate = new Date(datosReprogramacion.fecha_hora_fin);
    const finDate = isNaN(fechaFinDate.getTime())
      ? new Date(fechaInicioDate.getTime() + durMin * 60000)
      : fechaFinDate;

    // Validar horario comercial de atención (09:00 a 20:00 hs)
    const horaInicio = fechaInicioDate.getHours() + fechaInicioDate.getMinutes() / 60;
    const horaFin = finDate.getHours() + finDate.getMinutes() / 60;
    if (horaInicio < 9 || horaFin > 20 || horaInicio >= horaFin) {
      toast.error("El horario de atención es de 09:00 a 20:00 hs. El turno debe comenzar a partir de las 09:00 y finalizar a más tardar a las 20:00 hs.");
      return;
    }

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
      let nuevaFechaInicio = formatDateTimeInput(selectInfo.startStr);

      // Si fue clickeado desde la vista mensual (allDay) o string de sólo fecha
      if (selectInfo.allDay || selectInfo.startStr.length === 10) {
        const fechaSolo = selectInfo.startStr.slice(0, 10);
        nuevaFechaInicio = `${fechaSolo}T09:00`;
      } else {
        const d = new Date(selectInfo.startStr);
        if (!isNaN(d.getTime())) {
          const h = d.getHours();
          if (h < 9) {
            d.setHours(9, 0, 0, 0);
            nuevaFechaInicio = formatDateTimeInput(d);
          } else if (h >= 20) {
            d.setHours(19, 30, 0, 0);
            nuevaFechaInicio = formatDateTimeInput(d);
          }
        }
      }

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

      // Si no había ningún turno para reprogramar, abrir creación con la fecha seleccionada
      abrirParaCrear({ fecha_hora_inicio: nuevaFechaInicio });
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
