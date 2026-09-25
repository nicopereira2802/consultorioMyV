import { z } from "zod";

export const createHistorialEstadoTurnoSchema = z.object({
  id_turno: z
    .number({
      required_error: "El ID del turno es obligatorio",
      invalid_type_error: "El ID del turno debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido"),

  id_estado: z
    .number({
      required_error: "El ID del estado es obligatorio",
      invalid_type_error: "El ID del estado debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido"),

  fecha_hora_cambio: z.coerce.date({
    invalid_type_error: "Formato de fecha inválido",
  }),
});
