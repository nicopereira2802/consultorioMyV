/** @format */

import { ObraSocial } from "../models/index.model.js";
import { Op } from "sequelize";

// Obtener todas las obras sociales
export const getAllObrasSociales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const sortField = req.query.sortField || "nombre";
    const sortOrder = req.query.sortOrder || "ASC";
    const soloActivas = req.query.soloActivas === "true";
    const where = {};

    if (soloActivas) {
      where.activo = true;
    }

    // Busqueda por nombre, razon social o telefono
    if (search.trim() !== "") {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { razon_social: { [Op.like]: `%${search}%` } },
        { telefono: { [Op.like]: `%${search}%` } },
      ];
    }

    const allowedSortFields = [
      "id_obra_social",
      "nombre",
      "razon_social",
      "telefono",
      "email",
      "activo",
    ];
    const finalSortField = allowedSortFields.includes(sortField)
      ? sortField
      : "nombre";

    const { count, rows: obrasSociales } = await ObraSocial.findAndCountAll({
      where,
      limit,
      offset,
      order: [[finalSortField, sortOrder]],
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
    res.status(500).json({ error: "Error al obtener las obras sociales" });
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
    const {
      nombre,
      razon_social,
      telefono,
      email,
      activo,
    } = req.body;

    const newObraSocial = await ObraSocial.create({
      nombre,
      razon_social,
      telefono: telefono || null,
      email: email || null,
      activo: activo !== undefined ? activo : true,
    });

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
    const {
      nombre,
      razon_social,
      telefono,
      email,
      activo,
    } = req.body;

    const obraSocial = req.obraSocial;

    const updateData = {};

    if (nombre !== undefined) {
      updateData.nombre = nombre;
    }

    if (razon_social !== undefined) {
      updateData.razon_social = razon_social;
    }

    if (telefono !== undefined) {
      updateData.telefono = telefono;
    }

    if (email !== undefined) {
      updateData.email = email;
    }

    if (activo !== undefined) {
      updateData.activo = activo;
    }

    await obraSocial.update(updateData);

    res.status(200).json({
      status: "success",
      data: obraSocial,
    });
  } catch (error) {
    console.error("Error al actualizar la obra social:", error);
    res.status(500).json({ error: "Error al actualizar la obra social" });
  }
};

// Activar/desactivar una obra social (toggle activo)
export const toggleObraSocial = async (req, res) => {
  try {
    const obraSocial = req.obraSocial;

    await obraSocial.update({
      activo: !obraSocial.activo,
    });

    res.status(200).json({
      status: "success",
      message: `Obra social ${obraSocial.activo ? "activada" : "desactivada"} correctamente`,
      data: obraSocial,
    });
  } catch (error) {
    console.error("Error al alternar estado de la obra social:", error);
    res.status(500).json({ error: "Error al alternar estado de la obra social" });
  }
};

// Eliminar definitivamente una obra social
export const deleteObraSocial = async (req, res) => {
  try {
    const obraSocial = req.obraSocial;

    await obraSocial.destroy();

    res.status(200).json({ message: "Obra social eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la obra social:", error);
    res.status(500).json({ error: "Error al eliminar la obra social" });
  }
};
