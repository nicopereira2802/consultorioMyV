/** @format */

import { useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { manejarErrorApi } from "../../../utils/errorHandler";

export function useGastoActions(recargar, cerrarModal) {
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const guardarGasto = async (datosFormulario, editando, gastoSeleccionado) => {
    setCargandoAccion(true);
    try {
      const payload = {
        id_categoria_gasto: Number(datosFormulario.id_categoria_gasto),
        monto: parseFloat(datosFormulario.monto),
        concepto: datosFormulario.concepto.trim(),
        fecha_gasto: datosFormulario.fecha_gasto || new Date().toISOString(),
        metodo_pago: datosFormulario.metodo_pago || "Efectivo",
        comprobante: datosFormulario.comprobante ? datosFormulario.comprobante.trim() : null,
        notas: datosFormulario.notas ? datosFormulario.notas.trim() : null,
      };

      if (editando) {
        await api.put(`/gastos/${gastoSeleccionado.id_gasto}`, payload);
      } else {
        await api.post("/gastos", payload);
      }

      toast.success(editando ? "Gasto actualizado correctamente" : "Gasto registrado correctamente");
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar el gasto:", error);
      manejarErrorApi(error, "No se pudo guardar el gasto.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const toggleGasto = async (gastoSeleccionado) => {
    if (!gastoSeleccionado) return;
    try {
      await api.patch(`/gastos/${gastoSeleccionado.id_gasto}/delete`);
      toast.success("Estado del gasto actualizado");
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al cambiar estado del gasto:", error);
      manejarErrorApi(error, "No se pudo actualizar el estado del gasto.");
    }
  };

  const eliminarGasto = async (gastoSeleccionado) => {
    if (!gastoSeleccionado) return;
    try {
      await api.delete(`/gastos/${gastoSeleccionado.id_gasto}/delete`);
      toast.success("Gasto eliminado definitivamente");
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al eliminar el gasto:", error);
      manejarErrorApi(error, "No se pudo eliminar el gasto.");
    }
  };

  return {
    guardarGasto,
    toggleGasto,
    eliminarGasto,
    cargandoAccion,
  };
}
