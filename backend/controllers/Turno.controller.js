import sequelize from "../config/database.js";
import { Turno } from "../models/Turno.model.js";
import { HistorialEstadoTurno } from "../models/HistorialEstadoTurno.model.js";
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

// Crear un nuevo turno
export const createTurno = async (req, res) => {
  // Iniciamos una transacción para asegurar la integridad de las dos tablas
  const transaction = await sequelize.transaction();

  try {
    const { 
      id_paciente, 
      id_practica_planificada, 
      fecha_hora_inicio, 
      duracion_minutos, 
      notas_consulta 
    } = req.body;

    // 1. Validar reglas de negocio estrictas
    const errorValidacion = await validarCreacionTurno(req.body);
    if (errorValidacion) {
      await transaction.rollback();
      return res.status(400).json({ error: errorValidacion });
    }

    // 2. Calcular fecha de fin definitiva
    const inicio = new Date(fecha_hora_inicio);
    const fin = new Date(inicio.getTime() + duracion_minutos * 60000);

    // 3. Crear el Turno Principal
    const nuevoTurno = await Turno.create({
      id_paciente,
      id_practica_planificada: id_practica_planificada || null,
      id_estado: 1, // 1 = Programado
      fecha_hora_inicio: inicio,
      fecha_hora_fin: fin,
      precio_final: 0.00,
      notas_consulta: notas_consulta || null
    }, { transaction });

    // 4. Crear el registro en el Historial
    await HistorialEstadoTurno.create({
      id_turno: nuevoTurno.id_turno,
      id_estado: 1, // Nace en estado Programado
      fecha_hora_cambio: new Date(),
      observaciones: "Creación inicial del turno"
    }, { transaction });

    // 5. Confirmar los cambios en la base de datos
    await transaction.commit();

    res.status(201).json({
      message: "Turno programado exitosamente",
      turno: nuevoTurno
    });

  } catch (error) {
    // Si cualquier cosa falla, hacemos rollback (deshacemos los cambios)
    await transaction.rollback();
    console.error("Error al crear el turno:", error);
    res.status(500).json({ error: "Error interno del servidor al programar el turno." });
  }
};

// Actualizar un turno existente
export const updateTurno = async (req, res) => {
  const { id } = req.params;
  const { fecha, hora, pacienteId, profesionalId } = req.body;
  try {
    const turno = await Turno.findByPk(id);
    if (turno) {
      turno.fecha = fecha;
      turno.hora = hora;
      turno.pacienteId = pacienteId;
      turno.profesionalId = profesionalId;
      await turno.save();
      res.status(200).json(turno);
    } else {
      res.status(404).json({ error: "Turno no encontrado" });
    }
  } catch (error) {
    console.error("Error al actualizar el turno:", error);
    res.status(500).json({ error: "Error al actualizar el turno" });
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
