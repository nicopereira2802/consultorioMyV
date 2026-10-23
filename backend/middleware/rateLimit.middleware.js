/** @format */

import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// Limitador estricto para el PIN de 4 dígitos (máximo 3 intentos cada 15 minutos)
export const pinRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  skipSuccessfulRequests: true,
  message: {
    status: "error",
    mensaje: "Demasiados intentos de PIN fallidos. Intente nuevamente en 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Resetea completamente el rate limiter de PIN para la IP/terminal solicitante.
 * Elimina tanto la IP cruda como la clave transformada por ipKeyGenerator (IPv4 e IPv6).
 * @param {import('express').Request} req
 */
export const resetearPinRateLimit = async (req) => {
  if (!pinRateLimiter || typeof pinRateLimiter.resetKey !== "function") return;
  try {
    const rawIps = [
      req?.ip,
      req?.socket?.remoteAddress,
      req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim(),
      "127.0.0.1",
      "::1",
      "::ffff:127.0.0.1",
    ].filter(Boolean);

    const keysToReset = new Set();
    for (const rawIp of rawIps) {
      keysToReset.add(rawIp);
      try {
        if (typeof ipKeyGenerator === "function") {
          const genKey = ipKeyGenerator(rawIp);
          if (genKey) keysToReset.add(genKey);
        }
      } catch (_) {}
    }

    for (const key of keysToReset) {
      await pinRateLimiter.resetKey(key);
    }
  } catch (err) {
    console.warn("No se pudo resetear el rate limiter de PIN:", err?.message);
  }
};

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
