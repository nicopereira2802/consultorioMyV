import axios from "axios";

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".local")
    ) {
      return `http://${hostname}:3000/api`;
    }
  }
  return import.meta.env.DEV
    ? "http://localhost:3000/api"
    : "https://api.espaciocuatrovientos.com/api";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("jwt_dispositivo");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Login Maestro / Vincular Dispositivo con JWT de 5 días
 * @param {string} nombre_usuario
 * @param {string} contraseña
 * @returns {Promise<{ status: string, mensaje: string, token: string, expiraEn: string, usuario: object }>}
 */
export const loginMaestro = async (nombre_usuario, contraseña) => {
  const res = await api.post("/auth/login-maestro", {
    nombre_usuario,
    contraseña,
    usuario: nombre_usuario,
    password: contraseña,
  });
  return res.data;
};

/**
 * Desbloqueo Diario con PIN de 4 dígitos
 * @param {string} pin
 * @returns {Promise<{ status: string, mensaje: string, desbloqueado: boolean }>}
 */
export const validarPin = async (pin) => {
  const res = await api.post("/auth/validar-pin", { pin });
  return res.data;
};

export const verificarPin = validarPin;

/**
 * Verificar Contraseña Maestra (para autorizar cambio de PIN)
 * @param {string} contraseña
 * @param {string} [nombre_usuario]
 * @returns {Promise<{ status: string, mensaje: string, autorizada: boolean }>}
 */
export const verificarPassword = async (contraseña, nombre_usuario) => {
  const res = await api.post("/auth/verificar-password", {
    contraseña,
    password: contraseña,
    nombre_usuario,
    usuario: nombre_usuario,
  });
  return res.data;
};

/**
 * Cambiar / Restablecer PIN validando la contraseña maestra
 * @param {string} contraseña
 * @param {string} nuevo_pin
 * @param {string} [nombre_usuario]
 * @returns {Promise<{ status: string, mensaje: string }>}
 */
export const recuperarPin = async (contraseña, nuevo_pin, nombre_usuario) => {
  const res = await api.post("/auth/recuperar-pin", {
    contraseña,
    password: contraseña,
    nuevo_pin,
    nuevoPin: nuevo_pin,
    pin: nuevo_pin,
    nombre_usuario,
    usuario: nombre_usuario,
  });
  return res.data;
};

export const cambiarPin = recuperarPin;

/**
 * Solicitar recuperación de contraseña por email
 * @param {string} email
 * @returns {Promise<{ status: string, mensaje: string }>}
 */
export const recuperarPassword = async (email) => {
  const res = await api.post("/auth/recuperar-password", { email });
  return res.data;
};

export const solicitarRecuperacion = recuperarPassword;

/**
 * Restablecer contraseña consumiendo el código PIN de 6 dígitos
 * @param {string} codigo
 * @param {string} nueva_contraseña
 * @returns {Promise<{ status: string, mensaje: string }>}
 */
export const restablecerPassword = async (codigo, nueva_contraseña) => {
  const res = await api.post("/auth/restablecer-password", {
    codigo,
    token: codigo,
    nueva_contraseña,
    password: nueva_contraseña,
  });
  return res.data;
};

/**
 * Refresco de token JWT
 * @returns {Promise<{ status: string, token: string, expiraEn: string }>}
 */
export const refreshToken = async () => {
  const res = await api.post("/auth/refresh-token");
  return res.data;
};

/**
 * Objeto agrupador authService
 */
export const authService = {
  loginMaestro,
  validarPin,
  verificarPin,
  verificarPassword,
  recuperarPin,
  cambiarPin,
  recuperarPassword,
  solicitarRecuperacion,
  restablecerPassword,
  refreshToken,
};

api.auth = authService;

export default api;
