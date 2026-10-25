/** @format */

import { z } from "zod";

const regexTexto = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-_]+$/;

export const createCategoriaGastoSchema = z.object({
  nombre: z
    .string({
      required_error: "El nombre de la categoría es obligatorio",
      invalid_type_error: "El nombre debe ser un texto",
    })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres")
    .regex(regexTexto, "El nombre contiene caracteres no permitidos"),

  descripcion: z
    .string({
      invalid_type_error: "La descripción debe ser un texto",
    })
    .trim()
    .max(255, "La descripción no puede superar los 255 caracteres")
    .optional()
    .nullish(),
});

export const updateCategoriaGastoSchema = z.object({
  nombre: z
    .string({
      invalid_type_error: "El nombre debe ser un texto",
    })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres")
    .regex(regexTexto, "El nombre contiene caracteres no permitidos")
    .optional(),

  descripcion: z
    .string({
      invalid_type_error: "La descripción debe ser un texto",
    })
    .trim()
    .max(255, "La descripción no puede superar los 255 caracteres")
    .optional()
    .nullish(),
});
