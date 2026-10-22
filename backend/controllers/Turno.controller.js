/** @format */

import sequelize from "../config/database.js";
import { Op } from "sequelize";
import {
  Turno,
  HistorialEstadoTurno,
  Practica,
  PracticaTurno,
  Cobro,
  Paciente,
  PacienteObraSocial,
  EstadoTurno
} from "../models/index.model.js";
import { validarSolapaminetoHorarios } from "../validations/Turno.validation.js";
import { ESTADOS } from "../constants/EstadosTurno.js";
import { obtenerEstadoTurno } from "../states/TurnoState.js";
import { defaultTurnoIncludes } from "../constants/TurnoIncludes.js";
import {
  formatearTurnoResponse,
  extraerIdsPracticas,
  obtenerObraSocialBody,
  formatearFechaHoraStr,
  calcularFechaHoraFinStr
} from "../utils/turno.utils.js";

// ==========================================
// 1. LECTURA
// ==========================================

export const getAllTurnosAgenda = async (req, res) => {
  try {
    const turnos = await Turno.findAll({
      where: { activo: true },
      include: defaultTurnoIncludes,
    });

    res.status(200).json({
      status: "success",
      data: turnos.map(formatearTurnoResponse),
    });
  } catch (error) {
    console.error("Error al obtener los turnos:", error);
    res.status(500).json({ error: "Error al obtener los turnos" });
  }
};

