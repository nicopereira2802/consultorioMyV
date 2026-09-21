import { Practica } from "../models/Practica.model.js";
import { validarCreacionPractica } from "../validations/Practica.validation.js";

// Obtener todas las prácticas
export const getAllPracticas = async (req, res) => {
  try {
    const practicas = await Practica.findAll();
    res.json(practicas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener una práctica por su ID
export const getPracticaById = async (req, res) => {
  const { id } = req.params;
  try {
    const practica = await Practica.findByPk(id);
    if (practica) {
      res.json(practica);
    } else {
      res.status(404).json({ message: "Practica not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Crear una nueva practica
export const createPractica = async (req, res) => {
  try {
    // Delegamos toda la validación al módulo externo
    const errorValidacion = await validarCreacionPractica(req.body);
    if (errorValidacion) {
      return res.status(400).json({ message: errorValidacion });
    }

    const { codigo_nomenclador, nombre_nomenclador, nombre_referencia, especialidad, precio_referencia } = req.body;

    const newPractica = await Practica.create({ 
      codigo_nomenclador, 
      nombre_nomenclador, 
      nombre_referencia, 
      especialidad, 
      precio_referencia 
    });

    res.status(201).json(newPractica);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar una práctica existente
export const updatePractica = async (req, res) => {
  const { id } = req.params;

  const { nombre, descripcion, precio } = req.body;

  try {
    const practica = await Practica.findByPk(id);
    if (practica) {
      practica.nombre = nombre;
      practica.descripcion = descripcion;
      practica.precio = precio;

      await practica.save();
      res.json(practica);
    } else {
      res.status(404).json({ message: "Practica not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar una práctica existente
export const deletePractica = async (req, res) => {
  const { id } = req.params;
  try {
    const practica = await Practica.findByPk(id);
    if (practica) {
      await practica.destroy();
      res.json({ message: "Practica deleted" });
    } else {
      res.status(404).json({ message: "Practica not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
