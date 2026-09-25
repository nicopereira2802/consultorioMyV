import { Paciente } from "../models/Paciente.model.js";

export const validarTelefono = async (telefono) => {
  const telefonoDuplicado = await Paciente.findOne({ where: { telefono } });
  if (telefonoDuplicado) {
    return false;
  }
  return true;
};
