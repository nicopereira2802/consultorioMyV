/** @format */

import { HistorialEstadoTurno } from "../models/HistorialEstadoTurno.model";

export const getHistorialTurnoByTurnoId = async (req, res) => {
  try {
    const { id } = req.params;

    const historial = await HistorialEstadoTurno.findAll({
      where: { id_turno: id },
      include: [{ model: EstadoTurno, attributes: ["estado"] }],
      order: [["fecha_hora_cambio", "DESC"]],
    });

    if (!historial || historial.length === 0) {
      return res
        .status(404)
        .json({ error: "No se encontró historial para este turno." });
    }

    res.status(200).json({
      status: "success",
      data: historial,
    });
  } catch (error) {
    console.error("Error al obtener el historial:", error);
    res.status(500).json({ error: "Error interno al obtener el historial." });
  }
};
