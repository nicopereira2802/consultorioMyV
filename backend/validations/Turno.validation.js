import { Op } from "sequelize";
import { Paciente } from "../models/Paciente.model.js";
import { Turno } from "../models/Turno.model.js";

export const validarCreacionTurno = async (datos) => {
  const { id_paciente, fecha_hora_inicio, duracion_minutos } = datos;

  if (!id_paciente || !fecha_hora_inicio || duracion_minutos === undefined || duracion_minutos === null) {
    return "Faltan campos obligatorios (paciente, fecha/hora de inicio, duración).";
  }

  // Validar duración lógica
  if (Number(duracion_minutos) <= 0) {
    return "La duración del turno debe ser mayor a 0 minutos.";
  }

  // Calcular la fecha de fin
  const inicio = new Date(fecha_hora_inicio);
  if (isNaN(inicio.getTime())) return "Formato de fecha de inicio inválido.";
  const fin = new Date(inicio.getTime() + duracion_minutos * 60000);

  try {
    // Validar existencia del Paciente
    const paciente = await Paciente.findByPk(id_paciente);
    if (!paciente) return "El paciente seleccionado no existe.";

    // Validar Disponibilidad (Solapamiento de Horarios)
    // Buscamos si existe un turno activo cuyo rango horario se cruce con el nuestro.
    // Un turno se cruza si: Su inicio es MENOR a nuestro fin, Y su fin es MAYOR a nuestro inicio.
    const turnoSuperpuesto = await Turno.findOne({
      where: {
        // Asumimos que id_estado 3 es Cancelado y 5 Inasistente. 
        // Solo nos preocupan los que ocupan lugar: Programado (1) o Reprogramado (2).
        id_estado: {
          [Op.in]: [1, 2] 
        },
        fecha_hora_inicio: { [Op.lt]: fin },
        fecha_hora_fin: { [Op.gt]: inicio }
      }
    });

    if (turnoSuperpuesto) {
      return "La fecha y horario seleccionados ya se encuentran ocupados por otro turno.";
    }

  } catch (error) {
    console.error("Error en validación:", error);
    throw new Error("Error interno al validar reglas de negocio.");
  }

  return null;
};