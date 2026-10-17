import { useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { manejarErrorApi } from "../../../utils/errorHandler";

export function useCobroActions(recargar, cerrarModal) {
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const guardarCobro = async (datosFormulario, editando, cobroSeleccionado) => {
    setCargandoAccion(true);
    try {
      const payloadCobro = {
        id_turno: Number(datosFormulario.id_turno),
        id_paciente: Number(datosFormulario.id_paciente),
        monto_a_cobrar: Number(datosFormulario.monto_a_cobrar),
        cant_cuotas: datosFormulario.modalidad === "cuotas" ? Number(datosFormulario.cant_cuotas) : 1,
      };

      let idCobroGenerado;

      if (editando) {
        await api.put(`/cobros/${cobroSeleccionado.id_cobro}`, payloadCobro);
        idCobroGenerado = cobroSeleccionado.id_cobro;
      } else {
        const resCobro = await api.post("/cobros", payloadCobro);
        idCobroGenerado = resCobro.data.data?.id_cobro || resCobro.data.id_cobro;
      }

      // Si es pago inmediato, se asienta automáticamente la primera cuota pagada
      if (datosFormulario.modalidad === "inmediato" && idCobroGenerado) {
        await api.post("/cuotas", {
          id_cobro: idCobroGenerado,
          nro_cuota: 1,
          monto_cuota: Number(datosFormulario.monto_a_cobrar),
          monto_cobrado: Number(datosFormulario.monto_a_cobrar),
          fecha_vencimiento: new Date().toISOString().split("T")[0],
          fecha_cobro: new Date().toISOString(),
          metodo_pago: datosFormulario.metodo_pago,
          estado: "Pagada",
        });
      }

      toast.success(editando ? "Cobro actualizado correctamente" : "Cobro registrado correctamente");
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al registrar el cobro:", error);
      manejarErrorApi(error, "No se pudo procesar el cobro.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const ejecutarEliminacion = async (cobroSeleccionado) => {
    if (!cobroSeleccionado) return;
    setCargandoAccion(true);
    try {
      await api.patch(`/cobros/${cobroSeleccionado.id_cobro}/delete`);
      toast.success("Registro de cobro desactivado");
      recargar();
      cerrarModal();
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
