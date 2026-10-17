/** @format */

import { Op } from "sequelize";
import { Paciente } from "../models/Paciente.model.js";

export const validarTelefono = async (telefono, pacienteIdExcluir = null) => {
  const telefonoDuplicado = await Paciente.findOne({
    where: {
      telefono,
      // Si estamos editando un turno existente, lo excluimos de la búsqueda
      ...(pacienteIdExcluir && { id_paciente: { [Op.ne]: pacienteIdExcluir } }),
    },
  });
  if (telefonoDuplicado) {
    return false;
  }
  return true;
};

export const validarDni = async (dni, pacienteIdExcluir = null) => {
  const dniDuplicado = await Paciente.findOne({
    where: {
      dni,
      // Si estamos editando un turno existente, lo excluimos de la búsqueda
      ...(pacienteIdExcluir && { id_paciente: { [Op.ne]: pacienteIdExcluir } }),
    },
  });
  if (dniDuplicado) {
    return false;
  }
  return true;
};
