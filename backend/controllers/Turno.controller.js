import { Turno } from "../models/Turno.model.js";

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
  const { fecha, hora, pacienteId, profesionalId } = req.body;
  try {
    const newTurno = await Turno.create({ fecha, hora, pacienteId, profesionalId });
    res.status(201).json(newTurno);
  } catch (error) {
    console.error("Error al crear el turno:", error);
    res.status(500).json({ error: "Error al crear el turno" });
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
