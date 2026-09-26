import axios from 'axios';

// Instancia de axios configurada con la ruta al backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Extrae de forma segura un array de datos tanto si el endpoint responde con
 * un array directo como si responde con el nuevo formato estructurado { status: 'success', data: [...] }
 */
export const extractDataArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.data)) return res.data.data;
  return [];
};

/**
 * Extrae los mensajes de error devueltos por el backend, incluyendo los generados
 * por la validación de esquemas Zod en { status: 'error', errors: { field: 'mensaje' } }
 */
export const extractErrorMessage = (err, defaultMsg = 'Error en la operación') => {
  if (!err) return defaultMsg;
  if (err.response?.data?.errors && typeof err.response.data.errors === 'object') {
    const errorList = Object.values(err.response.data.errors);
    if (errorList.length > 0) {
      return errorList.join(' — ');
    }
  }
  return (
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.response?.data?.mensaje ||
    err.message ||
    defaultMsg
  );
};

export default api;
export { api };
