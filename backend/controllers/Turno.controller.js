/** @format */

import sequelize from "../config/database.js";
import {
  Turno,
  HistorialEstadoTurno,
  PracticaTurno,
  EstadoTurno,
} from "../models/index.model.js";
import {
  validarEstadoProgramado,
  validarEstados,
  validarSolapaminetoHorarios,
} from "../validations/Turno.validation.js";

// Obtener todos los turnos
export const getAllTurnos = async (req, res) => {
  try {
    const turnos = await Turno.findAll();
    res.status(200).json(turnos);
  } catch (error) {
    console.error("Error al obtener los turnos:", error);
    res.status(500).json({ error: "Error al obtener los turnos" });
  }
};

// Obtener un turno por su ID
export const getTurnoById = async (req, res) => {
  try {
    const turno = req.turno;

    res.status(200).json({
      status: "success",
      data: turno,
    });
  } catch (error) {
    console.error("Error al obtener el turno:", error);
    res.status(500).json({ error: "Error al obtener el turno" });
  }
};

// Crear un nuevo turno (T-123)
export const createTurno = async (req, res) => {
  try {
    const {
      id_paciente,
      fecha_hora_inicio,
      duracion_minutos,
      precio_final,
      notas_consulta,
    } = req.body;

    const inicio = new Date(fecha_hora_inicio);
    const fecha_hora_fin = new Date(
      inicio.getTime() + duracion_minutos * 60000,
    );

    // Si no encuentra el estado lo crea
    const estado = validarEstadoProgramado();

    const haySolapamiento = validarSolapaminetoHorarios(
      fecha_hora_inicio,
      fecha_hora_fin,
      null,
    );

    if (haySolapamiento) {
      return res.status(409).json({
        error:
          "El horario seleccionado se superpone con un turno ya programado.",
      });
    }

    const result = await sequelize.transaction(async (t) => {
      const nuevoTurno = await Turno.create(
        {
          id_paciente,
          id_estado: estado.id_estado,
          fecha_hora_inicio,
          fecha_hora_fin,
          precio_final,
          notas_consulta: notas_consulta || null,
        },
        { transaction: t },
      );

      await HistorialEstadoTurno.create(
        {
          id_turno: nuevoTurno.id_turno,
          id_estado: estado.id_estado,
          fecha_hora_cambio: new Date(),
          descripcion: "Turno programado",
        },
        { transaction: t },
      );

      return nuevoTurno;
    });

    res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error al crear el turno:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al crear el turno." });
  }
};

export const updateTurno = async (req, res) => {
  try {
    const turno = req.turno;

    const {
      id_paciente,
      fecha_hora_inicio,
      duracion_minutos,
      precio_final,
      notas_consulta,
    } = req.body;

    const inicio = new Date(fecha_hora_inicio);
    const fecha_hora_fin = new Date(
      inicio.getTime() + duracion_minutos * 60000,
    );

    if (fecha_hora_inicio || duracion_minutos) {
      const haySolapamiento = validarSolapaminetoHorarios(
        fecha_hora_inicio,
        fecha_hora_fin,
        turno.id_turno,
      );

      if (haySolapamiento) {
        return res.status(409).json({
          error:
            "El horario seleccionado se superpone con un turno ya programado.",
        });
      }
    }

    await turno.update({
      id_paciente: id_paciente || turno.id_paciente,
      fecha_hora_inicio: fecha_hora_inicio || turno.fecha_hora_inicio,
      fecha_hora_fin: fecha_hora_fin || turno.fecha_hora_fin,
      precio_final: precio_final || turno.precio_final,
      notas_consulta: notas_consulta || null,
    });

    res.status(200).json({
      status: "success",
      data: turno,
    });
  } catch (error) {
    console.error("Error al modificar el turno:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al modificar el turno." });
  }
};

