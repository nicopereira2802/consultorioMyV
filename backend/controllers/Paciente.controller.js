/** @format */

import { Paciente } from "../models/Paciente.model.js";
import { validarTelefono } from "../validations/Paciente.validation.js";

// Obtener todos los pacientes
export const getAllPacientes = async (req, res) => {
  try {
    const pacientes = await Paciente.findAll();

    res.status(200).json({
      status: "success",
      data: pacientes,
    });
  } catch (error) {
    console.error("Error al obtener los pacientes:", error);
    res.status(500).json({ error: "Error al obtener los pacientes" });
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

    const telefonoDuplicado = validarTelefono(telefono);

    if (!telefonoDuplicado) {
      return res.status(400).json({
        status: "error",
        message: "Telefono duplicado. El paciente ya existe",
      });
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
      const telefonoDuplicado = validarTelefono(telefono);

      if (!telefonoDuplicado) {
        return res.status(400).json({
          status: "error",
          message: "Telefono duplicado. El paciente ya existe",
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
