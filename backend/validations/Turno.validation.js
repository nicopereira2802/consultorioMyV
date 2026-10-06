/** @format */

import { Op } from "sequelize";
import { Turno, EstadoTurno } from "../models/index.model.js";

export const validarEstadoProgramado = async () => {
  const estadoProgramado = await EstadoTurno.findOne({
    where: { estado: "Programado" },
  });

  if (!estadoProgramado) {
    const nuevoEstado = await EstadoTurno.create({
      estado: "Programado",
    });

    return nuevoEstado;
  }

  return estadoProgramado;
};

export const validarSolapaminetoHorarios = async (
  fechaInicio,
  fechaFin,
  turnoIdExcluir = null,
) => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  const estadosInactivos = await EstadoTurno.findAll({
    where: {
      estado: { [Op.in]: ["Cancelado", "Inasistente"] },
    },
  });

  const idsInactivos = estadosInactivos.map((e) => e.id_estado);

  const turnoExistente = await Turno.findOne({
    where: {
      id_estado: { [Op.notIn]: idsInactivos },
      fecha_hora_inicio: { [Op.lt]: fin },
      fecha_hora_fin: { [Op.gt]: inicio },
      ...(turnoIdExcluir && { id_turno: { [Op.ne]: turnoIdExcluir } }),
    },
  });

  return !!turnoExistente;
};