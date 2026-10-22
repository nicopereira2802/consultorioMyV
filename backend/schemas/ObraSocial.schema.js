/** @format */

import { z } from "zod";

// Expresión regular que permite letras (A-Z, a-z), acentos, ñ, Ü, números, espacios y caracteres habituales
const textoRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,°#\-\/]+$/;
const telefonoRegex = /^[0-9\+\-\s\(\)]+$/;

export const createObraSocialSchema = z.object({
  nombre: z
    .string({
      required_error: "El nombre es obligatorio",
      invalid_type_error: "El nombre debe ser un texto",
    })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres")
    .regex(
      textoRegex,
      "El nombre no puede contener números ni caracteres especiales como (), [], {}, comillas o comas",
    ),

  razon_social: z
    .string({
      required_error: "La razón social es obligatoria",
      invalid_type_error: "La razón social debe ser un texto",
    })
    .trim()
    .min(2, "La razón social debe tener al menos 2 caracteres")
    .max(150, "La razón social no puede superar los 150 caracteres")
    .regex(
      textoRegex,
      "La razón social no puede contener caracteres especiales no permitidos",
    ),

  telefono: z
    .string({
      invalid_type_error: "El teléfono debe ser un texto",
    })
    .trim()
    .min(8, "El teléfono debe tener al menos 8 caracteres")
    .max(30, "El teléfono no puede superar los 30 caracteres")
    .regex(telefonoRegex, "El teléfono solo puede contener números, espacios y los símbolos + - ( )")
    .optional()
    .nullable(),

  email: z
    .string({
      invalid_type_error: "El email debe ser un texto",
    })
    .trim()
    .email("El formato del correo electrónico no es válido")
    .optional()
    .nullable(),

  activo: z
    .boolean({ invalid_type_error: "El campo activo debe ser booleano" })
    .optional(),
});

export const updateObraSocialSchema = z.object({
  nombre: z
    .string({
      invalid_type_error: "El nombre debe ser un texto",
    })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres")
    .regex(
      textoRegex,
      "El nombre no puede contener números ni caracteres especiales como (), [], {}, comillas o comas",
    )
    .optional(),

  razon_social: z
    .string({
      invalid_type_error: "La razón social debe ser un texto",
    })
    .trim()
    .min(2, "La razón social debe tener al menos 2 caracteres")
    .max(150, "La razón social no puede superar los 150 caracteres")
    .regex(
      textoRegex,
      "La razón social no puede contener caracteres especiales no permitidos",
    )
    .optional(),

  telefono: z
    .string({
      invalid_type_error: "El teléfono debe ser un texto",
    })
    .trim()
    .min(8, "El teléfono debe tener al menos 8 caracteres")
    .max(30, "El teléfono no puede superar los 30 caracteres")
    .regex(telefonoRegex, "El teléfono solo puede contener números, espacios y los símbolos + - ( )")
    .optional()
    .nullable(),

  email: z
    .string({
      invalid_type_error: "El email debe ser un texto",
    })
    .trim()
    .email("El formato del correo electrónico no es válido")
    .optional()
    .nullable(),

  activo: z
    .boolean({ invalid_type_error: "El campo activo debe ser booleano" })
    .optional(),
});
