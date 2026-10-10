/** @format */

import { z } from "zod";

const hoy = new Date();

export const createTurnoSchema = z.object({
  id_paciente: z
    .number({
      required_error: "El ID del paciente es obligatorio",
      invalid_type_error: "El ID del paciente debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido"),

  fecha_hora_inicio: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .min(hoy, { message: "La fecha de inicio no es válida" }),

  fecha_hora_fin: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .min(hoy, { message: "La fecha de fin no es válida" }),

  precio_final: z
    .number({
      required_error: "El precio final es obligatorio",
      invalid_type_error: "El precio final debe ser un número",
    })
    .nonnegative("El precio final debe ser mayor o igual a 0")
    .refine((val) => Number.isInteger(val * 100), {
      message: "El precio no puede tener más de 2 decimales",
    }),

  notas_consulta: z
    .string({ invalid_type_error: "Las notas de consulta deben ser un texto" })
    .trim()
    .optional(),
});

export const updateTurnoSchema = z.object({
  id_paciente: z
    .number({
      required_error: "El ID del paciente es obligatorio",
      invalid_type_error: "El ID del paciente debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido")
    .optional(),

  fecha_hora_inicio: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .min(hoy, { message: "La fecha de inicio no es válida" })
    .optional(),

  fecha_hora_fin: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .min(hoy, { message: "La fecha de fin no es válida" })
    .optional(),

  precio_final: z
    .number({
      required_error: "El precio final es obligatorio",
      invalid_type_error: "El precio final debe ser un número",
    })
    .nonnegative("El precio final debe ser mayor o igual a 0")
    .refine((val) => Number.isInteger(val * 100), {
      message: "El precio no puede tener más de 2 decimales",
    }).optional(),

  notas_consulta: z
    .string({ invalid_type_error: "Las notas de consulta deben ser un texto" })
    .trim()
    .optional(),
});

export const atenderTurnoSchema = z.object({
  id_paciente: z
    .number({
      required_error: "El ID del paciente es obligatorio",
      invalid_type_error: "El ID del paciente debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido")
    .optional(),

  fecha_hora_inicio: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .min(hoy, { message: "La fecha de inicio no es válida" })
    .optional(),

  fecha_hora_fin: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .min(hoy, { message: "La fecha de fin no es válida" })
    .optional(),

  precio_final: z
    .number({
      required_error: "El precio final es obligatorio",
      invalid_type_error: "El precio final debe ser un número",
    })
    .positive("El precio final debe ser mayor a 0")
    .refine((val) => Number.isInteger(val * 100), {
      message: "El precio no puede tener más de 2 decimales",
    }).optional(),

  notas_consulta: z
    .string({ invalid_type_error: "Las notas de consulta deben ser un texto" })
    .trim()
    .optional(),
});

