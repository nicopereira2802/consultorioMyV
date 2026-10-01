/** @format */

import { Paciente } from "../models/Paciente.model.js";
import {
  validarTelefono,
  validarDni,
} from "../validations/Paciente.validation.js";
import { Op, Sequelize } from "sequelize";

// Obtener todos los pacientes
export const getAllPacientes = async (req, res) => {
  try {
    // paginacion
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const sortField = req.query.sortField || "apellido";
    const sortOrder = req.query.sortOrder || "ASC";
    const where = {
      activo: true,
    };

    // Busqueda por nombre apellido dni telefono
    if (search.trim() !== "") {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { apellido: { [Op.like]: `%${search}%` } },
        { dni: { [Op.like]: `%${search}%` } },
        { telefono: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: pacientes } = await Paciente.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, sortOrder]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      data: pacientes,
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
    console.error("Error al obtener los pacientes:", error);
    res.status(500).json({
      status: "error",
      message: "Error al obtener los pacientes",
      error: error.message,
    });
  }
};

// Obtener un paciente por su ID
export const getPacienteById = async (req, res) => {
  try {
    const paciente = req.paciente;

    res.status(200).json({
      status: "success",
      data: paciente,
    });
  } catch (error) {
    console.error("Error al obtener el paciente:", error);
    res.status(500).json({ error: "Error al obtener el paciente" });
  }
};

// Crear un nuevo paciente
export const createPaciente = async (req, res) => {
  try {
    const { nombre, apellido, fecha_nacimiento, dni, telefono, domicilio } =
      req.body;

    const telefonoDuplicado = await validarTelefono(telefono);

    if (!telefonoDuplicado) {
      return res.status(400).json({
        status: "error",
        message: "El telefono esta duplicado. El paciente ya existe",
      });
    }

    if (dni) {
      const dniDuplicado = await validarDni(dni);
      if (!dniDuplicado) {
        return res.status(400).json({
          status: "error",
          message: "El dni esta duplicado. El paciente ya existe",
        });
      }
    }

    const newPaciente = await Paciente.create({
      nombre,
      apellido,
      fecha_nacimiento,
      dni,
      telefono,
      domicilio,
    });

    res.status(201).json({
      status: "success",
      data: newPaciente,
    });
  } catch (error) {
    console.error("Error al crear el paciente:", error);
    res.status(500).json({ error: "Error al crear el paciente" });
  }
};

// Actualizar un paciente existente
export const updatePaciente = async (req, res) => {
  try {
    const { nombre, apellido, fecha_nacimiento, dni, telefono, domicilio } =
      req.body;

    const paciente = req.paciente;

    if (telefono) {
      const telefonoDuplicado = await validarTelefono(telefono, paciente.id_paciente);

      if (!telefonoDuplicado) {
        return res.status(400).json({
          status: "error",
          message: "Telefono duplicado. El paciente ya existe",
        });
      }
    }

    if (dni) {
      const dniDuplicado = await validarDni(dni, paciente.id_paciente);
      if (!dniDuplicado) {
        return res.status(400).json({
          status: "error",
          message: "El dni esta duplicado. El paciente ya existe",
        });
      }
    }

    await paciente.update({
      nombre: nombre || paciente.nombre,
      apellido: apellido || paciente.apellido,
      fecha_nacimiento: fecha_nacimiento || paciente.fecha_nacimiento,
      dni: dni || paciente.dni,
      telefono: telefono || paciente.telefono,
      domicilio: domicilio || paciente.domicilio,
    });

    res.status(200).json({
      status: "success",
      data: paciente,
    });
  } catch (error) {
    console.error("Error al actualizar el paciente:", error);
    res.status(500).json({ error: "Error al actualizar el paciente" });
  }
};

// Eliminar un paciente existente
export const deletePaciente = async (req, res) => {
  try {
    const paciente = req.paciente;

    await paciente.update({
      activo: false,
    });

    res.status(200).json({ message: "Paciente eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el paciente:", error);
    res.status(500).json({ error: "Error al eliminar el paciente" });
  }
};
