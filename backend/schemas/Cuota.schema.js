/** @format */

import { z } from "zod";

// Fecha de hoy
const hoyString = new Date().toLocaleDateString("sv-SE");
const metodosPagoValidos = ["Efectivo", "Transferencia", "Tarjeta", "Otro"];

export const createCuotaSchema = z.object({
  id_cobro: z
    .number({
      required_error: "El ID del cobro es obligatorio",
      invalid_type_error: "El ID del cobro debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido"),

  monto_cuota: z
    .number({
      required_error: "El monto de la cuota es obligatorio",
      invalid_type_error: "El monto de la cuota debe ser un número",
    })
    .positive("El monto de la cuota debe ser mayor a 0")
    .refine((val) => Number.isInteger(val * 100), {
      message: "El monto de la cuota no puede tener más de 2 decimales",
    }),

  monto_cobrado: z
    .number({
      required_error: "El monto cobrado es obligatorio",
      invalid_type_error: "El monto cobrado debe ser un número",
    })
    .positive("El monto de la cuota debe ser mayor a 0")
    .refine((val) => Number.isInteger(val * 100), {
      message: "El monto cobrado no puede tener más de 2 decimales",
    })
    .optional(),

  fecha_vencimiento: z
    .string({
      required_error: "La fecha de vencimiento es requerida",
      invalid_type_error: "Formato de fecha inválido",
    })
    // Valida que cumpla estrictamente el formato YYYY-MM-DD
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Formato de fecha inválido (debe ser YYYY-MM-DD)",
    })
    // Compara directamente strings en formato ISO (ej: "2026-11-15" >= "2026-11-01")
    .refine((fecha) => fecha >= hoyString, {
      message: "La fecha de vencimiento debe ser mayor o igual a hoy",
    }),

  fecha_cobro: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .optional(),

  metodo_pago: z
    .enum(metodosPagoValidos, {
      errorMap: () => ({ message: "Método de pago no válido" }),
    })
    .optional()
    .nullable(),
});

export const updateCuotaSchema = z.object({
  id_cobro: z
    .number({
      required_error: "El ID del cobro es obligatorio",
      invalid_type_error: "El ID del cobro debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido")
    .optional(),

  monto_cuota: z
    .number({
      required_error: "El monto de la cuota es obligatorio",
      invalid_type_error: "El monto de la cuota debe ser un número",
    })
    .positive("El monto de la cuota debe ser mayor a 0")
    .refine((val) => Number.isInteger(val * 100), {
      message: "El monto de la cuota no puede tener más de 2 decimales",
    })
    .optional(),

  monto_cobrado: z
    .number({
      required_error: "El monto cobrado es obligatorio",
      invalid_type_error: "El monto cobrado debe ser un número",
    })
    .positive("El monto de la cuota debe ser mayor a 0")
    .refine((val) => Number.isInteger(val * 100), {
      message: "El monto cobrado no puede tener más de 2 decimales",
    })
    .optional(),

  fecha_vencimiento: z
    .string({
      required_error: "La fecha de vencimiento es requerida",
      invalid_type_error: "Formato de fecha inválido",
    })
    // Valida que cumpla estrictamente el formato YYYY-MM-DD
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Formato de fecha inválido (debe ser YYYY-MM-DD)",
    })
    // Compara directamente strings en formato ISO (ej: "2026-11-15" >= "2026-11-01")
    .refine((fecha) => fecha >= hoyString, {
      message: "La fecha de vencimiento debe ser mayor o igual a hoy",
    })
    .optional(),

  fecha_cobro: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .optional(),

  metodo_pago: z
    .enum(metodosPagoValidos, {
      errorMap: () => ({ message: "Método de pago no válido" }),
    })
    .optional()
    .nullable(),
});
