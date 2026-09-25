import { z } from "zod";

export const createPracticaTurnoSchema = z.object({
  id_turno: z
    .number({
      required_error: "El ID del turno es obligatorio",
      invalid_type_error: "El ID del turno debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido"),

  id_practica: z
    .number({
      required_error: "El ID de la practica es obligatorio",
      invalid_type_error: "El ID de la practica debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido"),
});
