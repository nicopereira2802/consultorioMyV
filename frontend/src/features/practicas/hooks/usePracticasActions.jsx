import { useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { manejarErrorApi } from "../../../utils/errorHandler";

export function usePracticaActions(recargar, cerrarModal) {
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const guardarPractica = async (datosFormulario, editando, practicaSeleccionada) => {
    setCargandoAccion(true);
    try {
      const payload = {
        codigo_nomenclador: datosFormulario.codigo_nomenclador.trim(),
        nombre_nomenclador: datosFormulario.nombre_nomenclador.trim(),
        nombre_referencia: datosFormulario.nombre_referencia.trim(),
        especialidad: datosFormulario.especialidad.trim(),
        precio_referencia: parseFloat(datosFormulario.precio_referencia),
      };

      if (editando) {
        await api.put(`/practicas/${practicaSeleccionada.id_practica}`, payload);
      } else {
        await api.post("/practicas", payload);
      }

      toast.success(editando ? "Practica actualizada correctamente" : "Practica registrada correctamente");
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar la práctica:", error);
      manejarErrorApi(error, "No se pudo guardar la practica.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const togglePractica = async (practicaSeleccionada) => {
    if (!practicaSeleccionada) return;
    try {
      await api.patch(`/practicas/${practicaSeleccionada.id_practica}/delete`);

      toast.success("Estado de la practica actualizada");
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al cambiar estado de la práctica:", error);
      manejarErrorApi(error, "No se pudo actualizar el estado de la práctica.");
    }
  };

  const eliminarPractica = async (practicaSeleccionada) => {
    if (!practicaSeleccionada) return;
    try {
      await api.delete(`/practicas/${practicaSeleccionada.id_practica}/delete`);

      toast.success("Práctica eliminada correctamente");
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al eliminar la práctica:", error);
      manejarErrorApi(error, "No se pudo eliminar la práctica.");
    }
  };

  return {
    guardarPractica,
    togglePractica,
    eliminarPractica,
    cargandoAccion,
  };
}
