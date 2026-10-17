import { useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { manejarErrorApi } from "../../../utils/errorHandler";

export function useObraSocialActions(recargar, cerrarModal) {
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const guardarObraSocial = async (datosFormulario, editando, obraSocialSeleccionada) => {
    setCargandoAccion(true);
    try {
        console.log("A")
      const payload = { nombre: datosFormulario.nombre.trim() };
      if (editando) {
        await api.put(`/obras-sociales/${obraSocialSeleccionada.id_obra_social}`, payload);
      } else {
        await api.post("/obras-sociales", payload);
      }

      toast.success(
        editando ? "Obra Social actualizada correctamente" : "Obra Social registrada correctamente",
      );
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar la obra social:", error);
      manejarErrorApi(error, "No se pudo guardar la obra social.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const toggleObraSocial = async (obraSocialSeleccionada) => {
    if (!obraSocialSeleccionada) return;
    try {
      await api.patch(`/obras-sociales/${obraSocialSeleccionada.id_obra_social}/delete`);

      toast.success("Estado de la obra social actualizada");
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al cambiar estado de la obra social:", error);
      manejarErrorApi(error, "No se pudo actualizar el estado la obra social.");
    }
  };

  const eliminarObraSocial = async (obraSocialSeleccionada) => {
    if (!obraSocialSeleccionada) return;
    try {
      await api.delete(`/obras-sociales/${obraSocialSeleccionada.id_obra_social}/delete`);

      toast.success("Obra Social eliminada correctamente");
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al eliminar la obra social:", error);
      manejarErrorApi(error, "No se pudo eliminar la obra social.");
    }
  };

  return {
    guardarObraSocial,
    toggleObraSocial,
    eliminarObraSocial,
    cargandoAccion,
  };
}
