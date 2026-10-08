/** @format */

import { z } from "zod";

const hoy = new Date();

export const createTurnoSchema = z
  .object({
    id_paciente: z.coerce
      .number({
        required_error: "El ID del paciente es obligatorio",
        invalid_type_error: "El ID del paciente debe ser un número",
      })
      .int("El ID debe ser un número entero")
      .positive("El ID no es válido"),

    id_estado: z.coerce
      .number({
        invalid_type_error: "El ID del estado debe ser un número",
      })
      .int("El ID debe ser un número entero")
      .positive("El ID no es válido")
      .optional()
      .default(1),

    id_practica: z.coerce
      .number({
        invalid_type_error: "El ID de la práctica debe ser un número",
      })
      .int("El ID de la práctica debe ser un número entero")
      .positive("El ID de la práctica no es válido")
      .optional(),

    practicas: z
      .array(
        z.union([
          z.coerce.number().int().positive(),
          z.object({ id_practica: z.coerce.number().int().positive() }).passthrough(),
        ]),
      )
      .optional(),

    id_practicas: z
      .array(
        z.union([
          z.coerce.number().int().positive(),
          z.object({ id_practica: z.coerce.number().int().positive() }).passthrough(),
        ]),
      )
      .optional(),

    practicas_realizadas: z.array(z.any()).optional(),

    fecha_hora_inicio: z.union([
      z.string().min(10),
      z.coerce.date({ invalid_type_error: "Formato de fecha inválido" }),
    ]),

    duracion_minutos: z.coerce
      .number({
        invalid_type_error: "La duración debe ser un número",
      })
      .int("La duración debe ser un número entero")
      .positive("La duración debe ser mayor a 0 minutos")
      .optional()
      .default(30),

    precio_final: z.coerce
      .number({
        invalid_type_error: "El precio final debe ser un número",
      })
      .min(0, "El precio final no puede ser negativo")
      .optional(),

    motivo_consulta: z
      .string({ invalid_type_error: "El motivo de consulta debe ser un texto" })
      .trim()
      .optional()
      .nullable(),

    notas_consulta: z
      .string({ invalid_type_error: "La observación debe ser un texto" })
      .trim()
      .optional()
      .nullable(),

    id_obra_social: z.union([z.number(), z.string()]).nullish(),
  })
  .passthrough();

export const updateTurnoSchema = z
  .object({
    id_paciente: z.coerce
      .number({
        invalid_type_error: "El ID del paciente debe ser un número",
      })
      .int("El ID debe ser un número entero")
      .positive("El ID no es válido")
      .optional(),

    id_estado: z.coerce
      .number({
        invalid_type_error: "El ID del estado debe ser un número",
      })
      .int("El ID debe ser un número entero")
      .positive("El ID no es válido")
      .optional(),

    id_practica: z.coerce
      .number({
        invalid_type_error: "El ID de la práctica debe ser un número",
      })
      .int("El ID de la práctica debe ser un número entero")
      .positive("El ID de la práctica no es válido")
      .optional(),

    practicas: z
      .array(
        z.union([
          z.coerce.number().int().positive(),
          z.object({ id_practica: z.coerce.number().int().positive() }).passthrough(),
        ]),
      )
      .optional(),

    id_practicas: z
      .array(
        z.union([
          z.coerce.number().int().positive(),
          z.object({ id_practica: z.coerce.number().int().positive() }).passthrough(),
        ]),
      )
      .optional(),

    practicas_realizadas: z.array(z.any()).optional(),

    fecha_hora_inicio: z
      .union([
        z.string().min(10),
        z.coerce.date({ invalid_type_error: "Formato de fecha inválido" }),
      ])
      .optional(),

    duracion_minutos: z.coerce
      .number({
        invalid_type_error: "La duración debe ser un número",
      })
      .int("La duración debe ser un número entero")
      .positive("La duración debe ser mayor a 0 minutos")
      .optional(),

    precio_final: z.coerce
      .number({
        invalid_type_error: "El precio final debe ser un número",
      })
      .min(0, "El precio final no puede ser negativo")
      .optional(),

    motivo_consulta: z
      .string({ invalid_type_error: "El motivo de consulta debe ser un texto" })
      .trim()
      .optional()
      .nullable(),

    notas_consulta: z
      .string({ invalid_type_error: "La observación debe ser un texto" })
      .trim()
      .optional()
      .nullable(),

    id_obra_social: z.union([z.number(), z.string()]).nullish(),
  })
  .passthrough();
