import { Turno } from "../models/Turno.model.js";
import { Paciente } from "../models/Paciente.model.js";
import { EstadoTurno } from "../models/EstadoTurno.model.js";

// Obtener todos los turnos con sus relaciones
export const getAllTurnos = async (req, res) => {
  try {
    const turnos = await Turno.findAll({
      include: [
        { model: Paciente },
        { model: EstadoTurno }
      ],
      order: [["fecha_hora_inicio", "ASC"]]
    });
    res.status(200).json(turnos);
  } catch (error) {
    console.error("Error al obtener los turnos:", error);
    res.status(500).json({ error: "Error al obtener los turnos" });
  }
};

// Obtener un turno por su ID
export const getTurnoById = async (req, res) => {
  const { id } = req.params;
  try {
    const turno = await Turno.findByPk(id, {
      include: [
        { model: Paciente },
        { model: EstadoTurno }
      ]
    });
    if (turno) {
      res.status(200).json(turno);
    } else {
      res.status(404).json({ error: "Turno no encontrado" });
    }
  } catch (error) {
    console.error("Error al obtener el turno:", error);
    res.status(500).json({ error: "Error al obtener el turno" });
  }
};

// Crear un nuevo turno
export const createTurno = async (req, res) => {
  try {
    const {
      id_paciente,
      pacienteId,
      id_estado,
      estadoId,
      fecha_hora_inicio,
      fecha_hora_fin,
      fecha,
      hora,
      precio_final,
      notas_consulta
    } = req.body;

    const patientId = id_paciente || pacienteId;
    if (!patientId) {
      return res.status(400).json({ error: "El paciente es obligatorio" });
    }

    let inicio = fecha_hora_inicio;
    let fin = fecha_hora_fin;

    if (!inicio && fecha && hora) {
      inicio = new Date(`${fecha}T${hora}:00`);
      fin = fin || new Date(new Date(inicio).getTime() + 30 * 60000);
    }

    if (!inicio) {
      return res.status(400).json({ error: "La fecha y hora de inicio son obligatorias" });
    }

    if (!fin) {
      fin = new Date(new Date(inicio).getTime() + 40 * 60000); // 40 min por defecto
    }

    const newTurno = await Turno.create({
      id_paciente: patientId,
      id_estado: id_estado || estadoId || 1, // 1 = Programado
      fecha_hora_inicio: inicio,
      fecha_hora_fin: fin,
      precio_final: precio_final !== undefined ? precio_final : 0.00,
      notas_consulta: notas_consulta || null
    });

    const populatedTurno = await Turno.findByPk(newTurno.id_turno, {
      include: [
        { model: Paciente },
        { model: EstadoTurno }
      ]
    });

    res.status(201).json(populatedTurno || newTurno);
  } catch (error) {
    console.error("Error al crear el turno:", error);
    res.status(500).json({ error: "Error al crear el turno", detalle: error.message });
  }
};

// Actualizar un turno existente
export const updateTurno = async (req, res) => {
  const { id } = req.params;
  const {
    id_paciente,
    pacienteId,
    id_estado,
    estadoId,
    fecha_hora_inicio,
    fecha_hora_fin,
    precio_final,
    notas_consulta
  } = req.body;

  try {
    const turno = await Turno.findByPk(id);
    if (turno) {
      if (id_paciente || pacienteId) turno.id_paciente = id_paciente || pacienteId;
      if (id_estado || estadoId) turno.id_estado = id_estado || estadoId;
      if (fecha_hora_inicio) turno.fecha_hora_inicio = fecha_hora_inicio;
      if (fecha_hora_fin) turno.fecha_hora_fin = fecha_hora_fin;
      if (precio_final !== undefined) turno.precio_final = precio_final;
      if (notas_consulta !== undefined) turno.notas_consulta = notas_consulta;

      await turno.save();
      const updatedTurno = await Turno.findByPk(id, {
        include: [{ model: Paciente }, { model: EstadoTurno }]
      });
      res.status(200).json(updatedTurno);
    } else {
      res.status(404).json({ error: "Turno no encontrado" });
    }
  } catch (error) {
    console.error("Error al actualizar el turno:", error);
    res.status(500).json({ error: "Error al actualizar el turno" });
  }
};

// Eliminar un turno existente
export const deleteTurno = async (req, res) => {
  const { id } = req.params;
  try {
    const turno = await Turno.findByPk(id);
    if (turno) {
      await turno.destroy();
      res.status(200).json({ message: "Turno eliminado correctamente" });
    } else {
      res.status(404).json({ error: "Turno no encontrado" });
    }
  } catch (error) {
    console.error("Error al eliminar el turno:", error);
    res.status(500).json({ error: "Error al eliminar el turno" });
  }
};
