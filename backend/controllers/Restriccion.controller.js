/** @format */

import { Restriccion } from "../models/index.model.js";
import { Op } from "sequelize";

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

// Mismo formato que usa el frontend
const aRespuesta = (r) => ({
  id: r.id_restriccion,
  motivo: r.motivo,
  todoElDia: r.todo_el_dia,
  fechaInicio: r.fecha_inicio,
  fechaFin: r.fecha_fin,
  horaInicio: r.hora_inicio,
  horaFin: r.hora_fin,
  creadoEl: r.creado_el,
});

// Obtener todos los bloqueos
export const getAllRestricciones = async (req, res) => {
  try {
    const restricciones = await Restriccion.findAll({
      order: [
        ["fecha_inicio", "ASC"],
        ["hora_inicio", "ASC"],
      ],
    });

    res.status(200).json({
      status: "success",
      data: restricciones.map(aRespuesta),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear un bloqueo
export const createRestriccion = async (req, res) => {
  try {
    const { motivo, todoElDia, fechaInicio, horaInicio, horaFin } = req.body;
    const fechaFin = req.body.fechaFin || fechaInicio;

    if (!RE_FECHA.test(fechaInicio || "") || !RE_FECHA.test(fechaFin || "")) {
      return res.status(400).json({ message: "Las fechas deben tener formato YYYY-MM-DD." });
    }
    if (fechaFin < fechaInicio) {
      return res.status(400).json({ message: "La fecha de fin no puede ser anterior a la de inicio." });
    }

    const completo = Boolean(todoElDia);
    if (!completo) {
      if (!RE_HORA.test(horaInicio || "") || !RE_HORA.test(horaFin || "")) {
        return res.status(400).json({ message: "Las horas deben tener formato HH:MM." });
      }
      if (horaFin <= horaInicio) {
        return res.status(400).json({ message: "La hora de fin debe ser posterior a la de inicio." });
      }
    }

    // Evitar solapamientos con bloqueos existentes
    const existentes = await Restriccion.findAll({
      where: {
        fecha_inicio: { [Op.lte]: fechaFin },
        fecha_fin: { [Op.gte]: fechaInicio },
      },
    });

    const hayConflicto = existentes.some((r) => {
      if (completo || r.todo_el_dia) return true;
      if (r.hora_inicio && r.hora_fin) {
        return horaInicio < r.hora_fin && horaFin > r.hora_inicio;
      }
      return true;
    });

    if (hayConflicto) {
      return res
        .status(409)
        .json({ message: "Ya existe un bloqueo activo para la fecha u horario seleccionado." });
    }

    const nueva = await Restriccion.create({
      motivo: (motivo || "").trim() || "Bloqueado",
      todo_el_dia: completo,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      hora_inicio: completo ? null : horaInicio,
      hora_fin: completo ? null : horaFin,
    });

    res.status(201).json({
      status: "success",
      data: aRespuesta(nueva),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar un bloqueo
export const deleteRestriccion = async (req, res) => {
  try {
    const eliminadas = await Restriccion.destroy({
      where: { id_restriccion: req.params.id },
    });

    if (!eliminadas) {
      return res.status(404).json({ message: "Bloqueo no encontrado." });
    }

    res.json({ message: "Bloqueo eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};