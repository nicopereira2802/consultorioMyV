/** @format */
import { useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { manejarErrorApi } from "../../../utils/errorHandler";

export function usePacienteActions(recargar, cerrarModal) {
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const guardarPaciente = async (datosFormulario, editando, pacienteSeleccionado) => {
    setCargandoAccion(true);
    try {
      const payloadPaciente = {
        nombre: datosFormulario.nombre.trim(),
        apellido: datosFormulario.apellido.trim(),
        dni: datosFormulario.dni ? datosFormulario.dni.trim() : null,
        fecha_nacimiento: datosFormulario.fecha_nacimiento || null,
        telefono: datosFormulario.telefono.trim(),
        domicilio: datosFormulario.domicilio ? datosFormulario.domicilio.trim() : null,
      };

      let newPaciente;
      if (editando) {
        await api.put(`/pacientes/${pacienteSeleccionado.id_paciente}`, payloadPaciente);
      } else {
        const res = await api.post("/pacientes", payloadPaciente);
        newPaciente = res.data.data || res.data;
      }

      const idPaciente = pacienteSeleccionado?.id_paciente || newPaciente?.id_paciente;

      // 1. Procesar creación o actualización de obras sociales del paciente
      if (datosFormulario.obrasSociales.length > 0 && idPaciente) {
        const promesasOS = datosFormulario.obrasSociales
          .filter((os) => os.id_obra_social && os.nro_afiliado)
          .map((os) => {
            if (os.guardadoEnBD && os.id_relacion) {
              return api.put(`/pacientes-por-obras-sociales/${os.id_relacion}`, {
                id_paciente: Number(idPaciente),
                id_obra_social: Number(os.id_obra_social),
                nro_afiliado: os.nro_afiliado.trim(),
              });
            } else {
              return api.post("/pacientes-por-obras-sociales", {
                id_paciente: Number(idPaciente),
                id_obra_social: Number(os.id_obra_social),
                nro_afiliado: os.nro_afiliado.trim(),
              });
            }
          });

        await Promise.all(promesasOS);
      }

      // 2. Procesar eliminaciones pendientes de obras sociales
      if (datosFormulario.obrasSocialesEliminadas?.length > 0) {
        for (const idRelacion of datosFormulario.obrasSocialesEliminadas) {
          await api.delete(`/pacientes-por-obras-sociales/${idRelacion}`);
        }
      }

      toast.success(editando ? "Paciente actualizado correctamente" : "Paciente registrado correctamente");
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar el paciente:", error);
      manejarErrorApi(error, "No se pudo guardar el paciente.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const togglePaciente = async (pacienteSeleccionado) => {
    if (!pacienteSeleccionado) return;
    try {
      await api.patch(`/pacientes/${pacienteSeleccionado.id_paciente}/delete`);
      toast.success("Estado del paciente actualizado");
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al cambiar estado del paciente:", error);
      manejarErrorApi(error, "No se pudo actualizar el estado del paciente.");
    }
  };

  // * FUNCION QUE REALIZA LA PETICION AL BACK PARA LA BAJA LOGICA DEL PACIENTE
  /* const eliminarPaciente = async () => {
    if (!pacienteSeleccionado) return;
    try {
      await api.delete(`/pacientes/${pacienteSeleccionado.id_paciente}/delete`);
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al borrar paciente:", error);
      alert("No se pudo desactivar el paciente.");
    }
  }; */

  return {
    guardarPaciente,
    togglePaciente,
    //eliminarPaciente,
    cargandoAccion,
  };
}
