/** @format */

import { Op } from "sequelize";
import { Paciente } from "../models/Paciente.model.js";

export const validarTelefono = async (telefono, pacienteIdExcluir = null) => {
  if (!telefono || String(telefono).trim() === "" || telefono === "S/D") {
    return true;
  }
  const telefonoDuplicado = await Paciente.findOne({
    where: {
      telefono: String(telefono).trim(),
      activo: true,
      // Si estamos editando un paciente existente, lo excluimos de la búsqueda
      ...(pacienteIdExcluir && { id_paciente: { [Op.ne]: pacienteIdExcluir } }),
    },
  });
  if (telefonoDuplicado) {
    return false;
  }
  return true;
};

export const validarDni = async (dni, pacienteIdExcluir = null) => {
  if (!dni || String(dni).trim() === "") {
    return true;
  }
  const dniDuplicado = await Paciente.findOne({
    where: {
      dni: String(dni).trim(),
      activo: true,
      // Si estamos editando un paciente existente, lo excluimos de la búsqueda
      ...(pacienteIdExcluir && { id_paciente: { [Op.ne]: pacienteIdExcluir } }),
    },
  });
  if (dniDuplicado) {
    return false;
  }
  return true;
};
