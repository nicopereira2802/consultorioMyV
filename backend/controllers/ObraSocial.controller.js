/** @format */

import { ObraSocial } from "../models/index.model.js";
import { Op } from "sequelize";

// Obtener todas las obras sociales
export const getAllObrasSociales = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || "";
    const sortField = req.query.sortField || "nombre";
    const sortOrder = req.query.sortOrder || "ASC";
    const offset = (page - 1) * limit;
    const where = {};

    // busqueda por nombre o sigla
    if (search.trim() !== "") {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search.trim()}%` } },
      ];
    }
    const { count, rows: obrasSociales } = await ObraSocial.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, sortOrder]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      data: obrasSociales,
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
    console.error("Error al obtener las obras sociales:", error);
    res.status(500).json({
      status: "error",
      message: "Error al obtener las obras sociales",
      error: error.message,
    });
  }
};

// Obtener una obra social por su ID
export const getObraSocialById = async (req, res) => {
  try {
    const obraSocial = req.obraSocial;

    res.status(200).json({
      status: "success",
      data: obraSocial,
    });
  } catch (error) {
    console.error("Error al obtener la obra social:", error);
    res.status(500).json({ error: "Error al obtener la obra social" });
  }
};

// Crear una nueva obra social
export const createObraSocial = async (req, res) => {
  try {
    const { nombre } = req.body;

    const newObraSocial = await ObraSocial.create({ nombre });

    res.status(201).json({
      status: "success",
      data: newObraSocial,
    });
  } catch (error) {
    console.error("Error al crear la obra social:", error);
    res.status(500).json({ error: "Error al crear la obra social" });
  }
};

// Actualizar una obra social existente
export const updateObraSocial = async (req, res) => {
  try {
    const { nombre } = req.body;

    const obraSocial = req.obraSocial;

    await obraSocial.update({
      nombre: nombre || obraSocial.nombre,
    });

    res.status(200).json({
      status: "success",
      data: obraSocial,
    });
  } catch (error) {
    console.error("Error al actualizar la obra social:", error);
    res.status(500).json({ error: "Error al actualizar la obra social" });
  }
};

// Eliminar una obra social existente
export const deleteObraSocial = async (req, res) => {
  try {
    const obraSocial = req.obraSocial;

    await obraSocial.update({
      activo: false,
    });

    res.status(200).json({ message: "Obra social eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la obra social:", error);
    res.status(500).json({ error: "Error al eliminar la obra social" });
  }
};
