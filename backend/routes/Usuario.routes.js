/** @format */

import express from "express";
const router = express.Router();

import * as UsuarioController from "../controllers/Usuario.controller.js";
import { validateSchema } from "../middleware/validateSchema.js";
import {
  pinRateLimiter,
  authRateLimiter,
  mailResetLimiter,
  verifyCodeLimiter,
} from "../middleware/rateLimit.middleware.js";
import {
  createUsuarioSchema,
  loginMaestroSchema,
  validarPinSchema,
  verificarPasswordSchema,
  recuperarPinSchema,
  recuperarPasswordSchema,
  restablecerPasswordSchema,
} from "../schemas/Usuario.schema.js";

// 1. Capa Maestra: Login y vinculación de dispositivo (JWT de 5 días)
router.post("/login-maestro", authRateLimiter, validateSchema(loginMaestroSchema), UsuarioController.loginMaestro);
router.post("/vincular-dispositivo", authRateLimiter, validateSchema(loginMaestroSchema), UsuarioController.loginMaestro);

// 2. Capa Diaria: Desbloqueo rápido mediante PIN de 4 dígitos
router.post("/validar-pin", pinRateLimiter, validateSchema(validarPinSchema), UsuarioController.validarPin);

// 3. Recuperación de PIN: Verificación de clave maestra y actualización
router.post("/verificar-password", authRateLimiter, validateSchema(verificarPasswordSchema), UsuarioController.verificarPassword);
router.post("/recuperar-pin", authRateLimiter, validateSchema(recuperarPinSchema), UsuarioController.recuperarPin);

// 4. Recuperación de Contraseña por Correo
router.post("/recuperar-password", mailResetLimiter, validateSchema(recuperarPasswordSchema), UsuarioController.solicitarRecuperacionPassword);
router.post("/restablecer-password", verifyCodeLimiter, validateSchema(restablecerPasswordSchema), UsuarioController.restablecerPassword);

// 5. Sesión y Tokens
router.post("/refresh-token", UsuarioController.refreshToken);
router.post("/refreshToken", UsuarioController.refreshToken);

// 6. Registro / Creación de Usuario
router.post("/registro", validateSchema(createUsuarioSchema), UsuarioController.createUsuario);
router.post("/", validateSchema(createUsuarioSchema), UsuarioController.createUsuario);

export default router;