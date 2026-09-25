import { z } from "zod";

// Expresión regular que permite letras (A-Z, a-z), acentos, ñ, Ü y espacios
const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

export const createUsuarioSchema = z.object({
  nombre_usuario: z
    .string({
      required_error: "El nombre de usuario es obligatorio",
      invalid_type_error: "El nombre de usuario debe ser un texto",
    })
    .trim()
    .min(2, "El nombre de usuario debe tener al menos 2 caracteres")
    .max(50, "El nombre de usuario no puede superar los 50 caracteres")
    .regex(
      regex,
      "El nombre de usuario no puede contener números ni caracteres especiales como (), [], {}, comillas o comas",
    ),

  contraseña: z
    .string({
      required_error: "La contraseña es obligatoria",
      invalid_type_error: "La contraseña debe ser una cadena de texto",
    })
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña no puede superar los 100 caracteres")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una letra mayúscula")
    .regex(/[a-z]/, "La contraseña debe contener al menos una letra minúscula")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "La contraseña debe contener al menos un carácter especial (@, $, !, %, *, etc.)"),

  rol: z.enum(["admin", "odontologo"], {
    errorMap: (issue, ctx) => {
      if (issue.code === "invalid_enum_value") {
        return { message: 'El rol debe ser únicamente "admin" o "odontologo"' };
      }
      return { message: ctx.defaultError };
    },
  }),
});
