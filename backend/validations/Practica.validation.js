import { Practica } from "../models/Practica.model.js";

export const validarCreacionPractica = async (datos) => {
  const { codigo_nomenclador, nombre_nomenclador, nombre_referencia, especialidad, precio_referencia } = datos;

  //Validar campos obligatorios
  if (!codigo_nomenclador || !nombre_nomenclador || !nombre_referencia || !especialidad || precio_referencia === undefined) {
    return "Faltan completar campos obligatorios";
  }

  //Validar que el arancel sea mayor a cero (PR-13A)
  if (Number(precio_referencia) <= 0) {
    return "El arancel de referencia debe ser mayor a cero";
  }

  // Validar que el código de nomenclador no esté duplicado en la BD
  const practicaExistente = await Practica.findOne({ where: { codigo_nomenclador } });
  if (practicaExistente) {
    return "El código de nomenclador ya se encuentra registrado";
  }

  // Si pasa todo retornar null
  return null;
};