import { useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { manejarErrorApi } from "../../../utils/errorHandler";

export function useCobroActions(recargar, cerrarModal) {
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const guardarCobro = async (datosFormulario, editando, cobroSeleccionado) => {
    setCargandoAccion(true);
    try {
      const payloadBase = {
        id_turno: Number(datosFormulario.id_turno),
        id_paciente: Number(datosFormulario.id_paciente),
        monto_a_cobrar: Number(datosFormulario.monto_a_cobrar),
      };

      if (editando) {
        await api.put(`/cobros/${cobroSeleccionado.id_cobro}`, {
          ...payloadBase,
          cant_cuotas: datosFormulario.modalidad === "cuotas" ? Number(datosFormulario.cant_cuotas) : 1,
        });
        toast.success("Cobro actualizado correctamente");
      } else {
        if (datosFormulario.modalidad === "inmediato") {
          await api.post("/cobros/inmediato", {
            ...payloadBase,
            metodo_pago: datosFormulario.metodo_pago,
          });
        } else if (datosFormulario.modalidad === "cuotas") {
          await api.post("/cobros/cuotas", {
            ...payloadBase,
            cant_cuotas: Number(datosFormulario.cant_cuotas),
            fecha_primer_vencimiento: datosFormulario.fecha_primer_vencimiento,
          });
        } else if (datosFormulario.modalidad === "informal") {
          await api.post("/cobros/informal", {
            ...payloadBase,
            entrega_inicial: Number(datosFormulario.entrega_inicial) || 0,
            metodo_pago: datosFormulario.metodo_pago,
          });
        }
        toast.success("Cobro registrado correctamente");
      }

      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al registrar el cobro:", error);
      manejarErrorApi(error, "No se pudo procesar el cobro.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const ejecutarEliminacion = async (cobroSeleccionado, cerrarModalEliminar) => {
    if (!cobroSeleccionado) return;
    setCargandoAccion(true);
    try {
      await api.patch(`/cobros/${cobroSeleccionado.id_cobro}/delete`);
      toast.success("Registro de cobro desactivado");
      recargar();
      if (typeof cerrarModalEliminar === "function") cerrarModalEliminar();
    } catch (error) {
      console.error("Error al desactivar cobro:", error);
      manejarErrorApi(error, "No se pudo desactivar el cobro.");
    } finally {
      setCargandoAccion(false);
    }
  };

  return {
    guardarCobro,
    ejecutarEliminacion,
    cargandoAccion,
  };
}
