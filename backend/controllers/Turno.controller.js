import sequelize from "../config/database.js";
import { Op } from "sequelize";
import {
  Turno,
  HistorialEstadoTurno,
  PracticaTurno,
  Practica,    
  EstadoTurno,
} from "../models/index.model.js";
import {
  validarEstadoProgramado,
  validarSolapaminetoHorarios,
} from "../validations/Turno.validation.js";
import { obtenerEstadoTurno } from "../states/TurnoState.js"; 

export const getAllTurnos = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || "";
    const sortField = req.query.sortField || "fecha_hora_inicio";
    const sortOrder = req.query.sortOrder || "ASC";
    const offset = (page - 1) * limit;

    const where = {};

    if (search.trim() !== "") {
      where[Op.or] = [
        { notas_consulta: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: turnos } = await Turno.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, sortOrder]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      data: turnos,
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
    console.error("Error al obtener los turnos:", error);
    res.status(500).json({
      status: "error",
      message: "Error al obtener los turnos",
      error: error.message,
    });
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
    console.log(fecha_hora_inicio);

    const inicio = new Date(fecha_hora_inicio);
    const fecha_hora_fin = new Date(
      inicio.getTime() + duracion_minutos * 60000,
    );
    // Si no encuentra el estado lo crea
    const estado = await validarEstadoProgramado();

    const haySolapamiento = await validarSolapaminetoHorarios(
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
          descripcion: notas_consulta || "Turno programado inicialmente",
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
      const haySolapamiento = await validarSolapaminetoHorarios(
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

    const result = await sequelize.transaction(async (t) => {
      // Obtener la instancia del estado actual
      const estadoActual = await obtenerEstadoTurno(turno.id_estado, t);
      await estadoActual.atender(
        turno,
        { observacion: notas_consulta, practicas_realizadas },
        t
      );

      // Guardar las prácticas en la tabla intermedia
      if (
        practicas_realizadas &&
        Array.isArray(practicas_realizadas) &&
        practicas_realizadas.length > 0
      ) {
        const idsUnicos = [...new Set(practicas_realizadas)];

        const practicasEncontradas = await Practica.findAll({
          where: {
            id_practica: { [Op.in]: idsUnicos },
          },
          transaction: t,
        });

        if (practicasEncontradas.length !== idsUnicos.length) {
          throw new Error("Una o más prácticas especificadas no existen.");
        }

        const registrosPracticas = idsUnicos.map((id_practica) => ({
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
    res.status(400).json({ error: error.message });
  }
};

// Cambiar estado del turno a Cancelado
export const turnoCancelado = async (req, res) => {
  try {
    const turno = req.turno;
    const { notas_consulta } = req.body;

    const result = await sequelize.transaction(async (t) => {
      const estadoActual = await obtenerEstadoTurno(turno.id_estado, t);
      await estadoActual.cancelar(turno, notas_consulta, t);
      return turno;
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error al cancelar turno:", error);
    res.status(400).json({ error: error.message });
  }
};

export const turnoInasistido = async (req, res) => {
  try {
    const turno = req.turno;
    const { notas_consulta } = req.body;

    const result = await sequelize.transaction(async (t) => {
      const estadoActual = await obtenerEstadoTurno(turno.id_estado, t);
      await estadoActual.marcarInasistente(
        turno,
        notas_consulta || "El profesional constató la inasistencia del paciente.",
        t
      );
      return turno;
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error al marcar inasistencia:", error);
    res.status(400).json({ error: error.message });
  }
};

// DEFINIR POLITICA DEL REPROGRAMADO
/*
export const turnoReprogramado = async (req, res) => {
  try {
    const turno = req.turno;
    const { fecha_hora_inicio, duracion_minutos, notas_consulta } = req.body;

    const inicio = new Date(fecha_hora_inicio);
    const fecha_hora_fin = new Date(
      inicio.getTime() + duracion_minutos * 60000,
    );

    const haySolapamiento = await validarSolapaminetoHorarios(
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
      const estadoActual = await obtenerEstadoTurno(turno.id_estado, t);

      // Si el turno estaba Cancelado, Inasistente o Atendido, lanzará error aquí
      await estadoActual.reprogramar(
        turno,
        {
          fecha_hora_inicio,
          fecha_hora_fin,
          observacion: notas_consulta || "Turno reprogramado a nueva fecha/hora.",
        },
        t,
      );

      return turno;
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error al reprogramar el turno:", error);
    res.status(400).json({ error: error.message });
  }
};

*/

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
