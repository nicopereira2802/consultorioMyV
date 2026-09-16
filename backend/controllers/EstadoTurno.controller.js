import { EstadoTurno } from "../models/EstadoTurno.model.js";

// Obtener todos los estados de turno
export const getAllEstadoTurnos = async (req, res) => {
  try {
    const estadoTurnos = await EstadoTurno.findAll();
    res.status(200).json(estadoTurnos);
  } catch (error) {
    console.error("Error al obtener los estados de turno:", error);
    res.status(500).json({ error: "Error al obtener los estados de turno" });
  }
};

// Obtener un estado de turno por su ID
export const getEstadoTurnoById = async (req, res) => {
  const { id } = req.params;
  try {
    const estadoTurno = await EstadoTurno.findByPk(id);
    if (estadoTurno) {
      res.status(200).json(estadoTurno);
    } else {
      res.status(404).json({ error: "Estado de turno no encontrado" });
    }
  } catch (error) {
    console.error("Error al obtener el estado de turno:", error);
    res.status(500).json({ error: "Error al obtener el estado de turno" });
  }
};

// Crear un nuevo estado de turno
/* export const createEstadoTurno = async (req, res) => {
  const { nombre } = req.body;
  try {
    const newEstadoTurno = await EstadoTurno.create({ nombre });
    res.status(201).json(newEstadoTurno);
  } catch (error) {
    console.error("Error al crear el estado de turno:", error);
    res.status(500).json({ error: "Error al crear el estado de turno" });
  }
}; */

// Actualizar un estado de turno existente
export const updateEstadoTurno = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  try {
    const estadoTurno = await EstadoTurno.findByPk(id);
    if (estadoTurno) {
      estadoTurno.nombre = nombre;
      await estadoTurno.save();
      res.status(200).json(estadoTurno);
    } else {
      res.status(404).json({ error: "Estado de turno no encontrado" });
    }
  } catch (error) {
    console.error("Error al actualizar el estado de turno:", error);
    res.status(500).json({ error: "Error al actualizar el estado de turno" });
  }
};

// Eliminar un estado de turno existente
/* export const deleteEstadoTurno = async (req, res) => {
  const { id } = req.params;
  try {
    const estadoTurno = await EstadoTurno.findByPk(id);
    if (estadoTurno) {
      await estadoTurno.destroy();
      res.status(200).json({ message: "Estado de turno eliminado correctamente" });
    } else {
      res.status(404).json({ error: "Estado de turno no encontrado" });
    }
  } catch (error) {
    console.error("Error al eliminar el estado de turno:", error);
    res.status(500).json({ error: "Error al eliminar el estado de turno" });
  }
}; */