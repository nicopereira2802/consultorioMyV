/** @format */

import { Op } from "sequelize";
import { Turno, EstadoTurno } from "../models/index.model.js";

export const validarEstadoProgramado = async () => {
  const [estadoProgramado, created] = await EstadoTurno.findOrCreate({
    where: { estado: "Programado" },
  });

  return estadoProgramado;
};

export const validarEstados = async (id_estado, estadoInicio, estadoFinal) => {
  const estadoActual = await EstadoTurno.findByPk(id_estado);

  if (!estadoActual) {
    return false;
  }

  const estadosPermitidos = Array.isArray(estadoInicio)
    ? estadoInicio
    : [estadoInicio];

  // Verificar si el estado actual está dentro de los permitidos
  if (!estadosPermitidos.includes(estadoActual.estado)) {
    return false;
  }

  // Buscar o retornar el estado destino
  const [estadoDestino, created] = await EstadoTurno.findOrCreate({
    where: { estado: estadoFinal },
  });

  return estadoDestino;
};

export const validarSolapaminetoHorarios = async (
  fechaInicio,
  fechaFin,
  turnoIdExcluir = null,
) => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  const [estadoCancelado, created] = await EstadoTurno.findOrCreate({
    where: { estado: "Cancelado" },
  });

  // Obtenemos los turnos en conflicto
  const turnoExistente = await Turno.findOne({
    where: {
      id_estado: { [Op.ne]: estadoCancelado.id_estado },
      // Condición de solapamiento
      fecha_hora_inicio: { [Op.lt]: fin },
      fecha_hora_fin: { [Op.gt]: inicio },
      // Si estamos editando un turno existente, lo excluimos de la búsqueda
      ...(turnoIdExcluir && { id_turno: { [Op.ne]: turnoIdExcluir } }),
    },
  });

  return !!turnoExistente;
};
