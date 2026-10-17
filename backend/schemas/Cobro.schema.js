/** @format */

import { z } from "zod";

export const createCobroSchema = z.object({
  id_turno: z
    .number({
      required_error: "El ID del turno es obligatorio",
      invalid_type_error: "El ID del turno debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido"),

  id_paciente: z
    .number({
      required_error: "El ID del paciente es obligatorio",
      invalid_type_error: "El ID del paciente debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido"),

  monto_a_cobrar: z
    .number({
      required_error: "El monto a cobrar es obligatorio",
      invalid_type_error: "El monto a cobrar debe ser un número",
    })
    .positive("El monto a cobrar debe ser mayor a 0")
    .refine((val) => Number.isInteger(val * 100), {
      message: "El monto a cobrar no puede tener más de 2 decimales",
    }),

  cant_cuotas: z
    .number({
      required_error: "La cantidad de cuotas es obligatoria",
      invalid_type_error: "La cantidad de cuotas debe ser un número",
    })
    .positive("La cantidad de cuotas debe ser mínimo 1"),
});

export const updateCobroSchema = z.object({
  id_turno: z
    .number({
      required_error: "El ID del turno es obligatorio",
      invalid_type_error: "El ID del turno debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido")
    .optional(),

  id_paciente: z
    .number({
      required_error: "El ID del paciente es obligatorio",
      invalid_type_error: "El ID del paciente debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido")
    .optional(),

  monto_a_cobrar: z
    .number({
      required_error: "El monto a cobrar es obligatorio",
      invalid_type_error: "El monto a cobrar debe ser un número",
    })
    .positive("El monto a cobrar debe ser mayor a 0")
    .refine((val) => Number.isInteger(val * 100), {
      message: "El monto a cobrar no puede tener más de 2 decimales",
    })
    .optional(),

  cant_cuotas: z
    .number({
      required_error: "La cantidad de cuotas es obligatoria",
      invalid_type_error: "La cantidad de cuotas debe ser un número",
    })
    .positive("La cantidad de cuotas debe ser mínimo 1")
    .optional(),
});
