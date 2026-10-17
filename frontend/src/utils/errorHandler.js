/** @format */
import toast from "react-hot-toast";

export const manejarErrorApi = (error, mensajePorDefecto = "Ocurrió un error inesperado") => {
  const respuesta = error.response?.data;

  // Si el backend (Zod) envió errores detallados por campo
  if (respuesta?.errors && typeof respuesta.errors === "object") {
    // Recorremos cada campo que falló y mostramos un toast por cada uno
    Object.entries(respuesta.errors).forEach(([campo, mensaje]) => {
      toast.error(`Campo [${campo}]: ${mensaje}`);
    });
    return;
  }

  // Si el backend envió un mensaje general de error (ej: superposición de horarios 409)
  if (respuesta?.error || respuesta?.message) {
    toast.error(respuesta.error || respuesta.message);
    return;
  }

  // Error genérico si no hay conexión o falló el servidor
  toast.error(mensajePorDefecto);
};
