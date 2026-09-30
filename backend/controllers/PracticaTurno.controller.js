/** @format */

import { PracticaTurno, Turno, Practica } from "../models/index.model.js";

// Obtener todas las prácticas de turno
export const getAllPracticaTurno = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortField = req.query.sortField || "id_practica_turno";
    const sortOrder = req.query.sortOrder || "ASC";
    const offset = (page - 1) * limit;

    const where = {};

    if (req.query.id_turno) {
      where.id_turno = req.query.id_turno;
    }

    const { count, rows: practicaTurnos } = await PracticaTurno.findAndCountAll({
      where,
      include: [
        {
          model: Practica,
          attributes: ["id_practica", "nombre"],
        },
      ],
      limit,
      offset,
      order: [[sortField, sortOrder]],
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      status: "success",
      data: practicaTurnos,
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
    console.error("Error al obtener las prácticas de turno:", error);
    res.status(500).json({
      status: "error",
      message: "Error al obtener las prácticas de turno",
      error: error.message,
    });
  }
};

// Obtener una práctica de turno por su ID
export const getPracticaTurnoById = async (req, res) => {
  try {
    const practicaTurno = req.practicaTurno;

    res.status(200).json({
      status: "success",
      data: practicaTurno,
    });
  } catch (error) {
    console.error("Error al obtener la práctica de turno:", error);
    res.status(500).json({ error: "Error al obtener la práctica de turno" });
  }
};

// Crear una nueva práctica de turno
export const createPracticaTurno = async (req, res) => {
  try {
    const { id_turno, practica_id } = req.body;

    const newPracticaTurno = await PracticaTurno.create({
      id_turno,
      practica_id,
    });

    res.status(201).json({
      stauts: "success",
      data: newPracticaTurno,
    });
  } catch (error) {
    console.error("Error al crear la práctica de turno:", error);
    res.status(500).json({ error: "Error al crear la práctica de turno" });
  }
};

// Actualizar una práctica de turno existente
export const updatePracticaTurno = async (req, res) => {
  try {
    const { id_turno, practica_id } = req.body;

    const practicaTurno = req.practicaTurno;

    if (id_turno || practica_id) {
      const turno = validarEntidadUpdate(Turno, id_turno);
      const practica = validarEntidadUpdate(Practica, practica_id);

      if (!turno || !practica) {
        return res.status(400).json({
          status: "error",
          message: "El turno o la practica seleccionada no existen.",
        });
      }
    }

    await practicaTurno.update({
      id_turno: id_turno || practicaTurno.id_turno,
      practica_id: practica_id || practicaTurno.practica_id,
    });

    res.status(200).json({
      status: "success",
      data: practicaTurno,
    });
  } catch (error) {
    console.error("Error al actualizar la práctica de turno:", error);
    res.status(500).json({ error: "Error al actualizar la práctica de turno" });
  }
};

// Eliminar una práctica de turno existente
export const deletePracticaTurno = async (req, res) => {
  try {
    const practicaTurno = req.practicaTurno;

    await practicaTurno.destroy();

    res
      .status(200)
      .json({ message: "Práctica de turno eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la práctica de turno:", error);
    res.status(500).json({ error: "Error al eliminar la práctica de turno" });
  }
};
