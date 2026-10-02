import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const mensaje = error.response?.data?.mensaje || error.message || 'Error de conexión con el servidor';
    console.error('API Error:', mensaje);
    return Promise.reject(new Error(mensaje));
  }
);

export default api;
