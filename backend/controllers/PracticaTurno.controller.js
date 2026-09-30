/** @format */

import {
  PracticaTurno,
  Turno,
  Practica,
  ObraSocial,
} from "../models/index.model.js";

// Obtener todas las prácticas de turno
export const getAllPracticaTurno = async (req, res) => {
  try {
    const practicaTurnos = await PracticaTurno.findAll();

    res.status(200).json({
      status: "success",
      data: practicaTurnos,
    });
  } catch (error) {
    console.error("Error al obtener las prácticas de turno:", error);
    res.status(500).json({ error: "Error al obtener las prácticas de turno" });
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
    const { id_turno, id_practica, id_obra_social } = req.body;

    if (id_obra_social) {
      const obraSocial = await ObraSocial.findByPk(id_obra_social);

      if (!obraSocial)
        res.status(400).json({
          status: "error",
          message: "La obra social seleccionada no existe.",
        });
    }

    const newPracticaTurno = await PracticaTurno.create({
      id_turno,
      id_practica,
      id_obra_social: id_obra_social || null,
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
    const { id_turno, id_practica, id_obra_social } = req.body;

    const practicaTurno = req.practicaTurno;

    if (id_turno || id_practica || id_obra_social) {
      const turno = Turno.findByPk(id_turno);
      const practica = Practica.findByPk(id_practica);
      const obraSocial = ObraSocial.findByPk(id_obra_social);

      if (!turno || !practica || !obraSocial) {
        return res.status(400).json({
          status: "error",
          message:
            "El turno, la practica o la obra social seleccionada no existen.",
        });
      }
    }

    await practicaTurno.update({
      id_turno: id_turno || practicaTurno.id_turno,
      id_practica: id_practica || practicaTurno.id_practica,
      id_obra_social: id_obra_social || practicaTurno.id_obra_social,
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
