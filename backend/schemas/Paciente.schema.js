import { z } from "zod";

// Expresión regular que permite letras (A-Z, a-z), acentos, ñ, Ü y espacios
const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
const domicilioRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,°#\-\/]+$/;

// Fecha de hoy
const hoy = new Date();

// Fecha límite máxima: Hace 1 año exacto (no permite bebés de menos de 1 año ni fechas futuras/recientes)
const fechaMaxima = new Date();
fechaMaxima.setFullYear(hoy.getFullYear() - 1);

// Fecha límite mínima: Hace 120 años (evita fechas inconsistentes como el año 1800)
const fechaMinima = new Date();
fechaMinima.setFullYear(hoy.getFullYear() - 120);

export const createPacienteSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre es obligatorio", invalid_type_error: "El nombre debe ser un texto" })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede superar los 50 caracteres")
    .regex(
      regex,
      "El nombre no puede contener números ni caracteres especiales como (), [], {}, comillas o comas",
    ),

  apellido: z
    .string({
      required_error: "El apellido es obligatorio",
      invalid_type_error: "El apellido debe ser un texto",
    })
    .trim()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede superar los 50 caracteres")
    .regex(
      regex,
      "El apellido no puede contener números ni caracteres especiales como (), [], {}, comillas o comas",
    ),

  dni: z
    .number({ invalid_type_error: "El DNI debe ser un número" })
    .int("El DNI no puede tener decimales")
    .positive("El DNI debe ser un número positivo")
    .optional(),

  fecha_nacimiento: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .max(fechaMaxima, { message: "El paciente debe tener al menos 1 año de edad" })
    .min(fechaMinima, { message: "La fecha de nacimiento no es válida" })
    .optional(),

  telefono: z.string().trim().min(8, "El teléfono debe tener al menos 8 dígitos"),

  domicilio: z
    .string({ invalid_type_error: "El apellido debe ser un texto" })
    .trim()
    .min(2, "El domicilio debe tener al menos 2 caracteres")
    .regex(domicilioRegex, "El domicilio no puede contener caracteres especiales como (), [], {}")
    .optional(),
});
