import sequelize from "../config/database.js";
import { Turno } from "../models/Turno.model.js";
import { HistorialEstadoTurno } from "../models/HistorialEstadoTurno.model.js";
import { PracticaTurno } from "../models/PracticaTurno.model.js";
import { EstadoTurno } from "../models/EstadoTurno.model.js";
import { validarCreacionTurno } from "../validations/Turno.validation.js";

// Obtener todos los turnos
export const getAllTurnos = async (req, res) => {
  try {
    const turnos = await Turno.findAll();
    res.status(200).json(turnos);
  } catch (error) {
    console.error("Error al obtener los turnos:", error);
    res.status(500).json({ error: "Error al obtener los turnos" });
  }
};

// Obtener un turno por su ID
export const getTurnoById = async (req, res) => {
  const { id } = req.params;
  try {
    const turno = await Turno.findByPk(id);
    if (turno) {
      res.status(200).json(turno);
    } else {
      res.status(404).json({ error: "Turno no encontrado" });
    }
  } catch (error) {
    console.error("Error al obtener el turno:", error);
    res.status(500).json({ error: "Error al obtener el turno" });
  }
};

// Crear un nuevo turno (T-123)
export const createTurno = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // Desestructuramos el req.body apenas entramos
    const { 
      id_paciente, 
      id_practica_planificada, 
      fecha_hora_inicio, 
      duracion_minutos, 
      notas_consulta 
    } = req.body;

    // Le pasamos a la validación CADA ATRIBUTO por separado
    const errorValidacion = await validarCreacionTurno(
      id_paciente, 
      fecha_hora_inicio, 
      duracion_minutos
    );
    
    if (errorValidacion) {
      await transaction.rollback();
      return res.status(400).json({ error: errorValidacion });
    }

    // Seguimos con la creación normal...
    const inicio = new Date(fecha_hora_inicio);
    const fin = new Date(inicio.getTime() + duracion_minutos * 60000);

    const nuevoTurno = await Turno.create({
      id_paciente,
      id_practica_planificada: id_practica_planificada || null,
      id_estado: 1, 
      fecha_hora_inicio: inicio,
      fecha_hora_fin: fin,
      precio_final: 0.00,
      notas_consulta: notas_consulta || null
    }, { transaction });

    await HistorialEstadoTurno.create({
      id_turno: nuevoTurno.id_turno,
      id_estado: 1, 
      fecha_hora_cambio: new Date(),
      observaciones: "Creación inicial del turno"
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      message: "Turno programado exitosamente",
      turno: nuevoTurno
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error al crear el turno:", error);
    res.status(500).json({ error: "Error interno del servidor al programar el turno." });
  }
};

// Cambiar estado del turno
export const cambiarEstadoTurno = async (req, res) => {
  const { id } = req.params;
  const { id_estado, observaciones } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const turno = await Turno.findByPk(id);
    if (!turno) {
      await transaction.rollback();
      return res.status(404).json({ error: "Turno no encontrado" });
    }

    turno.id_estado = id_estado;
    await turno.save({ transaction });

    await HistorialEstadoTurno.create({
      id_turno: turno.id_turno,
      id_estado: id_estado,
      observaciones: observaciones || null
    }, { transaction });

    await transaction.commit();
    res.status(200).json({ message: "Estado actualizado correctamente", turno });

  } catch (error) {
    await transaction.rollback();
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: "Error interno al actualizar el estado" });
  }
};

// Eliminar un turno existente
export const deleteTurno = async (req, res) => {
  const { id } = req.params;
  try {
    const turno = await Turno.findByPk(id);
    if (turno) {
      await turno.destroy();
      res.status(200).json({ message: "Turno eliminado correctamente" });
    } else {
      res.status(404).json({ error: "Turno no encontrado" });
    }
  } catch (error) {
    console.error("Error al eliminar el turno:", error);
    res.status(500).json({ error: "Error al eliminar el turno" });
  }
};

// Obtener el historial del turno
export const getHistorialTurno = async (req, res) => {
  const { id } = req.params;

  try {
    const historial = await HistorialEstadoTurno.findAll({
      where: { id_turno: id },
      include: [{ model: EstadoTurno, attributes: ['estado'] }],
      order: [['fecha_hora_cambio', 'DESC']]
    });

    if (!historial || historial.length === 0) {
      return res.status(404).json({ error: "No se encontró historial para este turno." });
    }

    res.status(200).json(historial);
  } catch (error) {
    console.error("Error al obtener el historial:", error);
    res.status(500).json({ error: "Error interno al obtener el historial." });
  }
};

// Finalizar atención del turno y registrar prácticas (T-1314)
export const atenderTurno = async (req, res) => {
  const { id } = req.params;
  const { notas_consulta, practicas_realizadas } = req.body; 

  const transaction = await sequelize.transaction();

  try {
    const turno = await Turno.findByPk(id);
    if (!turno) {
      await transaction.rollback();
      return res.status(404).json({ error: "Turno no encontrado" });
    }

    if (turno.id_estado === 4) {
      await transaction.rollback();
      return res.status(400).json({ error: "Este turno ya se encuentra registrado como atendido." });
    }

    // Actualizar el Turno
    turno.id_estado = 4; // Atendido
    if (notas_consulta) turno.notas_consulta = notas_consulta;
    await turno.save({ transaction });

    // guardar historial
    await HistorialEstadoTurno.create({
      id_turno: turno.id_turno,
      id_estado: 4,
      observaciones: "Atención clínica finalizada",
      fecha_hora_cambio: new Date()
    }, { transaction });

    // Guardar las prácticas en la tabla intermedia
    if (practicas_realizadas && Array.isArray(practicas_realizadas) && practicas_realizadas.length > 0) {
      for (const id_practica of practicas_realizadas) {
        await PracticaTurno.create({
          id_turno: turno.id_turno,
          id_practica: id_practica
        }, { transaction });
      }
    }

    await transaction.commit();

    res.status(200).json({ message: "Atención registrada y turno finalizado exitosamente", turno });

  } catch (error) {
    await transaction.rollback();
    console.error("Error al finalizar la atención:", error);
    res.status(500).json({ error: "Error interno al registrar la atención" });
  }
};