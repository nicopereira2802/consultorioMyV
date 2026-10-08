/** @format */

import { EstadoTurno, HistorialEstadoTurno } from "../models/index.model.js";

// ==========================================
// CLASE BASE ABSTRACTA
// ==========================================
export class EstadoTurnoBase {
  constructor(nombre) {
    this.nombre = nombre;
  }

  async aplicarTransicion(turno, nuevoNombreEstado, observacion, transaction) {
    const estadoDestino = await EstadoTurno.findOne({
      where: { estado: nuevoNombreEstado },
      transaction,
    });

    if (!estadoDestino) {
      throw new Error(`El estado "${nuevoNombreEstado}" no existe en la base de datos.`);
    }

    // Actualizar el estado del turno
    await turno.update(
      { id_estado: estadoDestino.id_estado },
      { transaction }
    );

    // Registrar la observación en el historial
    await HistorialEstadoTurno.create(
      {
        id_turno: turno.id_turno,
        id_estado: estadoDestino.id_estado,
        fecha_hora_cambio: new Date(),
        descripcion: observacion || `Transición a ${nuevoNombreEstado}`,
      },
      { transaction }
    );

    return estadoDestino;
  }

  // Por defecto, cualquier acción no permitida tira error automático:
  async atender(turno, datos, transaction) {
    throw new Error(`Operación inválida: No se puede atender un turno en estado "${this.nombre}".`);
  }

  async cancelar(turno, motivo, transaction) {
    throw new Error(`Operación inválida: No se puede cancelar un turno en estado "${this.nombre}".`);
  }

  async marcarInasistente(turno, observacion, transaction) {
    throw new Error(`Operación inválida: No se puede marcar inasistente un turno en estado "${this.nombre}".`);
  }

  async reprogramar(turno, fechas, observacion, transaction) {
    throw new Error(`Operación inválida: No se puede cambiar el horario de un turno en estado "${this.nombre}".`);
  }
}

// ==========================================
// ESTADO ACTIVO: PROGRAMADO
// ==========================================
export class ProgramadoState extends EstadoTurnoBase {
  constructor() {
    super("Programado");
  }

  // Si vino a la cita
  async atender(turno, { observacion, practicas_realizadas }, transaction) {
    await this.aplicarTransicion(turno, "Atendido", observacion, transaction);
  }

  // Si avisa antes que da de baja el turno
  async cancelar(turno, motivo, transaction) {
    await this.aplicarTransicion(turno, "Cancelado", motivo, transaction);
  }

  // Si pasó la hora y nunca se presentó
  async marcarInasistente(turno, observacion, transaction) {
    await this.aplicarTransicion(turno, "Inasistente", observacion, transaction);
  }

  // Si avisa con anticipación que necesita mover el horario
  async reprogramar(turno, { fecha_hora_inicio, fecha_hora_fin, observacion }, transaction) {
    await turno.update({ fecha_hora_inicio, fecha_hora_fin }, { transaction });
    await this.aplicarTransicion(
      turno,
      "Programado",
      observacion || "Cambio de fecha/hora del turno",
      transaction
    );
  }
}

// ==========================================
// ESTADOS TERMINALES 
// ==========================================

export class AtendidoState extends EstadoTurnoBase {
  constructor() {
    super("Atendido");
  }
}

export class CanceladoState extends EstadoTurnoBase {
  constructor() {
    super("Cancelado");
  }
}

export class InasistenteState extends EstadoTurnoBase {
  constructor() {
    super("Inasistente");
  }
}

// ==========================================
// FACTORY
// ==========================================
export const obtenerEstadoTurno = async (id_estado, transaction = null) => {
  const estadoRecord = await EstadoTurno.findByPk(id_estado, { transaction });
  if (!estadoRecord) {
    throw new Error("Estado de turno no encontrado en la base de datos.");
  }

  switch (estadoRecord.estado) {
    case "Programado":
      return new ProgramadoState();
    case "Atendido":
      return new AtendidoState();
    case "Cancelado":
      return new CanceladoState();
    case "Inasistente":
      return new InasistenteState();
    default:
      throw new Error(`Estado desconocido: ${estadoRecord.estado}`);
  }
};
