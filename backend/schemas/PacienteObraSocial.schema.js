import { z } from "zod";

const nroAfiliadoRegex = /^[a-zA-Z0-9\/\-]$/

export const createPacienteObraSocialSchema = z.object({
  id_paciente: z
    .number({
      required_error: "El ID del paciente es obligatorio",
      invalid_type_error: "El ID del paciente debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido"),

  id_obra_social: z
    .number({
      required_error: "El ID de la obra social es obligatorio",
      invalid_type_error: "El ID de la obra social debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido"),

  nro_afiliado: z
    .string({
      required_error: "El número de afiliado es obligatorio",
      invalid_type_error: "El número de afiliado debe ser un texto",
    })
    .min(2, "El número de afiliado debe tener al menos 2 caracteres")
    .max(100, "El número de afiliado no puede superar los 100 caracteres")
    .regex(
      nroAfiliadoRegex,
      "El nombre no puede contener números ni caracteres especiales como (), [], {}, comillas o comas",
    ),
});
