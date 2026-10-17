/** @format */

import rateLimit from "express-rate-limit";

// Limitador estricto para el PIN de 4 dígitos (máximo 5 intentos cada 15 minutos)
export const pinRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: "error",
    mensaje: "Demasiados intentos de PIN fallidos. Intente nuevamente en 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitador para Login Maestro y verificación de credenciales (máximo 10 intentos cada 15 minutos)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: "error",
    mensaje: "Demasiados intentos de inicio de sesión. Intente nuevamente en 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Máximo 3 solicitudes de recuperación cada 15 minutos por IP (Anti Mail-Bombing)
export const mailResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    status: "error",
    mensaje: "Has superado el límite de solicitudes de recuperación. Por seguridad, espera 15 minutos para volver a intentar.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Máximo 3 intentos de verificación/cambio de contraseña cada 15 minutos por IP (Anti Brute-Force PIN)
export const verifyCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // Máximo 3 intentos permitidos
  skipSuccessfulRequests: true, // Si el código y cambio son exitosos, no penaliza al usuario
  message: {
    status: "error",
    mensaje: "Demasiados intentos fallidos con el código de verificación. Acceso temporalmente bloqueado por 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
