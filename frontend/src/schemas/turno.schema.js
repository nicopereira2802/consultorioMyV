import { z } from 'zod';

/**
 * Esquema de validación para Turno en Frontend (Zod)
 * Cumple con los requisitos del sistema:
 * - Selección válida de paciente y práctica.
 * - Soporte para fecha_hora_inicio, fecha, hora, duracion_minutos.
 * - Soporte explícito para motivo_consulta y notas_consulta.
 * - Campos opcionales toleran strings vacíos sin fallar (.optional().or(z.literal(''))).
 * - Usa .passthrough() para compatibilidad con flujos de agenda.
 */
export const turnoSchema = z
  .object({
    id_paciente: z.coerce
      .number({
        required_error: 'Debes seleccionar un paciente',
        invalid_type_error: 'El ID del paciente debe ser un número'
      })
      .int('El ID del paciente debe ser un número entero')
      .positive('Debes seleccionar un paciente válido'),

    id_practica: z.coerce
      .number({
        required_error: 'Debes seleccionar una práctica odontológica',
        invalid_type_error: 'El ID de la práctica debe ser un número'
      })
      .int('El ID de la práctica debe ser un número entero')
      .positive('Debes seleccionar una práctica odontológica válida')
      .optional()
      .nullable()
      .or(z.literal('')),

    fecha_hora_inicio: z
      .string({
        required_error: 'La fecha y hora de inicio son obligatorias'
      })
      .min(10, 'La fecha y hora de inicio no es válida')
      .optional()
      .nullable()
      .or(z.literal('')),

    fecha_hora_fin: z
      .string()
      .optional()
      .nullable()
      .or(z.literal('')),

    fecha: z
      .string()
      .optional()
      .nullable()
      .or(z.literal('')),

    hora: z
      .string()
      .optional()
      .nullable()
      .or(z.literal('')),

    duracion_minutos: z.coerce
      .number({
        invalid_type_error: 'La duración debe ser un número'
      })
      .int('La duración debe ser un número entero')
      .positive('La duración debe ser mayor a 0 minutos')
      .optional()
      .default(30),

    motivo_consulta: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal('')),

    notas_consulta: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal('')),

    precio_final: z.coerce
      .number({
        invalid_type_error: 'El precio final debe ser un número'
      })
      .min(0, 'El precio final no puede ser negativo')
      .optional()
      .nullable()
      .or(z.literal('')),

    id_estado: z.coerce
      .number()
      .int()
      .positive()
      .optional()
  })
  .passthrough();

export const createTurnoSchema = turnoSchema;
export const updateTurnoSchema = turnoSchema;
export default turnoSchema;
