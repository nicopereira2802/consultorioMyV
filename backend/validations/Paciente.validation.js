import { Paciente } from "../models/Paciente.model.js";

// Función para verificar si el teléfono ya está registrado en la base de datos
export const verificarTelefonoExistente = async (telefono) => {
  const pacienteEncontrado = await Paciente.findOne({ where: { telefono } });
  return pacienteEncontrado ? true : false;
};