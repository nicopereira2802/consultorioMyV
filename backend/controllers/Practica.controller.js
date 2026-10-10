/** @format */

import { Practica } from "../models/Practica.model.js";

// Obtener todas las prácticas (activas por defecto para no listar prácticas eliminadas)
export const getAllPracticas = async (req, res) => {
  try {
    const where = {};
    if (req.query.activas === "true") {
      where.activo = true;
    } else if (req.query.activas === "false") {
      where.activo = false;
    } else if (req.query.todas !== "true" && req.query.incluir_inactivas !== "true") {
      // Por defecto no traer prácticas eliminadas/inactivas (borrado lógico: activo = true)
      where.activo = true;
    }

    const practicas = await Practica.findAll({ where });

    res.status(200).json({
      status: "success",
      data: practicas,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener una práctica por su ID
export const getPracticaById = async (req, res) => {
  try {
    const practica = req.practica;

    res.status(200).json({
      status: "success",
      data: practica,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear una nueva practica
export const createPractica = async (req, res) => {
  try {
    const {
      codigo_nomenclador,
      nombre_nomenclador,
      nombre_referencia,
      especialidad,
      precio_referencia,
    } = req.body;

    const newPractica = await Practica.create({
      codigo_nomenclador,
      nombre_nomenclador,
      nombre_referencia,
      especialidad,
      precio_referencia,
    });

    res.status(201).json({
      status: "success",
      data: newPractica,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar una práctica existente
export const updatePractica = async (req, res) => {
  try {
    const {
      codigo_nomenclador,
      nombre_nomenclador,
      nombre_referencia,
      especialidad,
      precio_referencia,
    } = req.body;

    const practica = req.practica;

    await practica.update({
      codigo_nomenclador: codigo_nomenclador || practica.codigo_nomenclador,
      nombre_nomenclador: nombre_nomenclador || practica.nombre_nomenclador,
      nombre_referencia: nombre_referencia || practica.nombre_referencia,
      especialidad: especialidad || practica.especialidad,
      precio_referencia: precio_referencia || practica.precio_referencia,
    });

    res.status(200).json({
      status: "success",
      data: practica,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar una práctica existente
export const deletePractica = async (req, res) => {
  try {
    const practica = req.practica;

    await practica.update({
      activo: false,
    });

    res.json({ message: "Practica eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
