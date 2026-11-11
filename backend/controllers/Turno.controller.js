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
  EstadoTurno,
  Cuota
} from "../models/index.model.js";
import { validarSolapaminetoHorarios, validarHorarioAtencion } from "../validations/Turno.validation.js";
import { ESTADOS } from "../constants/EstadosTurno.js";
import { obtenerEstadoTurno } from "../states/TurnoState.js";
import { defaultTurnoIncludes, includePacienteConObrasSociales, includePracticasTurno, includeHistorialEstadoTurno } from "../constants/TurnoIncludes.js";
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
    console.error("Error buscando turnos:", error);
    res.status(500).json({ error: "Error al obtener los turnos" });
  }
};

export const getAllTurnos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const offset = (page - 1) * limit;
    const search = (req.query.search || req.query.buscar || "").trim();
    const sortField = req.query.sortField || "fecha_hora_inicio";
    const sortOrder = req.query.sortOrder || "ASC";
    const estadoFiltrado = req.query.estadoFiltrado;
    const id_paciente = req.query.id_paciente;
    
    let where = { activo: true };
    if (estadoFiltrado) where.id_estado = estadoFiltrado;
    if (id_paciente) where.id_paciente = Number(id_paciente);

    const hasPacienteSearch = Boolean(search !== "");
    let wherePaciente = undefined;

    if (hasPacienteSearch) {
      const termino = `%${search}%`;
      wherePaciente = {
        [Op.or]: [
          { nombre: { [Op.like]: termino } },
          { apellido: { [Op.like]: termino } },
          { dni: { [Op.like]: termino } },
          { telefono: { [Op.like]: termino } },
        ],
      };
    }

    const includes = defaultTurnoIncludes.map((inc) => {
      if (inc.model?.name === "Paciente" || inc.model === Paciente) {
        return {
          ...inc,
          where: hasPacienteSearch ? wherePaciente : undefined,
          required: hasPacienteSearch,
        };
      }
      return inc;
    });

    const { count, rows: turnos } = await Turno.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, sortOrder]],
      distinct: true,
      include: includes,
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
    console.error("Error buscando turnos:", error);
    res.status(500).json({ error: "Error al obtener los turnos" });
  }
};

