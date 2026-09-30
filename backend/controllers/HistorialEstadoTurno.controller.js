/** @format */

import { HistorialEstadoTurno } from "../models/HistorialEstadoTurno.model.js";
import { EstadoTurno } from "../models/index.model.js";

export const getHistorialTurnoByTurnoId = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortField = req.query.sortField || "fecha_hora_cambio";
    const sortOrder = req.query.sortOrder || "DESC";
    const offset = (page - 1) * limit;

    const { count, rows: historial } =
      await HistorialEstadoTurno.findAndCountAll({
        where: { id_turno: id },
        include: [{ model: EstadoTurno, attributes: ["estado"] }],
        limit,
        offset,
        order: [[sortField, sortOrder]],
        distinct: true,
      });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      data: historial,
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
    console.error("Error al obtener el historial:", error);
    res.status(500).json({
      status: "error",
      message: "Error interno al obtener el historial.",
      error: error.message,
    });
  }
};
