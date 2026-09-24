import { Turno } from "../models/Turno.model.js";
import { Op } from "sequelize";

export const validarCreacionTurno = async (id_paciente, fecha_hora_inicio, duracion_minutos) => {
  
  //Validar que vengan los campos obligatorios
  if (!id_paciente || !fecha_hora_inicio || !duracion_minutos) {
    return "Faltan datos obligatorios (paciente, fecha de inicio o duración).";
  }

  // Calcular inicio y fin para la base de datos
  const inicio = new Date(fecha_hora_inicio);
  const fin = new Date(inicio.getTime() + duracion_minutos * 60000);

  // Validar solapamiento 
  const turnoExistente = await Turno.findOne({
    where: {
      id_estado: { [Op.notIn]: [3, 5] },
      [Op.or]: [
        {
          fecha_hora_inicio: { [Op.lt]: fin },
          fecha_hora_fin: { [Op.gt]: inicio }
        }
      ]
    }
  });

  if (turnoExistente) {
    return "El horario seleccionado se solapa con otro turno existente.";
  }

  return null;
};