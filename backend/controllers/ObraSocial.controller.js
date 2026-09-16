import { ObraSocial } from "../models/ObraSocial.model.js";

// Obtener todas las obras sociales
export const getAllObrasSociales = async (req, res) => {
  try {
    const obrasSociales = await ObraSocial.findAll();
    res.status(200).json(obrasSociales);
  } catch (error) {
    console.error("Error al obtener las obras sociales:", error);
    res.status(500).json({ error: "Error al obtener las obras sociales" });
  }
};

// Obtener una obra social por su ID
export const getObraSocialById = async (req, res) => {
  const { id } = req.params;
  try {
    const obraSocial = await ObraSocial.findByPk(id);
    if (obraSocial) {
      res.status(200).json(obraSocial);
    } else {
      res.status(404).json({ error: "Obra social no encontrada" });
    }
  } catch (error) {
    console.error("Error al obtener la obra social:", error);
    res.status(500).json({ error: "Error al obtener la obra social" });
  }
};

// Crear una nueva obra social
export const createObraSocial = async (req, res) => {
  const { nombre } = req.body;
  try {
    const newObraSocial = await ObraSocial.create({ nombre });
    res.status(201).json(newObraSocial);
  } catch (error) {
    console.error("Error al crear la obra social:", error);
    res.status(500).json({ error: "Error al crear la obra social" });
  }
};

// Actualizar una obra social existente
export const updateObraSocial = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  try {
    const obraSocial = await ObraSocial.findByPk(id);
    if (obraSocial) {
      obraSocial.nombre = nombre;
      await obraSocial.save();
      res.status(200).json(obraSocial);
    } else {
      res.status(404).json({ error: "Obra social no encontrada" });
    }
  } catch (error) {
    console.error("Error al actualizar la obra social:", error);
    res.status(500).json({ error: "Error al actualizar la obra social" });
  }
};

// Eliminar una obra social existente
export const deleteObraSocial = async (req, res) => {
  const { id } = req.params;
  try {
    const obraSocial = await ObraSocial.findByPk(id);
    if (obraSocial) {
      await obraSocial.destroy();
      res.status(200).json({ message: "Obra social eliminada correctamente" });
    } else {
      res.status(404).json({ error: "Obra social no encontrada" });
    }
  } catch (error) {
    console.error("Error al eliminar la obra social:", error);
    res.status(500).json({ error: "Error al eliminar la obra social" });
  }
};
