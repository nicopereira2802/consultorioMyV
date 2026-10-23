/** @format */

import api from "./api";

/**
 * Servicio de Autenticación
 * Conecta las operaciones de seguridad con los endpoints del Backend:
 * - Login Maestro (Vincular Dispositivo): POST /api/auth/login-maestro
 * - Validar PIN (Desbloqueo Diario): POST /api/auth/validar-pin
 * - Verificar Contraseña: POST /api/auth/verificar-password
 * - Recuperar/Cambiar PIN: POST /api/auth/recuperar-pin
 * - Solicitar Recuperación por Correo: POST /api/auth/recuperar-password
 * - Restablecer Contraseña: POST /api/auth/restablecer-password
 * - Refrescar Token: POST /api/auth/refresh-token
 */
export const authService = {
  /**
   * Login Maestro / Vincular Dispositivo con JWT de 5 días
   * @param {string} nombre_usuario
   * @param {string} contraseña
   * @returns {Promise<{ status: string, mensaje: string, token: string, expiraEn: string, usuario: object }>}
   */
  loginMaestro: async (nombre_usuario, contraseña) => {
    const res = await api.post("/auth/login-maestro", {
      nombre_usuario,
      contraseña,
      usuario: nombre_usuario,
      password: contraseña,
    });
    return res.data;
  },

  /**
   * Desbloqueo Diario con PIN de 4 dígitos
   * @param {string} pin
   * @returns {Promise<{ status: string, mensaje: string, desbloqueado: boolean }>}
   */
  validarPin: async (pin) => {
    const res = await api.post("/auth/validar-pin", { pin });
    return res.data;
  },

  /**
   * Verificar Contraseña Maestra (para autorizar cambio de PIN)
   * @param {string} contraseña
   * @param {string} [nombre_usuario]
   * @returns {Promise<{ status: string, mensaje: string, autorizada: boolean }>}
   */
  verificarPassword: async (contraseña, nombre_usuario) => {
    const res = await api.post("/auth/verificar-password", {
      contraseña,
      password: contraseña,
      nombre_usuario,
      usuario: nombre_usuario,
    });
    return res.data;
  },

  /**
   * Cambiar / Restablecer PIN validando la contraseña maestra
   * @param {string} contraseña
   * @param {string} nuevo_pin
   * @param {string} [nombre_usuario]
   * @returns {Promise<{ status: string, mensaje: string }>}
   */
  recuperarPin: async (contraseña, nuevo_pin, nombre_usuario) => {
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
  },

  /**
   * Solicitar recuperación de contraseña por email
   * @param {string} email
   * @returns {Promise<{ status: string, mensaje: string }>}
   */
  recuperarPassword: async (email) => {
    const res = await api.post("/auth/recuperar-password", { email });
    return res.data;
  },

  /**
   * Restablecer contraseña consumiendo el código PIN de 6 dígitos
   * @param {string} codigo
   * @param {string} nueva_contraseña
   * @returns {Promise<{ status: string, mensaje: string }>}
   */
  restablecerPassword: async (codigo, nueva_contraseña) => {
    const res = await api.post("/auth/restablecer-password", {
      codigo,
      token: codigo,
      nueva_contraseña,
    });
    return res.data;
  },

  /**
   * Refresco de token JWT
   * @returns {Promise<{ status: string, token: string, expiraEn: string }>}
   */
  refreshToken: async () => {
    const res = await api.post("/auth/refresh-token");
    return res.data;
  },
};

export default authService;
