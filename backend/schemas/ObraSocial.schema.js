import { z } from "zod";

// Expresión regular que permite letras (A-Z, a-z), acentos, ñ, Ü y espacios
const nombreRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,°#\-\/]+$/;

export const createObraSocialSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre es obligatorio", invalid_type_error: "El nombre debe ser un texto" })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede superar los 50 caracteres")
    .regex(
      nombreRegex,
      "El nombre no puede contener números ni caracteres especiales como (), [], {}, comillas o comas",
    ),

  activo: z.boolean({ invalid_type_error: "El campo activo debe ser booleano" }).optional(),
});