// Finalizar atención del turno y registrar prácticas (T-1314)
export const turnoAtendido = async (req, res) => {
  try {
    const { notas_consulta, practicas_realizadas } = req.body;

    const turno = req.turno;

    const estado = validarEstados(turno.id_estado, "Programado", "Atendido");

    if (!estado) {
      return res.status(400).json({
        error:
          "El turno debe estar programado para poder marcarlo como atendido.",
      });
    }

    const result = await sequelize.transaction(async (t) => {
      await turno.update(
        {
          id_estado: estado.id_estado,
          notas_consulta: notas_consulta || null,
        },
        { transaction: t },
      );

      // Guardar historial
      await HistorialEstadoTurno.create(
        {
          id_turno: turno.id_turno,
          id_estado: estado.id_estado,
          fecha_hora_cambio: new Date(),
          descripcion: "Turno atendido",
        },
        { transaction: t },
      );

      // Guardar las prácticas en la tabla intermedia
      if (
        practicas_realizadas &&
        Array.isArray(practicas_realizadas) &&
        practicas_realizadas.length > 0
      ) {
        const registrosPracticas = practicas_realizadas.map((id_practica) => ({
          id_turno: turno.id_turno,
          id_practica,
        }));

        await PracticaTurno.bulkCreate(registrosPracticas, { transaction: t });
      }

      return turno;
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error al finalizar la atención:", error);
    res.status(500).json({ error: "Error interno al registrar la atención" });
  }
};

// Cambiar estado del turno
export const turnoCancelado = async (req, res) => {
  try {
    const turno = req.turno;

    const estado = validarEstados(
      turno.id_estado,
      ["Programado", "Inasistente"],
      "Cancelado",
    );

    if (!estado) {
      return res.status(400).json({
        error:
          "El turno debe estar programado o inasistente para poder cancelarlo.",
      });
    }

    const result = await sequelize.transaction(async (t) => {
      await turno.update(
        {
          id_estado: estado.id_estado,
        },
        { transaction: t },
      );

      // Guardar historial
      await HistorialEstadoTurno.create(
        {
          id_turno: turno.id_turno,
          id_estado: estado.id_estado,
          fecha_hora_cambio: new Date(),
          descripcion: "Turno cancelado",
        },
        { transaction: t },
      );

      // Guardar las prácticas en la tabla intermedia

      return turno;
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: "Error interno al actualizar el estado" });
  }
};

export const turnoInasistido = async (req, res) => {
  try {
    const turno = req.turno;

    const estado = validarEstados(turno.id_estado, "Programado", "Inasistente");

    if (!estado) {
      return res.status(400).json({
        error:
          "El turno debe estar programado para poder marcarlo como inasistente.",
      });
    }

    const result = await sequelize.transaction(async (t) => {
      await turno.update(
        {
          id_estado: estado.id_estado,
        },
        { transaction: t },
      );

      // Guardar historial
      await HistorialEstadoTurno.create(
        {
          id_turno: turno.id_turno,
          id_estado: estado.id_estado,
          fecha_hora_cambio: new Date(),
          descripcion: "Turno cancelado",
        },
        { transaction: t },
      );

      // Guardar las prácticas en la tabla intermedia

      return turno;
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: "Error interno al actualizar el estado" });
  }
};

export const turnoReprogramado = async (req, res) => {
  try {
    const turno = req.turno;
    const { fecha_hora_inicio, duracion_minutos } = req.body;

    const inicio = new Date(fecha_hora_inicio);
    const fecha_hora_fin = new Date(
      inicio.getTime() + duracion_minutos * 60000,
    );

    const estado = validarEstados(
      turno.id_estado,
      ["Inasistente", "Cancelado"],
      "Programado",
    );

    if (!estado) {
      return res.status(400).json({
        error:
          "El turno debe estar inasistente o cancelado para poder marcarlo como programado.",
      });
    }

    const haySolapamiento = validarSolapaminetoHorarios(
      fecha_hora_inicio,
      fecha_hora_fin,
      turno.id_turno,
    );

    if (haySolapamiento) {
      return res.status(409).json({
        error:
          "El horario seleccionado se superpone con un turno ya programado.",
      });
    }

    const result = await sequelize.transaction(async (t) => {
      await turno.update(
        {
          fecha_hora_inicio: fecha_hora_inicio,
          fecha_hora_fin: fecha_hora_fin,
          id_estado: estado.id_estado,
        },
        { transaction: t },
      );

      // Guardar historial
      await HistorialEstadoTurno.create(
        {
          id_turno: turno.id_turno,
          id_estado: estado.id_estado,
          fecha_hora_cambio: new Date(),
          descripcion: "Turno reprogramado",
        },
        { transaction: t },
      );

      // Guardar las prácticas en la tabla intermedia

      return turno;
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: "Error interno al actualizar el estado" });
  }
};

// Eliminar un turno existente
export const deleteTurno = async (req, res) => {
  try {
    const turno = req.turno;

    await turno.destroy();

    res.status(200).json({ message: "Turno eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el turno:", error);
    res.status(500).json({ error: "Error al eliminar el turno" });
  }
};
