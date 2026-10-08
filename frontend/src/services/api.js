import axios from 'axios';

export const API_BASE_URL = import.meta?.env?.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const extractDataArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.rows)) return res.rows;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.rows)) return res.data.rows;
  return [];
};

export const extractErrorMessage = (
  error,
  defaultMsg = 'Error al procesar la solicitud. Verifique los datos ingresados.'
) => {
  if (!error) return defaultMsg;
  if (typeof error === 'string') return error;

  const data = error.response?.data;

  if (data) {
    // 1. Si data.errors es un array o un objeto con detalles de validación
    if (data.errors) {
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const joined = data.errors
          .map((item) =>
            typeof item === 'object' && item !== null
              ? item.message || item.msg || JSON.stringify(item)
              : String(item)
          )
          .filter(Boolean)
          .join('. ');
        if (joined) return joined;
      } else if (typeof data.errors === 'object' && data.errors !== null) {
        const values = Object.values(data.errors)
          .map((val) =>
            typeof val === 'object' && val !== null
              ? val.message || val.msg || JSON.stringify(val)
              : String(val)
          )
          .filter(Boolean);
        if (values.length > 0) {
          return values.join('. ');
        }
      }
    }

    // 2. Si no hay errors pero existe message
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message.trim();
    }

    // 3. Si existe campo error (utilizado en múltiples endpoints del backend)
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error.trim();
    }

    // 4. Si existe campo mensaje
    if (typeof data.mensaje === 'string' && data.mensaje.trim()) {
      return data.mensaje.trim();
    }

    // Si data es una cadena de texto directa
    if (typeof data === 'string' && data.trim()) {
      return data.trim();
    }
  }

  // 5. Si ya tiene asignado un userMessage amigable previo
  if (typeof error.userMessage === 'string' && error.userMessage.trim()) {
    return error.userMessage.trim();
  }

  // 6. Si hubo respuesta del servidor pero no trajo un cuerpo estructurado
  if (error.response) {
    return defaultMsg;
  }

  // 7. Si fue un error de red / conexión sin respuesta HTTP
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.message) {
    return 'Error de conexión con el servidor. Verifique su red e intente nuevamente.';
  }

  // 8. Error personalizado del cliente (no técnico de Axios)
  if (
    typeof error.message === 'string' &&
    error.message.trim() &&
    !error.message.includes('Request failed with status code')
  ) {
    return error.message.trim();
  }

  // Fallback neutral
  return 'Error de conexión con el servidor. Verifique su red e intente nuevamente.';
};

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMsg = extractErrorMessage(error);
    console.error('API Error:', errorMsg);

    if (error && typeof error === 'object') {
      error.userMessage = errorMsg;
      error.message = errorMsg;
      return Promise.reject(error);
    }

    const err = new Error(errorMsg);
    err.userMessage = errorMsg;
    return Promise.reject(err);
  }
);

export { api };
export default api;

