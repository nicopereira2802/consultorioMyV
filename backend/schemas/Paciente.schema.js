/** @format */

import { z } from "zod";

// Expresión regular que permite letras (A-Z, a-z), acentos, ñ, Ü y espacios
const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
const dniRegex = /^[0-9\s]+$/;
const domicilioRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,°#\-\/]+$/;

// Fecha límite mínima: Hace 120 años (evita fechas inconsistentes como el año 1800)
export const fechaNacimientoSchema = z
  .union([
    z.string().trim().length(0).transform(() => null),
    z.null(),
    z.undefined(),
    z.date().transform((d) => d.toISOString().slice(0, 10)),
    z
      .string()
      .trim()
      .transform((val) => (val.includes("T") ? val.split("T")[0] : val))
      .pipe(
        z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido")
          .refine((val) => {
            const [year, month, day] = val.split("-").map(Number);
            const d = new Date(Date.UTC(year, month - 1, day));
            return (
              d.getUTCFullYear() === year &&
              d.getUTCMonth() === month - 1 &&
              d.getUTCDate() === day
            );
          }, "Formato de fecha inválido")
          .refine((val) => {
            const hoy = new Date().toISOString().slice(0, 10);
            return val <= hoy;
          }, "La fecha de nacimiento no puede ser futura")
          .refine((val) => {
            const minYear = new Date().getFullYear() - 120;
            return parseInt(val.slice(0, 4), 10) >= minYear;
          }, "La fecha de nacimiento no es válida"),
      ),
  ])
  .optional()
  .nullish();

export const createPacienteSchema = z.object({
  nombre: z
    .string({
      required_error: "El nombre es obligatorio",
      invalid_type_error: "El nombre debe ser un texto",
    })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede superar los 50 caracteres")
    .regex(
      regex,
      "El nombre no puede contener números ni caracteres especiales como (), [], {}, comillas o comas",
    ),

  apellido: z
    .string({
      required_error: "El apellido es obligatorio",
      invalid_type_error: "El apellido debe ser un texto",
    })
    .trim()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede superar los 50 caracteres")
    .regex(
      regex,
      "El apellido no puede contener números ni caracteres especiales como (), [], {}, comillas o comas",
    ),

  dni: z
    .string({
      required_error: "El dni es obligatorio",
      invalid_type_error: "El dni debe ser un texto",
    })
    .trim()
    .min(2, "El dni debe tener al menos 2 caracteres")
    .max(50, "El dni no puede superar los 50 caracteres")
    .regex(
      dniRegex,
      "El dni no puede contener números ni caracteres especiales como (), [], {}, comillas o comas",
    )
    .optional()
    .nullish(),

  fecha_nacimiento: fechaNacimientoSchema,

  telefono: z
    .string()
    .trim()
    .min(8, "El teléfono debe tener al menos 8 dígitos"),

  domicilio: z
    .string({ invalid_type_error: "El domicilio debe ser un texto" })
    .trim()
    .min(2, "El domicilio debe tener al menos 2 caracteres")
    .regex(
      domicilioRegex,
      "El domicilio no puede contener caracteres especiales como (), [], {}",
    )
    .optional()
    .nullish(),
});

export const updatePacienteSchema = z.object({
  nombre: z
    .string({
      required_error: "El nombre es obligatorio",
      invalid_type_error: "El nombre debe ser un texto",
    })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede superar los 50 caracteres")
    .regex(
      regex,
      "El nombre no puede contener números ni caracteres especiales como (), [], {}, comillas o comas",
    )
    .optional(),

  apellido: z
    .string({
      required_error: "El apellido es obligatorio",
      invalid_type_error: "El apellido debe ser un texto",
    })
    .trim()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede superar los 50 caracteres")
    .regex(
      regex,
      "El apellido no puede contener números ni caracteres especiales como (), [], {}, comillas o comas",
    )
    .optional(),

  dni: z
    .string({
      invalid_type_error: "El dni debe ser un texto",
    })
    .trim()
    .min(2, "El dni debe tener al menos 2 caracteres")
    .max(50, "El dni no puede superar los 50 caracteres")
    .regex(
      dniRegex,
      "El dni no puede contener números ni caracteres especiales como (), [], {}, comillas o comas",
    )
    .optional()
    .nullish(),

  fecha_nacimiento: fechaNacimientoSchema,

  telefono: z
    .string()
    .trim()
    .min(8, "El teléfono debe tener al menos 8 dígitos")
    .optional(),

  domicilio: z
    .string({ invalid_type_error: "El domicilio debe ser un texto" })
    .trim()
    .min(2, "El domicilio debe tener al menos 2 caracteres")
    .regex(
      domicilioRegex,
      "El domicilio no puede contener caracteres especiales como (), [], {}",
    )
    .optional()
    .nullish(),
});