export const getAllTurnosAtendidos = async (req, res) => {
  try {
    const estadoAtendido = await EstadoTurno.findOne({
      where: {
        estado: { [Op.in]: ["Atendido", "atendido"] },
      },
    });

    const whereTurno = { activo: true };
    if (estadoAtendido) {
      whereTurno.id_estado = estadoAtendido.id_estado;
    }

    const turnos = await Turno.findAll({
      where: whereTurno,
      include: [
        includePacienteConObrasSociales,
        {
          model: EstadoTurno,
          where: { estado: { [Op.in]: ["Atendido", "atendido"] } },
          required: true,
        },
        includePracticasTurno,
        includeHistorialEstadoTurno,
        {
          model: Cobro,
          where: { activo: true },
          required: false, // LEFT JOIN para traer el turno aunque el cobro se haya creado recién
          include: [
            {
              model: Cuota,
              attributes: [
                "id_cuota",
                "nro_cuota",
                "monto_cuota",
                "monto_cobrado",
                "estado",
                "metodo_pago",
                "fecha_cobro",
                "fecha_vencimiento",
              ],
              required: false,
            },
          ],
        },
      ],
      order: [["fecha_hora_inicio", "DESC"]],
    });

    // Filtramos para retornar SOLO los turnos que fueron efectivamente atendidos y aún tienen saldo pendiente
    const turnosPendientesDeCobro = turnos.filter((t) => {
      // 1. Validar estrictamente que el estado sea Atendido
      const nombreEstado = (t.EstadoTurno?.estado || "").toLowerCase();
      const esAtendido =
        nombreEstado === "atendido" ||
        (estadoAtendido && t.id_estado === estadoAtendido.id_estado);
      if (!esAtendido) return false;

      const totalDeuda = Number(t.Cobro?.monto_a_cobrar) || Number(t.precio_final) || 0;

      // Si el turno fue gratuito, no hay nada que cobrar
      if (totalDeuda <= 0) return false;

      // Si no tiene cobro generado, debe cobrarse
      if (!t.Cobro) return true;

      // Sumar lo que efectivamente se cobró en sus cuotas
      const cuotas = t.Cobro.Cuotas || t.Cobro.Cuota || [];
      const totalPagado = cuotas.reduce((acc, c) => {
        const pagado = Number(c.monto_cobrado) || 0;
        if (pagado > 0) return acc + pagado;
        if (c.estado === "Pagada") return acc + (Number(c.monto_cuota) || 0);
        return acc;
      }, 0);

      // Si lo pagado es menor a la deuda, sigue pendiente en la pestaña "Por Cobrar"
      return totalPagado < totalDeuda;
    });

    const data = turnosPendientesDeCobro.map((t) => {
      const formatted = formatearTurnoResponse(t);
      const totalDeuda = Number(t.Cobro?.monto_a_cobrar) || Number(t.precio_final) || 0;
      const cuotas = t.Cobro?.Cuotas || t.Cobro?.Cuota || [];
      const totalPagado = cuotas.reduce((acc, c) => {
        const pagado = Number(c.monto_cobrado) || 0;
        if (pagado > 0) return acc + pagado;
        if (c.estado === "Pagada") return acc + (Number(c.monto_cuota) || 0);
        return acc;
      }, 0);
      const saldoPendiente = Math.max(0, totalDeuda - totalPagado);

      return {
        ...formatted,
        estado: (t.EstadoTurno?.estado || "atendido").toLowerCase(),
        total_deuda: totalDeuda,
        total_pagado: totalPagado,
        saldo_pendiente: saldoPendiente,
      };
    });

    res.status(200).json({
      status: "success",
      data,
    });
  } catch (error) {
    console.error("Error al obtener los turnos atendidos pendientes:", error);
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

export const getTurnosByPacienteId = async (req, res) => {
  try {
    const { id_paciente } = req.params;

    const turnos = await Turno.findAll({
      where: {
        id_paciente: id_paciente,
        activo: true,
      },
      order: [["fecha_hora_inicio", "DESC"]],
      include: [
        {
          model: EstadoTurno,
          attributes: ["id_estado", "estado"],
        },
        {
          model: Cobro,
          attributes: ["id_cobro", "monto_a_cobrar", "cant_cuotas", "fecha_emision"],
          include: [
            {
              model: Cuota,
              attributes: ["id_cuota", "monto_cobrado", "monto_cuota", "estado", "metodo_pago"],
            },
          ],
        },
        {
          model: PracticaTurno,
          include: [
            {
              model: Practica,
            },
          ],
        },
        includePracticasTurno,
      ],
    });

    return res.status(200).json({
      status: "success",
      data: turnos,
    });
  } catch (error) {
    console.error("Error al obtener los turnos del paciente:", error);
    return res.status(500).json({
      status: "error",
      message: "Error al obtener los turnos del paciente",
    });
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

    const dentroHorario = validarHorarioAtencion(inicioStr, finStr);
    if (!dentroHorario) {
      return res.status(400).json({ error: "El horario de atención es de 09:00 a 19:00 hs. El turno debe comenzar a partir de las 09:00 y finalizar a más tardar a las 19:00 hs." });
    }

    const conflicto = await validarSolapaminetoHorarios(inicioStr, finStr, null);
    if (conflicto) {
      const nombrePac = conflicto.Paciente
        ? `${conflicto.Paciente.nombre} ${conflicto.Paciente.apellido}`
        : "otro paciente";
      const hIni = conflicto.fecha_hora_inicio ? new Date(conflicto.fecha_hora_inicio).toTimeString().slice(0, 5) : "";
      const hFin = conflicto.fecha_hora_fin ? new Date(conflicto.fecha_hora_fin).toTimeString().slice(0, 5) : "";
      return res.status(409).json({
        error: `Horario no disponible: se solapa con el turno de ${nombrePac} (${hIni} a ${hFin} hs).`,
        data: conflicto,
      });
    }

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
    const { id_paciente, precio_final, notas_consulta, fecha_hora_inicio, fecha_hora_fin, duracion_minutos } = req.body;

    let nuevoInicio = turno.fecha_hora_inicio;
    let nuevoFin = turno.fecha_hora_fin;

    if (fecha_hora_inicio) {
      nuevoInicio = formatearFechaHoraStr(fecha_hora_inicio);
      nuevoFin = fecha_hora_fin ? formatearFechaHoraStr(fecha_hora_fin) : calcularFechaHoraFinStr(nuevoInicio, duracion_minutos || 30);
      
      const dentroHorario = validarHorarioAtencion(nuevoInicio, nuevoFin);
      if (!dentroHorario) {
        return res.status(400).json({ error: "El horario de atención es de 09:00 a 19:00 hs. El turno debe comenzar a partir de las 09:00 y finalizar a más tardar a las 19:00 hs." });
      }

      const conflicto = await validarSolapaminetoHorarios(nuevoInicio, nuevoFin, turno.id_turno);
      if (conflicto) {
        const nombrePac = conflicto.Paciente
          ? `${conflicto.Paciente.nombre} ${conflicto.Paciente.apellido}`
          : "otro paciente";
        const hIni = conflicto.fecha_hora_inicio ? new Date(conflicto.fecha_hora_inicio).toTimeString().slice(0, 5) : "";
        const hFin = conflicto.fecha_hora_fin ? new Date(conflicto.fecha_hora_fin).toTimeString().slice(0, 5) : "";
        return res.status(409).json({
          error: `Horario no disponible: se solapa con el turno de ${nombrePac} (${hIni} a ${hFin} hs).`,
          data: conflicto,
        });
      }
    }

    if (id_paciente) {
      const paciente = await Paciente.findByPk(id_paciente);
      if (!paciente) return res.status(400).json({ error: "El paciente seleccionado no existe." });
    }

    const turnoActualizado = await sequelize.transaction(async (t) => {
      await turno.update({
        id_paciente: id_paciente || turno.id_paciente,
        fecha_hora_inicio: nuevoInicio,
        fecha_hora_fin: nuevoFin,
        precio_final: precio_final !== undefined ? precio_final : turno.precio_final,
        notas_consulta: notas_consulta !== undefined ? notas_consulta : turno.notas_consulta,
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

      // REGISTRO INICIAL DEL COBRO EN $0 (Deuda generada automáticamente)
      
      /*if (precioFinal > 0) {
        const cobroExistente = await Cobro.findOne({ 
          where: { id_turno: turno.id_turno, activo: true }, 
          transaction: t 
        });

        if (!cobroExistente) {
          await Cobro.create({
            id_turno: turno.id_turno,
            id_paciente: turno.id_paciente,
            monto_a_cobrar: precioFinal,
            cant_cuotas: 1, 
            fecha_emision: new Date(),
            activo: true,
          }, { transaction: t });
        }
      }*/

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
    const { fecha_hora_inicio, fecha_hora_fin, duracion_minutos, motivo } = req.body;
    
    const inicioStr = formatearFechaHoraStr(fecha_hora_inicio);
    const finStr = fecha_hora_fin ? formatearFechaHoraStr(fecha_hora_fin) : calcularFechaHoraFinStr(inicioStr, duracion_minutos || 30);

    const dentroHorario = validarHorarioAtencion(inicioStr, finStr);
    if (!dentroHorario) {
      return res.status(400).json({ error: "El horario de atención es de 09:00 a 19:00 hs. El turno debe comenzar a partir de las 09:00 y finalizar a más tardar a las 19:00 hs." });
    }

    const conflicto = await validarSolapaminetoHorarios(inicioStr, finStr, turno.id_turno);
    if (conflicto) {
      const nombrePac = conflicto.Paciente
        ? `${conflicto.Paciente.nombre} ${conflicto.Paciente.apellido}`
        : "otro paciente";
      const hIni = conflicto.fecha_hora_inicio ? new Date(conflicto.fecha_hora_inicio).toTimeString().slice(0, 5) : "";
      const hFin = conflicto.fecha_hora_fin ? new Date(conflicto.fecha_hora_fin).toTimeString().slice(0, 5) : "";
      return res.status(409).json({
        error: `Horario no disponible: se solapa con el turno de ${nombrePac} (${hIni} a ${hFin} hs).`,
        data: conflicto,
      });
    }

    const turnoActualizado = await sequelize.transaction(async (t) => {
      const [estadoProgramado] = await EstadoTurno.findOrCreate({
        where: { estado: "Programado" },
        transaction: t,
      });

      await turno.update({
        fecha_hora_inicio: inicioStr,
        fecha_hora_fin: finStr,
        id_estado: estadoProgramado.id_estado
      }, { transaction: t });

      await HistorialEstadoTurno.create({
        id_turno: turno.id_turno,
        id_estado: estadoProgramado.id_estado,
        fecha_hora_cambio: new Date(),
        descripcion: motivo || "Turno reprogramado",
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
    await req.turno.update({ activo: !req.turno.activo });
    res.status(200).json({ message: "Turno eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el turno:", error);
    res.status(500).json({ error: "Error al eliminar el turno" });
  }
};