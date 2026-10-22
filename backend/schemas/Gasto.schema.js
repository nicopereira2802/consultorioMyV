/** @format */

import { z } from "zod";

const metodosPagoEnum = ["Efectivo", "Transferencia", "Tarjeta", "Otro"];

export const createGastoSchema = z.object({
  id_categoria_gasto: z.coerce
    .number({
      required_error: "La categoría del gasto es obligatoria",
      invalid_type_error: "La categoría debe ser un número entero",
    })
    .int("La categoría debe ser un ID válido")
    .positive("La categoría seleccionada no es válida"),

  monto: z.coerce
    .number({
      required_error: "El monto es obligatorio",
      invalid_type_error: "El monto debe ser numérico",
    })
    .positive("El monto debe ser mayor a 0"),

  concepto: z
    .string({
      required_error: "El concepto es obligatorio",
      invalid_type_error: "El concepto debe ser un texto",
    })
    .trim()
    .min(3, "El concepto debe tener al menos 3 caracteres")
    .max(255, "El concepto no puede superar los 255 caracteres"),

  fecha_gasto: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .optional(),

  metodo_pago: z
    .enum(metodosPagoEnum, {
      errorMap: () => ({ message: "Método de pago inválido (Efectivo, Transferencia, Tarjeta, Otro)" }),
    })
    .default("Efectivo"),

  comprobante: z
    .string({ invalid_type_error: "El comprobante debe ser un texto" })
    .trim()
    .max(100, "El comprobante no puede superar los 100 caracteres")
    .optional()
    .nullish(),

  notas: z
    .string({ invalid_type_error: "Las notas deben ser un texto" })
    .trim()
    .max(500, "Las notas no pueden superar los 500 caracteres")
    .optional()
    .nullish(),
});

export const updateGastoSchema = z.object({
  id_categoria_gasto: z.coerce.number().int().positive().optional(),

  monto: z.coerce.number().positive("El monto debe ser mayor a 0").optional(),

  concepto: z.string().trim().min(3, "El concepto debe tener al menos 3 caracteres").max(255).optional(),

  fecha_gasto: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .optional(),

  metodo_pago: z.enum(metodosPagoEnum).optional(),

  comprobante: z.string().trim().max(100).optional().nullish(),

  notas: z.string().trim().max(500).optional().nullish(),
});
