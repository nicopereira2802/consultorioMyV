import { PacienteObraSocial } from "../models/PacienteObraSocial.model.js";

// Obtener todos los pacientes por obra social
export const getAllPacientesPorObraSocial = async (req, res) => {
  try {
    const pacientesPorObraSocial = await PacienteObraSocial.findAll();

    res.status(200).json({
      status: "success",
      data: pacientesPorObraSocial,
    });
  } catch (error) {
    console.error("Error al obtener los pacientes por obra social:", error);
    res.status(500).json({ error: "Error al obtener los pacientes por obra social" });
  }
};

// Obtener un paciente por obra social por su ID
export const getPacientePorObraSocialById = async (req, res) => {
  try {
    const { id } = req.params;

    const pacientePorObraSocial = await PacienteObraSocial.findByPk(id);

    if (!pacientePorObraSocial) {
      return res.status(400).json({
        status: "error",
        message: "Obra social del paciente no encontrada",
      });
    }

    res.status(200).json({
      status: "success",
      data: pacientePorObraSocial,
    });
  } catch (error) {
    console.error("Error al obtener la obra social del paciente:", error);
    res.status(500).json({ error: "Error al obtener la obra social del paciente" });
  }
};

// Crear un nuevo paciente por obra social
export const createPacientePorObraSocial = async (req, res) => {
  try {
    const { paciente_id, obraSocial_id, nro_afiliado } = req.body;

    const newPacientePorObraSocial = await PacienteObraSocial.create({
      paciente_id,
      obraSocial_id,
      nro_afiliado,
    });

    res.status(201).json({
      status: "success",
      data: newPacientePorObraSocial,
    });
  } catch (error) {
    console.error("Error al crear la obra social del paciente:", error);
    res.status(500).json({ error: "Error al crear la obra social del paciente" });
  }
};

// Actualizar un paciente por obra social existente
export const updatePacientePorObraSocial = async (req, res) => {
  try {
    const { id } = req.params;
    const { paciente_id, obraSocial_id, nro_afiliado } = req.body;

    const pacientePorObraSocial = await PacienteObraSocial.findByPk(id);

    if (!pacientePorObraSocial) {
      return res.status(400).json({
        status: "error",
        message: "Obra social del paciente no encontrada",
      });
    }

    await pacientePorObraSocial.update({
      paciente_id: paciente_id || pacientePorObraSocial.paciente_id,
      obraSocial_id: obraSocial_id || pacientePorObraSocial.obraSocial_id,
      nro_afiliado: nro_afiliado || pacientePorObraSocial.nro_afiliado,
    });

    res.status(200).json({
      status: "success",
      data: pacientePorObraSocial,
    });
  } catch (error) {
    console.error("Error al actualizar la obra social del paciente:", error);
    res.status(500).json({ error: "Error al actualizar la obra social del paciente" });
  }
};

// Eliminar un paciente por obra social existente
export const deletePacientePorObraSocial = async (req, res) => {
  try {
    const { id } = req.params;

    const pacientePorObraSocial = await PacienteObraSocial.findByPk(id);

    if (!pacientePorObraSocial) {
      return res.status(400).json({
        status: "error",
        message: "Obra social del paciente no encontrada",
      });
    }

    await pacientePorObraSocial.destroy();

    res.status(200).json({ message: "Paciente por obra social eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar la obra social del paciente:", error);
    res.status(500).json({ error: "Error al eliminar la obra social del paciente" });
  }
};
