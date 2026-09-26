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
  const estadoDestino = await EstadoTurno.findOne({
    where: { estado: estadoFinal },
  });

  if (!estadoDestino) {
    // Si la tabla catálogo no tiene el estado creado, lo crea (opcional)
    return await EstadoTurno.create({ estado: estadoFinal });
  }

  return estadoDestino;
};

export const validarSolapaminetoHorarios = async (fechaInicio, fechaFin, turnoIdExcluir = null) => {

  // Obtenemos los turnos en conflicto
  const turnoExistente = await Turno.findOne({
    where: {
      // Condición de solapamiento
      fecha_hora_inicio: { [Op.lt]: fechaFin },
      fecha_hora_fin: { [Op.gt]: fechaInicio },
      // Ignorar turnos cancelados (asumiendo que id_estado 3 es 'Cancelado')
      id_estado: { [Op.ne]: 3 },
      // Si estamos editando un turno existente, lo excluimos de la búsqueda
      ...(turnoIdExcluir && { id_turno: { [Op.ne]: turnoIdExcluir } }),
    },
  });

  return !!turnoExistente;
};
