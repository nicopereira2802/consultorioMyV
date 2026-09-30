/** @format */

import { Practica } from "../models/Practica.model.js";
import { Op } from "sequelize";

// Obtener todas las prácticas
export const getAllPracticas = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || "";
    const sortField = req.query.sortField || "nombre";
    const sortOrder = req.query.sortOrder || "ASC";
    const offset = (page - 1) * limit;
    const where = {};

    if (search.trim() !== "") {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
      ];
    }
    
    const { count, rows: practicas } = await Practica.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, sortOrder]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      data: practicas,
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
    console.error("Error al obtener prácticas:", error);
    res.status(500).json({
      status: "error",
      message: "Error al obtener las prácticas",
      error: error.message,
    });
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
