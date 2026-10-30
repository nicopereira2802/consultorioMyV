/** @format */
import { useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { manejarErrorApi } from "../../../utils/errorHandler";

export function useCobroActions(recargar, cerrarModal) {
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const guardarCobro = async (datosFormulario, editando, cobroSeleccionado) => {
    setCargandoAccion(true);
    try {
      const idTurno = Number(datosFormulario.id_turno);
      const idPaciente = Number(datosFormulario.id_paciente);
      const montoTotal = Number(datosFormulario.monto_a_cobrar) || 0;
      const modalidad = datosFormulario.modalidad;

      if (!modalidad) {
        toast.error("Por favor, selecciona una modalidad de cobro.");
        setCargandoAccion(false);
        return;
      }

      // Validación preventiva para no mandar NaN al backend
      if (!idTurno || isNaN(idTurno) || !idPaciente || isNaN(idPaciente)) {
        toast.error("Datos incompletos: no se pudo identificar el turno o el paciente.");
        setCargandoAccion(false);
        return;
      }

      const payloadBase = {
        id_turno: idTurno,
        id_paciente: idPaciente,
        monto_a_cobrar: montoTotal,
      };

      if (editando && cobroSeleccionado) {
        await api.put(`/cobros/${cobroSeleccionado.id_cobro}`, {
          ...payloadBase,
          cant_cuotas: modalidad === "cuotas" ? Number(datosFormulario.cant_cuotas) || 1 : 1,
        });
        toast.success("Cobro actualizado correctamente");
      } else {
        if (modalidad === "inmediato") {
          await api.post("/cobros/inmediato", {
            ...payloadBase,
            monto_a_cobrar: montoTotal,
            monto_abonado: montoTotal, // Pago único y total de lo pactado del turno
            metodo_pago: datosFormulario.metodo_pago || "Efectivo",
          });
        } else if (modalidad === "cuotas") {
          await api.post("/cobros/cuotas", {
            ...payloadBase,
            cant_cuotas: Number(datosFormulario.cant_cuotas) || 3,
            fecha_primer_vencimiento:
              datosFormulario.fecha_primer_vencimiento || new Date().toISOString().split("T")[0],
            cobrar_primera_cuota:
              datosFormulario.cobrar_primera_cuota !== undefined
                ? Boolean(datosFormulario.cobrar_primera_cuota)
                : true,
            metodo_pago: "Tarjeta",
          });
        } else if (modalidad === "informal") {
          await api.post("/cobros/informal", {
            ...payloadBase,
            entrega_inicial: Number(datosFormulario.entrega_inicial) || 0,
            metodo_pago: datosFormulario.metodo_pago || "Efectivo",
          });
        }
        toast.success("Cobro registrado correctamente");
      }

      if (typeof recargar === "function") recargar();
      if (typeof cerrarModal === "function") cerrarModal();
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
      if (typeof recargar === "function") recargar();
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
