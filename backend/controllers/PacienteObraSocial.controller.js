/** @format */

import {
  PacienteObraSocial,
  Paciente,
  ObraSocial,
} from "../models/index.model.js";

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
    res
      .status(500)
      .json({ error: "Error al obtener los pacientes por obra social" });
  }
};

// Obtener un paciente por obra social por su ID
export const getObrasSocialesByPacienteID = async (req, res) => {
  try {
    const pacienteId = req.paciente.id_paciente;
    const obrasSocialesPaciente = await PacienteObraSocial.findAll({
      where: { id_paciente: pacienteId },
    });

    res.status(200).json({
      status: "success",
      data: obrasSocialesPaciente,
    });
  } catch (error) {
    console.error("Error al obtener la obra social del paciente:", error);
    res
      .status(500)
      .json({ error: "Error al obtener la obra social del paciente" });
  }
};

// Crear un nuevo paciente por obra social
export const createPacientePorObraSocial = async (req, res) => {
  try {
    const { nro_afiliado } = req.body;
    const id_paciente = req.paciente.id_paciente;
    const id_obra_social = req.obraSocial.id_obra_social;

    const newPacientePorObraSocial = await PacienteObraSocial.create({
      id_paciente,
      id_obra_social,
      nro_afiliado,
    });

    res.status(201).json({
      status: "success",
      data: newPacientePorObraSocial,
    });
  } catch (error) {
    console.error("Error al crear la obra social del paciente:", error);
    res
      .status(500)
      .json({ error: "Error al crear la obra social del paciente" });
  }
};

// Actualizar un paciente por obra social existente
export const updatePacientePorObraSocial = async (req, res) => {
  try {
    const { id_paciente, id_obra_social, nro_afiliado } = req.body;

    const pacientePorObraSocial = req.pacienteObraSocial;

    if (id_paciente) {
      const paciente = await Paciente.findByPk(id_paciente);

      if (!paciente) {
        return res.status(400).json({
          status: "error",
          message: "El paciente seleccionado no existen.",
        });
      }
    }

    if (id_obra_social) {
      const obraSocial = await ObraSocial.findByPk(id_obra_social);
      if (!obraSocial) {
        return res.status(400).json({
          status: "error",
          message: "La obra social seleccionada no existen.",
        });
      }
    }

    await pacientePorObraSocial.update({
      id_paciente: id_paciente || pacientePorObraSocial.id_paciente,
      id_obra_social: id_obra_social || pacientePorObraSocial.id_obra_social,
      nro_afiliado: nro_afiliado || pacientePorObraSocial.nro_afiliado,
    });

    res.status(200).json({
      status: "success",
      data: pacientePorObraSocial,
    });
  } catch (error) {
    console.error("Error al actualizar la obra social del paciente:", error);
    res
      .status(500)
      .json({ error: "Error al actualizar la obra social del paciente" });
  }
};

// Eliminar un paciente por obra social existente
export const deletePacientePorObraSocial = async (req, res) => {
  try {
    const pacientePorObraSocial = req.pacienteObraSocial;

    await pacientePorObraSocial.destroy();

    res
      .status(200)
      .json({ message: "Paciente por obra social eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar la obra social del paciente:", error);
    res
      .status(500)
      .json({ error: "Error al eliminar la obra social del paciente" });
  }
};