export const getAllTurnos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const sortField = req.query.sortField || "fecha_hora_inicio";
    const sortOrder = req.query.sortOrder || "ASC";
    const estadoFiltrado = req.query.estadoFiltrado;
    
    let where = { activo: true };
    if (estadoFiltrado) where.id_estado = estadoFiltrado;

    if (search.trim() !== "") {
      where[Op.or] = [
        { fecha_hora_inicio: { [Op.like]: `%${search}%` } },
        { fecha_hora_fin: { [Op.like]: `%${search}%` } },
        { "$Paciente.nombre$": { [Op.like]: `%${search}%` } },
        { "$Paciente.apellido$": { [Op.like]: `%${search}%` } },
        { "$Paciente.dni$": { [Op.like]: `%${search}%` } },
        { "$Paciente.telefono$": { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: turnos } = await Turno.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, sortOrder]],
      include: defaultTurnoIncludes,
    });

    res.status(200).json({
      status: "success",
      data: turnos.map(formatearTurnoResponse),
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        hasNextPage: page < Math.ceil(count / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error al obtener los turnos:", error);
    res.status(500).json({ error: "Error al obtener los turnos" });
  }
};

export const getAllTurnosAtendidos = async (req, res) => {
  try {
    const turnos = await Turno.findAll({
      where: { activo: true },
      include: [
        ...defaultTurnoIncludes, 
        {
          model: EstadoTurno,
          where: { estado: "Atendido" },
          required: true, 
        },
      ],
      order: [["fecha_hora_inicio", "DESC"]],
    });

    res.status(200).json({
      status: "success",
      data: turnos,
    });
  } catch (error) {
    console.error("Error al obtener los turnos atendidos:", error);
    res.status(500).json({ error: "Error al obtener los turnos atendidos" });
  }
};

export const getTurnoById = async (req, res) => {
  try {
    const turno = await Turno.findByPk(req.turno.id_turno, { include: defaultTurnoIncludes });
    res.status(200).json({ status: "success", data: formatearTurnoResponse(turno) });
  } catch (error) {
    console.error("Error al obtener el turno:", error);
    res.status(500).json({ error: "Error al obtener el turno" });
  }
};


// ==========================================
// 2. ESCRITURA 
// ==========================================

export const createTurno = async (req, res) => {
  try {
    const { id_paciente, notas_consulta } = req.body;
    const inicioStr = formatearFechaHoraStr(req.body.fecha_hora_inicio);
    const finStr = req.body.fecha_hora_fin ? formatearFechaHoraStr(req.body.fecha_hora_fin) : calcularFechaHoraFinStr(inicioStr, req.body.duracion_minutos || 30);
    const idsPracticas = extraerIdsPracticas(req.body);
    const idObraSocial = obtenerObraSocialBody(req.body);

    const haySolapamiento = await validarSolapaminetoHorarios(inicioStr, finStr, null);
    if (haySolapamiento) return res.status(409).json({ error: "El horario seleccionado se superpone." });

    // Calculamos el precio en base a las prácticas
    let precioFinal = Number(req.body.precio_final) || 0;
    let practicas = [];
    if (idsPracticas.length > 0) {
      practicas = await Practica.findAll({ where: { id_practica: idsPracticas } });
      if (!precioFinal) precioFinal = practicas.reduce((acc, p) => acc + (Number(p.precio_referencia) || 0), 0);
    }

    const result = await sequelize.transaction(async (t) => {
      const nuevoTurno = await Turno.create({
        id_paciente,
        id_estado: ESTADOS.PROGRAMADO,
        fecha_hora_inicio: inicioStr,
        fecha_hora_fin: finStr,
        precio_final: precioFinal,
        notas_consulta: notas_consulta || null,
      }, { transaction: t });

      await HistorialEstadoTurno.create({
        id_turno: nuevoTurno.id_turno,
        id_estado: ESTADOS.PROGRAMADO,
        fecha_hora_cambio: new Date(),
        descripcion: req.body.notas_consulta || "Turno programado",
      }, { transaction: t });

      for (const p of practicas) {
        await PracticaTurno.create({
          id_turno: nuevoTurno.id_turno,
          id_practica: p.id_practica,
          id_obra_social: idObraSocial,
        }, { transaction: t });
      }

      return await Turno.findByPk(nuevoTurno.id_turno, { include: defaultTurnoIncludes, transaction: t });
    });

    res.status(201).json({ status: "success", data: formatearTurnoResponse(result) });
  } catch (error) {
    console.error("Error al crear el turno:", error);
    res.status(500).json({ error: "Error interno al crear el turno." });
  }
};

export const updateTurno = async (req, res) => {
  try {
    const turno = req.turno;
    const { id_paciente, precio_final, notas_consulta } = req.body;

    if (id_paciente) {
      const paciente = await Paciente.findByPk(id_paciente); // Bug corregido: añadido await
      if (!paciente) return res.status(400).json({ error: "El paciente seleccionado no existe." });
    }

    const turnoActualizado = await sequelize.transaction(async (t) => {
      await turno.update({
        id_paciente: id_paciente || turno.id_paciente,
        precio_final: precio_final || turno.precio_final,
        notas_consulta: notas_consulta || null,
      }, { transaction: t });

      return await Turno.findByPk(turno.id_turno, { include: defaultTurnoIncludes, transaction: t });
    });

    res.status(200).json({ status: "success", data: formatearTurnoResponse(turnoActualizado) });
  } catch (error) {
    console.error("Error al modificar el turno:", error);
    res.status(500).json({ error: "Error al modificar el turno." });
  }
};


// ==========================================
// 3. MÁQUINA DE ESTADOS (Patrón State)
// ==========================================

export const turnoAtendido = async (req, res) => {
  try {
    const turno = req.turno;
    const notaAtencion = req.body.descripcion || req.body.notas_consulta || "Atención finalizada";
    const idsPracticas = extraerIdsPracticas(req.body);
    const idObraSocial = obtenerObraSocialBody(req.body);

    const practicas = idsPracticas.length > 0 ? await Practica.findAll({ where: { id_practica: idsPracticas } }) : [];
    if (idsPracticas.length > 0 && practicas.length !== idsPracticas.length) {
      return res.status(400).json({ error: "Una o más prácticas especificadas no existen" });
    }

    const sumaPracticas = practicas.reduce((acc, p) => acc + (Number(p.precio_referencia) || 0), 0);
    const precioFinal = Number(req.body.precio_final || req.body.total) || sumaPracticas || Number(turno.precio_final) || 0;

    const turnoActualizado = await sequelize.transaction(async (t) => {
      const estadoActual = await obtenerEstadoTurno(turno.id_estado, t);
      await estadoActual.atender(turno, { observacion: notaAtencion, practicas_realizadas: idsPracticas }, t);

      await turno.update({ precio_final: precioFinal }, { transaction: t });

      await PracticaTurno.destroy({ where: { id_turno: turno.id_turno }, transaction: t });
      for (const p of practicas) {
        await PracticaTurno.create({
          id_turno: turno.id_turno,
          id_practica: p.id_practica,
          id_obra_social: idObraSocial,
        }, { transaction: t });
      }

      return await Turno.findByPk(turno.id_turno, { include: defaultTurnoIncludes, transaction: t });
    });

    res.status(200).json({ status: "success", data: formatearTurnoResponse(turnoActualizado) });
  } catch (error) {
    console.error("Error al finalizar atención:", error);
    res.status(400).json({ error: error.message || "Error al registrar atención" });
  }
};

export const turnoCancelado = async (req, res) => {
  try {
    const motivo = req.body.notas_consulta || req.body.motivo || "Turno cancelado";
    const turnoActualizado = await sequelize.transaction(async (t) => {
      const estadoActual = await obtenerEstadoTurno(req.turno.id_estado, t);
      await estadoActual.cancelar(req.turno, motivo.slice(0, 255), t);
      return await Turno.findByPk(req.turno.id_turno, { include: defaultTurnoIncludes, transaction: t });
    });
    res.status(200).json({ status: "success", data: formatearTurnoResponse(turnoActualizado) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const turnoInasistido = async (req, res) => {
  try {
    const motivo = req.body.notas_consulta || "Inasistencia registrada";
    const turnoActualizado = await sequelize.transaction(async (t) => {
      const estadoActual = await obtenerEstadoTurno(req.turno.id_estado, t);
      await estadoActual.marcarInasistente(req.turno, motivo, t);
      return await Turno.findByPk(req.turno.id_turno, { include: defaultTurnoIncludes, transaction: t });
    });
    res.status(200).json({ status: "success", data: formatearTurnoResponse(turnoActualizado) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const turnoReprogramado = async (req, res) => {
  try {
    const turno = req.turno;
    const { fecha_hora_inicio, fecha_hora_fin } = req.body;
    
    const inicioStr = formatearFechaHoraStr(fecha_hora_inicio);
    const finStr = fecha_hora_fin ? formatearFechaHoraStr(fecha_hora_fin) : calcularFechaHoraFinStr(inicioStr, 30);

    const haySolapamiento = await validarSolapaminetoHorarios(inicioStr, finStr, turno.id_turno);
    if (haySolapamiento) return res.status(409).json({ error: "El horario seleccionado se superpone." });

    // La reprogramación aquí sigue la idea original de Mateo: actualiza el turno actual a Programado
    const turnoActualizado = await sequelize.transaction(async (t) => {
      const estadoActual = await obtenerEstadoTurno(turno.id_estado, t);
      
      // Forzamos manualmente el estado a programado y guardamos historial (como hacía Mateo)
      await turno.update({
        fecha_hora_inicio: inicioStr,
        fecha_hora_fin: finStr,
        id_estado: ESTADOS.PROGRAMADO
      }, { transaction: t });

      await HistorialEstadoTurno.create({
        id_turno: turno.id_turno,
        id_estado: ESTADOS.PROGRAMADO,
        fecha_hora_cambio: new Date(),
        descripcion: "Turno reprogramado",
      }, { transaction: t });

      return await Turno.findByPk(turno.id_turno, { include: defaultTurnoIncludes, transaction: t });
    });

    res.status(200).json({ status: "success", data: formatearTurnoResponse(turnoActualizado) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTurno = async (req, res) => {
  try {
    await req.turno.update({ activo: !req.turno.activo }); // Enfoque Soft Delete de Mateo
    res.status(200).json({ message: "Turno eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el turno:", error);
    res.status(500).json({ error: "Error al eliminar el turno" });
  }
};

