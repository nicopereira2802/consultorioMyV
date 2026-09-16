import { PracticaTurno } from "../models/PracticaTurno.model.js";

// Obtener todas las prácticas de turno
export const getAllPracticaTurno = async (req, res) => {
  try {
    const practicaTurnos = await PracticaTurno.findAll();
    res.status(200).json(practicaTurnos);
  } catch (error) {
    console.error("Error al obtener las prácticas de turno:", error);
    res.status(500).json({ error: "Error al obtener las prácticas de turno" });
  }
};

// Obtener una práctica de turno por su ID
export const getPracticaTurnoById = async (req, res) => {
  const { id } = req.params;
  try {
    const practicaTurno = await PracticaTurno.findByPk(id);
    if (practicaTurno) {
      res.status(200).json(practicaTurno);
    } else {
      res.status(404).json({ error: "Práctica de turno no encontrada" });
    }
  } catch (error) {
    console.error("Error al obtener la práctica de turno:", error);
    res.status(500).json({ error: "Error al obtener la práctica de turno" });
  }
};

// Crear una nueva práctica de turno
export const createPracticaTurno = async (req, res) => {
  const { turnoId, practicaId } = req.body;
  try {
    const newPracticaTurno = await PracticaTurno.create({ turnoId, practicaId });
    res.status(201).json(newPracticaTurno);
  } catch (error) {
    console.error("Error al crear la práctica de turno:", error);
    res.status(500).json({ error: "Error al crear la práctica de turno" });
  }
};

// Actualizar una práctica de turno existente
export const updatePracticaTurno = async (req, res) => {
  const { id } = req.params;
  const { turnoId, practicaId } = req.body;
  try {
    const practicaTurno = await PracticaTurno.findByPk(id);
    if (practicaTurno) {
      practicaTurno.turnoId = turnoId;
      practicaTurno.practicaId = practicaId;
      await practicaTurno.save();
      res.status(200).json(practicaTurno);
    } else {
      res.status(404).json({ error: "Práctica de turno no encontrada" });
    }
  } catch (error) {
    console.error("Error al actualizar la práctica de turno:", error);
    res.status(500).json({ error: "Error al actualizar la práctica de turno" });
  }
};

// Eliminar una práctica de turno existente
export const deletePracticaTurno = async (req, res) => {
  const { id } = req.params;
  try {
    const practicaTurno = await PracticaTurno.findByPk(id);
    if (practicaTurno) {
      await practicaTurno.destroy();
      res.status(200).json({ message: "Práctica de turno eliminada correctamente" });
    } else {
      res.status(404).json({ error: "Práctica de turno no encontrada" });
    }
  } catch (error) {
    console.error("Error al eliminar la práctica de turno:", error);
    res.status(500).json({ error: "Error al eliminar la práctica de turno" });
  }
};
