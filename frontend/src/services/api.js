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
 * Admite únicamente la contraseña o (usuario, contraseña) por retrocompatibilidad
 * @param {string} param1 - Contraseña (o nombre_usuario si se envían 2 argumentos)
 * @param {string} [param2] - Contraseña si param1 fue nombre_usuario
 * @returns {Promise<{ status: string, mensaje: string, token: string, expiraEn: string, usuario: object }>}
 */
export const loginMaestro = async (param1, param2) => {
  const password = param2 !== undefined ? param2 : param1;
  const payload = {
    password,
    contraseña: password,
  };
  if (param2 !== undefined && param1) {
    payload.nombre_usuario = param1;
    payload.usuario = param1;
  }
  const res = await api.post("/auth/login", payload);
  return res.data;
};

export const login = loginMaestro;

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
  const payload = email ? { email } : {};
  const res = await api.post("/auth/recuperar-password", payload);
  return res.data;
};

export const solicitarRecuperacionPin = recuperarPassword;
export const solicitarRecuperacion = recuperarPassword;
export const olvidoPassword = recuperarPassword;

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
  login,
  loginMaestro,
  validarPin,
  verificarPin,
  verificarPassword,
  recuperarPin,
  cambiarPin,
  recuperarPassword,
  solicitarRecuperacionPin,
  solicitarRecuperacion,
  olvidoPassword,
  restablecerPassword,
  refreshToken,
};

api.auth = authService;

export default api;
