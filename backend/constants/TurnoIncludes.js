import {
  HistorialEstadoTurno,
  EstadoTurno,
  Paciente,
  Practica,
  ObraSocial,
} from "../models/index.model.js";

// Include de Paciente con sus Obras Sociales
export const includePacienteConObrasSociales = {
  model: Paciente,
  required: false,
  include: [
    {
      model: ObraSocial,
      through: {
        attributes: ["nro_afiliado"],
      },
      required: false,
    },
  ],
};

// Include de Prácticas odontológicas asociadas al turno
export const includePracticasTurno = {
  model: Practica,
  through: { attributes: ["id_obra_social"] },
  required: false,
};

// Include de Estado del Turno
export const includeEstadoTurno = {
  model: EstadoTurno,
  required: false,
};

// Include de Historial de Estados del Turno (bitácora de auditoría)
export const includeHistorialEstadoTurno = {
  model: HistorialEstadoTurno,
  as: "historial",
  include: [
    {
      model: EstadoTurno,
      attributes: ["id_estado", "estado"],
    },
  ],
  required: false,
};

// Includes estándar reutilizables para todas las consultas de turno
export const defaultTurnoIncludes = [
  includePacienteConObrasSociales,
  includeEstadoTurno,
  includePracticasTurno,
  includeHistorialEstadoTurno,
];