import { PacienteObraSocial } from "../models/PacienteObraSocial.model.js";

// Obtener todos los pacientes por obra social
export const getAllPacientesPorObraSocial = async (req, res) => {
  try {
    const pacientesPorObraSocial = await PacienteObraSocial.findAll();

    res.status(200).json(pacientesPorObraSocial);
  } catch (error) {
    console.error("Error al obtener los pacientes por obra social:", error);
    res.status(500).json({ error: "Error al obtener los pacientes por obra social" });
  }
};

// Obtener un paciente por obra social por su ID
export const getPacientePorObraSocialById = async (req, res) => {
  const { id } = req.params;
  try {
    const pacientePorObraSocial = await PacienteObraSocial.findByPk(id);
    if (pacientePorObraSocial) {
      res.status(200).json(pacientePorObraSocial);
    } else {
      res.status(404).json({ error: "Paciente por obra social no encontrado" });
    }
  } catch (error) {
    console.error("Error al obtener el paciente por obra social:", error);
    res.status(500).json({ error: "Error al obtener el paciente por obra social" });
  }
};

// Crear un nuevo paciente por obra social
export const createPacientePorObraSocial = async (req, res) => {
  const { pacienteId, obraSocialId } = req.body;
  try {
    const newPacientePorObraSocial = await PacienteObraSocial.create({ pacienteId, obraSocialId });
    res.status(201).json(newPacientePorObraSocial);
  } catch (error) {
    console.error("Error al crear el paciente por obra social:", error);
    res.status(500).json({ error: "Error al crear el paciente por obra social" });
  }
};

// Actualizar un paciente por obra social existente
export const updatePacientePorObraSocial = async (req, res) => {
  const { id } = req.params;
  const { pacienteId, obraSocialId } = req.body;

  try {
    const pacientePorObraSocial = await PacienteObraSocial.findByPk(id);
    if (pacientePorObraSocial) {
      pacientePorObraSocial.pacienteId = pacienteId;
      pacientePorObraSocial.obraSocialId = obraSocialId;
      await pacientePorObraSocial.save();
      res.status(200).json(pacientePorObraSocial);
    } else {
      res.status(404).json({ error: "Paciente por obra social no encontrado" });
    }
  } catch (error) {
    console.error("Error al actualizar el paciente por obra social:", error);
    res.status(500).json({ error: "Error al actualizar el paciente por obra social" });
  }
};

// Eliminar un paciente por obra social existente
export const deletePacientePorObraSocial = async (req, res) => {
  const { id } = req.params;
  try {
    const pacientePorObraSocial = await PacienteObraSocial.findByPk(id);
    if (pacientePorObraSocial) {
      await pacientePorObraSocial.destroy();
      res.status(200).json({ message: "Paciente por obra social eliminado correctamente" });
    } else {
      res.status(404).json({ error: "Paciente por obra social no encontrado" });
    }
  } catch (error) {
    console.error("Error al eliminar el paciente por obra social:", error);
    res.status(500).json({ error: "Error al eliminar el paciente por obra social" });
  }
};
