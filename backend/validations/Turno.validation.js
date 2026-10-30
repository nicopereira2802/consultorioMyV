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
  // Aseguramos que estadoInicio sea un array
  const estadosPermitidos = Array.isArray(estadoInicio) ? estadoInicio : [estadoInicio];

  // Verificar si el ID del estado actual está dentro de los permitidos
  if (!estadosPermitidos.includes(id_estado)) {
    return false;
  }

  // Si es válido, retornamos directamente el ID del estado destino
  return estadoFinal;
};

export const validarSolapaminetoHorarios = async (fechaInicio, fechaFin, turnoIdExcluir = null) => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  const [estadoProgramado, created] = await EstadoTurno.findOrCreate({
    where: { estado: "Programado" },
  });

  // Obtenemos los turnos en conflicto
  const turnoExistente = await Turno.findOne({
    where: {
      id_estado: { [Op.eq]: estadoProgramado.id_estado },
      activo: true,
      // Condición de solapamiento
      fecha_hora_inicio: { [Op.lt]: fin },
      fecha_hora_fin: { [Op.gt]: inicio },
      // Si estamos editando un turno existente, lo excluimos de la búsqueda
      ...(turnoIdExcluir && { id_turno: { [Op.ne]: turnoIdExcluir } }),
    },
  });

  return !!turnoExistente;
};

export const validarHorarioAtencion = (inicioInput, finInput) => {
  const extraerHoraMinutos = (val) => {
    if (!val) return null;
    if (typeof val === "string") {
      const match = val.match(/(?:T|\s)(\d{2}):(\d{2})/);
      if (match && !val.includes("Z")) {
        return Number(match[1]) + Number(match[2]) / 60;
      }
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    const partes = new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(d);
    let h = Number(partes.find((p) => p.type === "hour")?.value || 0);
    if (h === 24) h = 0;
    const m = Number(partes.find((p) => p.type === "minute")?.value || 0);
    return h + m / 60;
  };

  const horaInicio = extraerHoraMinutos(inicioInput);
  const horaFin = extraerHoraMinutos(finInput);

  if (horaInicio === null || horaFin === null) return true;

  // Horario de atención exclusivo: 09:00 a 20:00 hs
  if (horaInicio < 9 || horaFin > 20 || horaInicio >= horaFin) {
    return false;
  }
  return true;
};
