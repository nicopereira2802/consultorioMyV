/**
 * Convierte cualquier fecha (String, Date) a un objeto Date válido evitando
 * desfasajes por zona horaria (UTC vs Local).
 *
 * @format
 */

const parsearFecha = (fecha) => {
  if (!fecha) return null;
  if (fecha instanceof Date) return fecha;

  // Si viene en formato YYYY-MM-DD (solo fecha), ajustamos la zona horaria reemplazando '-' por '/'
  if (typeof fecha === "string" && fecha.length === 10 && fecha.includes("-")) {
    const [year, month, day] = fecha.split("-");
    return new Date(year, month - 1, day);
  }

  return new Date(fecha);
};

/**
 * Formatea una fecha para mostrar en tablas o textos.
 * Ejemplo: "10/10/2026"
 */
export const formatFechaTabla = (fecha) => {
  const d = parsearFecha(fecha);
  if (!d || isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formatea fecha y hora para mostrar en tablas o detalles.
 * Ejemplo: "10/10/2026 09:30 hs"
 */
export const formatFechaHoraTabla = (fecha) => {
  const d = parsearFecha(fecha);
  if (!d || isNaN(d.getTime())) return "-";

  const fechaStr = d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const horaStr = d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${fechaStr} ${horaStr} hs`;
};

/**
 * Formatea una fecha para el valor de un <input type="date" />.
 * Ejemplo: "2026-10-10"
 */
export const formatFechaInput = (fecha) => {
  const d = parsearFecha(fecha);
  if (!d || isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Formatea fecha y hora para el valor de un <input type="datetime-local" />.
 * Ejemplo: "2026-10-10T09:30"
 */
export const formatDateTimeInput = (fecha) => {
  const d = parsearFecha(fecha);
  if (!d || isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Formatea una fecha en texto largo para encabezados o títulos.
 * Ejemplo: "Sábado 10 de Octubre"
 */
export const formatFechaCortaTexto = (fecha) => {
  const d = parsearFecha(fecha);
  if (!d || isNaN(d.getTime())) return "";

  const opciones = { weekday: "long", day: "numeric", month: "long" };
  const texto = d.toLocaleDateString("es-AR", opciones);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};
