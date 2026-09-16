import { Paciente } from "../models/Paciente.model.js";

// Obtener todos los pacientes
export const getAllPacientes = async (req, res) => {
  try {
    const pacientes = await Paciente.findAll();

    res.status(200).json(pacientes);
  } catch (error) {
    console.error("Error al obtener los pacientes:", error);
    res.status(500).json({ error: "Error al obtener los pacientes" });
  }
};

// Obtener un paciente por su ID
export const getPacienteById = async (req, res) => {
  const { id } = req.params;
  try {
    const paciente = await Paciente.findByPk(id);
    if (paciente) {
      res.status(200).json(paciente);
    } else {
      res.status(404).json({ error: "Paciente no encontrado" });
    }
  } catch (error) {
    console.error("Error al obtener el paciente:", error);
    res.status(500).json({ error: "Error al obtener el paciente" });
  }
};

// Crear un nuevo paciente
export const createPaciente = async (req, res) => {
  const { nombre, apellido, fechaNacimiento, dni, telefono, email } = req.body;
  try {
    const newPaciente = await Paciente.create({ nombre, apellido, fechaNacimiento, dni, telefono, email });
    res.status(201).json(newPaciente);
  } catch (error) {
    console.error("Error al crear el paciente:", error);
    res.status(500).json({ error: "Error al crear el paciente" });
  }
};

// Actualizar un paciente existente
export const updatePaciente = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, fechaNacimiento, dni, telefono, domicilio } = req.body;

  try {
    const paciente = await Paciente.findByPk(id);
    if (paciente) {
      paciente.nombre = nombre;
      paciente.apellido = apellido;
      paciente.fechaNacimiento = fechaNacimiento;
      paciente.dni = dni;
      paciente.telefono = telefono;
      paciente.domicilio = domicilio;
      await paciente.save();
      res.status(200).json(paciente);
    } else {
      res.status(404).json({ error: "Paciente no encontrado" });
    }
  } catch (error) {
    console.error("Error al actualizar el paciente:", error);
    res.status(500).json({ error: "Error al actualizar el paciente" });
  }
};

// Eliminar un paciente existente
export const deletePaciente = async (req, res) => {
  const { id } = req.params;
  try {
    const paciente = await Paciente.findByPk(id);
    if (paciente) {
      await paciente.destroy();
      res.status(200).json({ message: "Paciente eliminado correctamente" });
    } else {
      res.status(404).json({ error: "Paciente no encontrado" });
    }
  } catch (error) {
    console.error("Error al eliminar el paciente:", error);
    res.status(500).json({ error: "Error al eliminar el paciente" });
  }
};
