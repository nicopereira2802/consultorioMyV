import { EstadoTurno } from "../models/index.model.js";

export const getAllEstados = async (req, res) => {
  try {
    const estados = await EstadoTurno.findAll();

    res.status(200).json({
      status: "success",
      data: estados,
    });
  } catch (error) {
    console.error("Error al obtener los estados:", error);
    res.status(500).json({ error: "Error al obtener los estados" });
  }
};