/** @format */

import { z } from "zod";

const metodosPagoValidos = ["Efectivo", "Transferencia", "Tarjeta", "Otro"];
const estadosValidos = ["Pendiente", "Pagada", "Parcialmente pagada"];

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
      invalid_type_error: "El monto cobrado debe ser un número",
    })
    .min(0, "El monto cobrado no puede ser negativo")
    .refine((val) => Number.isInteger(val * 100), {
      message: "El monto cobrado no puede tener más de 2 decimales",
    })
    .optional()
    .nullable(),

  fecha_vencimiento: z
    .string({
      required_error: "La fecha de vencimiento es requerida",
      invalid_type_error: "Formato de fecha inválido",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Formato de fecha inválido (debe ser YYYY-MM-DD)",
    })
    .optional()
    .nullable(),

  fecha_cobro: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .optional()
    .nullable(),

  metodo_pago: z
    .enum(metodosPagoValidos, {
      errorMap: () => ({ message: "Método de pago no válido" }),
    })
    .optional()
    .nullable(),

  estado: z
    .enum(estadosValidos, {
      errorMap: () => ({ message: "El estado no es válido" }),
    })
    .optional(),
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
    .min(0, "El monto cobrado no puede ser negativo")
    .refine((val) => Number.isInteger(val * 100), {
      message: "El monto cobrado no puede tener más de 2 decimales",
    })
    .optional(),

  fecha_vencimiento: z
    .string({
      required_error: "La fecha de vencimiento es requerida",
      invalid_type_error: "Formato de fecha inválido",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Formato de fecha inválido (debe ser YYYY-MM-DD)",
    })
    .optional(),

  fecha_cobro: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .optional()
    .nullable(),

  metodo_pago: z
    .enum(metodosPagoValidos, {
      errorMap: () => ({ message: "Método de pago no válido" }),
    })
    .optional()
    .nullable(),

  estado: z
    .enum(estadosValidos, {
      errorMap: () => ({ message: "El estado no es válido" }),
    })
    .optional(),
});
