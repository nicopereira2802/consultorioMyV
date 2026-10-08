import { z } from 'zod';

/**
 * Esquema de validación para Paciente en Frontend (Zod)
 * Cumple con los requisitos del sistema:
 * - DNI numérico de 7 u 8 dígitos (/^\d{7,8}$/).
 * - Campos opcionales toleran strings vacíos sin fallar (.optional().or(z.literal(''))).
 * - Usa .passthrough() para flexibilidad con metadatos.
 */
export const pacienteSchema = z
  .object({
    nombre: z
      .string({
        required_error: 'El nombre es obligatorio',
        invalid_type_error: 'El nombre debe ser un texto'
      })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede superar los 50 caracteres'),

    apellido: z
      .string({
        required_error: 'El apellido es obligatorio',
        invalid_type_error: 'El apellido debe ser un texto'
      })
      .trim()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(50, 'El apellido no puede superar los 50 caracteres'),

    dni: z
      .string()
      .trim()
      .regex(/^\d{7,8}$/, 'El DNI debe tener entre 7 y 8 dígitos numéricos')
      .optional()
      .nullable()
      .or(z.literal('')),

    fecha_nacimiento: z
      .string()
      .optional()
      .nullable()
      .or(z.literal('')),

    telefono: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal('')),

    direccion: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal('')),

    domicilio: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal('')),

    id_obra_social: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .or(z.literal('')),

    nro_afiliado: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal('')),

    obras_sociales: z
      .array(
        z.object({
          id_obra_social: z.union([z.number(), z.string()]),
          nro_afiliado: z.string().optional().or(z.literal(''))
        })
      )
      .optional()
      .default([]),

    datos_completos: z
      .boolean()
      .optional()
  })
  .passthrough();

export const createPacienteSchema = pacienteSchema;
export const updatePacienteSchema = pacienteSchema;
export default pacienteSchema;
