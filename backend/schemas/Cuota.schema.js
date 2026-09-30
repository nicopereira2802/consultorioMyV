/** @format */

import { z } from "zod";

// Fecha de hoy
const hoy = new Date();

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

  fecha_vencimiento: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .min(hoy, { message: "La fecha de vencimiento debe ser mayor a hoy" }),

  fecha_cobro: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .optional(),

  metodo_pago: z
    .enum(["Efectivo", "Transferencia", "Tarjeta", "Otro"], {
      errorMap: (issue, ctx) => {
        if (issue.code === "invalid_enum_value") {
          return {
            message:
              'El metodo de pago debe ser únicamente "Efectivo", "Transferencia", "Tarjeta" u "Otro"',
          };
        }
        return { message: ctx.defaultError };
      },
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
    .positive("El monto de la cuota debe ser mayor a 0")
    .refine((val) => Number.isInteger(val * 100), {
      message: "El monto cobrado no puede tener más de 2 decimales",
    })
    .optional(),

  fecha_vencimiento: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .min(hoy, { message: "La fecha de vencimiento debe ser mayor a hoy" })
    .optional(),

  fecha_cobro: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .optional(),

  metodo_pago: z
    .enum(["Efectivo", "Transferencia", "Tarjeta", "Otro"], {
      errorMap: (issue, ctx) => {
        if (issue.code === "invalid_enum_value") {
          return {
            message:
              'El metodo de pago debe ser únicamente "Efectivo", "Transferencia", "Tarjeta" u "Otro"',
          };
        }
        return { message: ctx.defaultError };
      },
    })
    .optional(),
});
