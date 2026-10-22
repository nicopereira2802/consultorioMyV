import { HistorialEstadoTurno, EstadoTurno } from "../models/index.model.js";

// --- CLASE BASE (Define el comportamiento por defecto) ---
class TurnoState {
  async atender(turno, datos, transaction) {
    throw new Error("Transición no permitida: No se puede atender un turno desde su estado actual.");
  }
  async cancelar(turno, motivo, transaction) {
    throw new Error("Transición no permitida: No se puede cancelar un turno desde su estado actual.");
  }
  async marcarInasistente(turno, motivo, transaction) {
    throw new Error("Transición no permitida: No se puede marcar como inasistente desde su estado actual.");
  }

  // Método auxiliar para registrar la transición (Recuperamos tu findOrCreate original)
  async registrarTransicion(turno, nombreEstado, descripcion, transaction) {
    
    // 1. Buscamos el estado por nombre, y si no existe en la BD, lo crea automáticamente
    const [estadoDestino] = await EstadoTurno.findOrCreate({ 
      where: { estado: nombreEstado }, 
      transaction 
    });

    // 2. Actualizamos el turno con el ID exacto (ya sea el existente o el recién creado)
    await turno.update({ id_estado: estadoDestino.id_estado }, { transaction });
    
    // 3. Registramos en el historial
    await HistorialEstadoTurno.create(
      {
        id_turno: turno.id_turno,
        id_estado: estadoDestino.id_estado,
        fecha_hora_cambio: new Date(),
        descripcion: descripcion || `Turno marcado como ${nombreEstado}`,
      },
      { transaction }
    );
  }
}

// --- ESTADOS CONCRETOS ---

class EstadoProgramado extends TurnoState {
  async atender(turno, datos, transaction) {
    await this.registrarTransicion(turno, "Atendido", datos.observacion, transaction);
  }

  async cancelar(turno, motivo, transaction) {
    await this.registrarTransicion(turno, "Cancelado", motivo, transaction);
  }

  async marcarInasistente(turno, motivo, transaction) {
    await this.registrarTransicion(turno, "Inasistente", motivo, transaction);
  }
}

class EstadoAtendido extends TurnoState {
  // Terminal
}

class EstadoCancelado extends TurnoState {
  // Terminal
}

class EstadoInasistente extends TurnoState {
  // Terminal
}

// --- FACTORY: ORQUESTADOR DEL ESTADO ---
export const obtenerEstadoTurno = async (id_estado, transaction = null) => {
  // Buscamos dinámicamente cómo se llama este estado en la BD
  const estadoRecord = await EstadoTurno.findByPk(id_estado, { transaction });
  
  if (!estadoRecord) {
    throw new Error(`Estado de turno (ID: ${id_estado}) no encontrado en la base de datos.`);
  }

  switch (estadoRecord.estado) {
    case "Programado":
      return new EstadoProgramado();
    case "Atendido":
      return new EstadoAtendido();
    case "Cancelado":
      return new EstadoCancelado();
    case "Inasistente":
      return new EstadoInasistente();
    default:
      throw new Error(`Estado desconocido o no implementado: ${estadoRecord.estado}`);
  }
};