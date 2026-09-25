import { Practica } from "../models/Practica.model.js";

// Obtener todas las prácticas
export const getAllPracticas = async (req, res) => {
  try {
    const practicas = await Practica.findAll();

    res.status(200).json({
      status: "success",
      data: practicas,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener una práctica por su ID
export const getPracticaById = async (req, res) => {
  try {
    const { id } = req.params;

    const practica = await Practica.findByPk(id);

    if (!practica) {
      return res.status(400).json({
        status: "error",
        message: "Practica no encontrada",
      });
    }

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
    const { codigo_nomenclador, nombre_nomenclador, nombre_referencia, especialidad, precio_referencia } =
      req.body;

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
    const { id } = req.params;
    const { codigo_nomenclador, nombre_nomenclador, nombre_referencia, especialidad, precio_referencia } =
      req.body;

    const practica = await Practica.findByPk(id);

    if (!practica) {
      return res.status(400).json({
        status: "error",
        message: "Practica no encontrada",
      });
    }

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
    const { id } = req.params;

    const practica = await Practica.findByPk(id);

    if (!practica) {
      return res.status(400).json({
        status: "error",
        message: "Practica no encontrada",
      });
    }

    await practica.update({
      activo: false,
    });

    res.json({ message: "Practica eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
