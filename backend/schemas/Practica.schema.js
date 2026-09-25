import { z } from "zod";

const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]+$/;

export const createPracticaSchema = z.object({
  codigo_nomenclador: z
    .string({
      required_error: "El codigo nomenclador es obligatorio",
      invalid_type_error: "El codigo nomenclador debe ser un texto",
    })
    .trim()
    .min(2, "El codigo nomenclador debe tener al menos 2 caracteres")
    .max(50, "El codigo nomenclador no puede superar los 50 caracteres"),

  nombre_nomenclador: z
    .string({
      required_error: "El nombre nomenclador es obligatorio",
      invalid_type_error: "El nombre nomenclador debe ser un texto",
    })
    .trim()
    .min(2, "El nombre nomenclador debe tener al menos 2 caracteres")
    .max(50, "El nombre nomenclador no puede superar los 50 caracteres"),

  nombre_referencia: z
    .string({
      required_error: "El nombre referencia es obligatorio",
      invalid_type_error: "El nombre referencia debe ser un texto",
    })
    .trim()
    .min(2, "El nombre referencia debe tener al menos 2 caracteres")
    .max(50, "El nombre referencia no puede superar los 50 caracteres"),

  especialidad: z
    .string({
      required_error: "La especialidad es obligatoria",
      invalid_type_error: "La especialidad debe ser un texto",
    })
    .trim()
    .min(2, "La especialidad debe tener al menos 2 caracteres")
    .max(50, "La especialidad no puede superar los 50 caracteres")
    .regex(
      regex,
      "La especialidad no puede contener caracteres especiales como (), [], {}, comillas o comas",
    ),

  precio_referencia: z
    .number({
      required_error: "El precio de referencia es obligatorio",
      invalid_type_error: "El precio de referencia debe ser un número",
    })
    .positive("El precio de referencia debe ser mayor a 0")
    .refine((val) => Number.isInteger(val * 100), { message: "El precio no puede tener más de 2 decimales" }),

  activo: z.boolean({ invalid_type_error: "El campo activo debe ser booleano" }).optional(),
});
