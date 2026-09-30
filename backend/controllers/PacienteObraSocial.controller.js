/** @format */

import {
  PacienteObraSocial,
  Paciente,
  ObraSocial,
} from "../models/index.model.js";
import { validarEntidadUpdate } from "../validations/validarEntidadUpdate.validation.js";

// Obtener todos los pacientes por obra social
import { Op } from "sequelize";
import { PacienteObraSocial } from "../models/PacienteObraSocial.model.js";
import { Paciente, ObraSocial } from "../models/index.model.js";

// Obtener todos los pacientes por obra social con paginación y orden dinámico
export const getAllPacientesPorObraSocial = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || "";
    const sortField = req.query.sortField || "id_paciente_obra_social";
    const sortOrder = req.query.sortOrder || "ASC";
    const offset = (page - 1) * limit;

    const where = {};

    // Filtros ?id_paciente=3 o ?id_obra_social=1
    if (req.query.id_paciente) {
      where.id_paciente = req.query.id_paciente;
    }
    if (req.query.id_obra_social) {
      where.id_obra_social = req.query.id_obra_social;
    }
    if (search.trim() !== "") {
      where[Op.or] = [
        { numero_afiliado: { [Op.like]: `%${search.trim()}%` } },
      ];
    }
    const { count, rows: pacientesPorObraSocial } =
      await PacienteObraSocial.findAndCountAll({
        where,
        include: [
          {
            model: Paciente,
            attributes: ["id_paciente", "nombre", "apellido", "dni"],
          },
          {
            model: ObraSocial,
            attributes: ["id_obra_social", "nombre"],
          },
        ],
        limit,
        offset,
        order: [[sortField, sortOrder]],
        distinct: true,
      });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      data: pacientesPorObraSocial,
      meta: {
        total: count,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error al obtener los pacientes por obra social:", error);
    res.status(500).json({
      status: "error",
      message: "Error al obtener los pacientes por obra social",
      error: error.message,
    });
  }
};

// Obtener un paciente por obra social por su ID
export const getPacientePorObraSocialById = async (req, res) => {
  try {
    const pacientePorObraSocial = req.pacienteObraSocial;

    res.status(200).json({
      status: "success",
      data: pacientePorObraSocial,
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
    const { id_paciente, id_obra_social, nro_afiliado } = req.body;

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

    if (id_paciente || id_obra_social) {
      const paciente = validarEntidadUpdate(Paciente, id_paciente);
      const obraSocial = validarEntidadUpdate(ObraSocial, id_obra_social);

      if (!paciente || !obraSocial) {
        return res.status(400).json({
          status: "error",
          message: "El paciente o la obra social seleccionada no existen."
        })
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
