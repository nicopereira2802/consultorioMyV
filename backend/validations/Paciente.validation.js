import { Paciente } from "../models/Paciente.model.js";

export const validarCreacionPaciente = async (datos) => {
  const { nombre, apellido, fechaNacimiento, dni, telefono } = datos;

  // campos obligatorios
  if (!nombre || !apellido || !fechaNacimiento || !dni || !telefono) {
    return "Faltan completar campos obligatorios";
  }

  // Validar si el Telefono ya existe en  BD
  const pacienteEncontrado = await Paciente.findOne({ where: { telefono } });
  if (pacienteEncontrado) {
    return "El número de teléfono ya está registrado";
  }

  return null;
};