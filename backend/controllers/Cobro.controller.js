/** @format */

import { Cobro, Paciente, Turno, Cuota, Practica, EstadoTurno } from "../models/index.model.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

console.log("VALORES PERMITIDOS EN CUOTA:", Cuota.rawAttributes.metodo_pago.values);
// ==========================================
// 1. OBTENER TODOS LOS COBROS (Solo con ingresos reales)
// ==========================================
export const getAllCobros = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 9;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const sortField = req.query.sortField || "fecha_emision";
    const sortOrder = req.query.sortOrder || "DESC";
    const where = { activo: true };

    if (search.trim() !== "") {
      where[Op.or] = [
        { "$Paciente.nombre$": { [Op.like]: `%${search}%` } },
        { "$Paciente.apellido$": { [Op.like]: `%${search}%` } },
        { "$Paciente.dni$": { [Op.like]: `%${search}%` } },
        { "$Paciente.telefono$": { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: cobros } = await Cobro.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, sortOrder]],
      distinct: true,
      include: [
        {
          model: Turno,
          attributes: ["id_turno", "notas_consulta", "fecha_hora_inicio", "fecha_hora_fin"],
          include: [
            {
              model: Practica,
              attributes: ["id_practica", "nombre_referencia", "nombre_nomenclador"],
              through: { attributes: [] },
              required: false,
            },
          ],
          required: false,
        },
        {
          model: Paciente,
          attributes: ["id_paciente", "nombre", "apellido", "dni", "telefono"],
        },
        {
          model: Cuota,
          attributes: ["id_cuota", "nro_cuota", "monto_cuota", "monto_cobrado", "metodo_pago", "estado", "fecha_cobro", "fecha_vencimiento"],
          where: { monto_cobrado: { [Op.gt]: 0 } },
          required: true,
        },
      ],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      data: cobros,
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
    console.error("Error al obtener los cobros:", error);
    res.status(500).json({ error: "Error al obtener los cobros" });
  }
};

// ==========================================
// 2. OBTENER COBRO POR ID
// ==========================================
export const getCobroById = async (req, res) => {
  try {
    const id = req.params.id || req.cobro?.id_cobro;

    const cobroCompleto = await Cobro.findByPk(id, {
      include: [
        {
          model: Paciente,
          attributes: ["id_paciente", "nombre", "apellido", "dni"],
        },
        {
          model: Turno,
          attributes: ["id_turno", "notas_consulta", "fecha_hora_inicio"],
          include: [
            {
              model: Practica,
              attributes: ["id_practica", "nombre_referencia", "nombre_nomenclador"],
              through: { attributes: [] },
              required: false,
            },
          ],
          required: false,
        },
        {
          model: Cuota,
          attributes: ["id_cuota", "nro_cuota", "monto_cuota", "monto_cobrado", "metodo_pago", "estado", "fecha_cobro", "fecha_vencimiento"],
          required: false,
        },
      ],
    });

    res.status(200).json({
      status: "success",
      data: cobroCompleto || req.cobro,
    });
  } catch (error) {
    console.error("Error al obtener el cobro:", error);
    res.status(500).json({ error: "Error al obtener el cobro" });
  }
};

// ==========================================
// 3. CREAR COBRO BÁSICO
// ==========================================
export const createCobro = async (req, res) => {
  try {
    const { monto_a_cobrar, cant_cuotas } = req.body;
    const id_turno = req.turno.id_turno;
    const id_paciente = req.paciente.id_paciente;

    const turnoExiste = await Cobro.findOne({ where: { id_turno, activo: true } });
    if (turnoExiste) {
      return res.status(409).json({
        status: "error",
        message: "Este turno ya tiene un cobro registrado.",
      });
    }

    const newCobro = await Cobro.create({
      id_turno,
      id_paciente,
      monto_a_cobrar,
      cant_cuotas: cant_cuotas || 1,
    });

    res.status(201).json({
      status: "success",
      data: newCobro,
    });
  } catch (error) {
    console.error("Error al crear el cobro:", error);
    res.status(500).json({ error: "Error al crear el cobro" });
  }
};

// ==========================================
// 4. REGISTRAR PAGO / ENTREGA PARCIAL O TOTAL (PAGOS LIBRES)
// ==========================================
// ==========================================
// 4. REGISTRAR PAGO / ENTREGA PARCIAL O TOTAL (PAGOS LIBRES)
// ==========================================
export const registrarPagoTurno = async (req, res) => {
  try {
    const { id_turno, metodo_pago, monto_a_cobrar } = req.body;
    const monto_abonado = req.body.monto_abonado ?? req.body.entrega_inicial ?? 0;

    const turno = await Turno.findByPk(id_turno);
    if (!turno) {
      return res.status(404).json({ status: "error", message: "Turno no encontrado" });
    }

    const totalDeuda = Number(monto_a_cobrar) || Number(turno.precio_final) || 0;
    const pagoActual = Number(monto_abonado) || 0;

    let [cobro] = await Cobro.findOrCreate({
      where: { id_turno, activo: true },
      defaults: {
        id_turno,
        id_paciente: turno.id_paciente,
        monto_a_cobrar: totalDeuda,
        cant_cuotas: 1,
        fecha_emision: new Date(),
        activo: true,
      },
    });

    if (totalDeuda > 0 && Number(cobro.monto_a_cobrar) !== totalDeuda) {
      await cobro.update({ monto_a_cobrar: totalDeuda });
    }

    // Registra la entrega si es mayor a 0
    if (pagoActual > 0) {
      const cantidadPrevias = await Cuota.count({ where: { id_cobro: cobro.id_cobro } });

      // Normalización para remover tildes y mapear con el ENUM de la base de datos
      // Normalizar método de pago con el ENUM exacto: ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro']
      let metodoNormalizado = metodo_pago || "Efectivo";
      metodoNormalizado = metodoNormalizado.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      if (/debit|tarjeta/i.test(metodoNormalizado)) {
        metodoNormalizado = "Tarjeta";
      } else if (/transf/i.test(metodoNormalizado)) {
        metodoNormalizado = "Transferencia";
      } else if (/efect/i.test(metodoNormalizado)) {
        metodoNormalizado = "Efectivo";
      } else {
        metodoNormalizado = "Otro";
      }

      await Cuota.create({
        id_cobro: cobro.id_cobro,
        nro_cuota: cantidadPrevias + 1,
        monto_cuota: totalDeuda,
        monto_cobrado: pagoActual,
        fecha_cobro: new Date(),
        fecha_vencimiento: new Date().toISOString().split("T")[0],
        metodo_pago: metodoNormalizado, 
        estado: "Pagada",
      });
    }

    const cuotas = await Cuota.findAll({ where: { id_cobro: cobro.id_cobro, activo: true } });
    const totalPagado = cuotas.reduce((acc, q) => acc + (Number(q.monto_cobrado) || 0), 0);
    const saldoPendiente = Math.max(0, totalDeuda - totalPagado);

    return res.status(200).json({
      status: "success",
      data: {
        id_cobro: cobro.id_cobro,
        total_acordado: totalDeuda,
        total_pagado: totalPagado,
        saldo_pendiente: saldoPendiente,
        estado: saldoPendiente === 0 ? "Saldado" : totalPagado > 0 ? "Parcial" : "Pendiente",
      },
      message: pagoActual > 0 ? "Pago registrado con éxito" : "Deuda guardada sin pago inicial",
    });
  } catch (error) {
    console.error("Error al registrar pago del turno:", error);
    return res.status(500).json({ status: "error", message: "Error al procesar el pago" });
  }
};

// Aliases de compatibilidad al final del archivo

// ==========================================
// 5. ACTUALIZAR Y ELIMINAR COBRO
// ==========================================
export const updateCobro = async (req, res) => {
  try {
    const { id_turno, id_paciente, monto_a_cobrar, cant_cuotas } = req.body;
    const cobro = req.cobro;

    await cobro.update({
      id_turno: id_turno || cobro.id_turno,
      id_paciente: id_paciente || cobro.id_paciente,
      monto_a_cobrar: monto_a_cobrar || cobro.monto_a_cobrar,
      cant_cuotas: cant_cuotas || cobro.cant_cuotas,
    });

    res.status(200).json({ status: "success", data: cobro });
  } catch (error) {
    console.error("Error al actualizar el cobro:", error);
    res.status(500).json({ error: "Error al actualizar el cobro" });
  }
};

export const deleteCobro = async (req, res) => {
  try {
    const cobro = req.cobro;
    await cobro.update({ activo: false });
    res.status(200).json({ status: "success", message: "Cobro eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el cobro:", error);
    res.status(500).json({ error: "Error al eliminar el cobro" });
  }
};

// ==========================================
// BALANCE DE CUENTA CORRIENTE POR PACIENTE (HU IE-3)
// ==========================================
export const getBalancePaciente = async (req, res) => {
  try {
    const id_paciente = req.params.id_paciente || req.params.id;

    const paciente = await Paciente.findByPk(id_paciente, {
      attributes: ["id_paciente", "nombre", "apellido", "dni", "telefono"],
    });

    if (!paciente) {
      return res.status(404).json({ status: "error", message: "Paciente no encontrado" });
    }

    const cobros = await Cobro.findAll({
      where: { id_paciente, activo: true },
      include: [
        {
          model: Cuota,
          attributes: ["id_cuota", "monto_cobrado", "monto_cuota", "estado", "fecha_cobro", "metodo_pago"],
          required: false,
        },
        {
          model: Turno,
          attributes: ["id_turno", "fecha_hora_inicio", "precio_final"],
          required: false,
        },
      ],
      order: [["fecha_emision", "ASC"]],
    });

    let montoPactadoTotal = 0;
    let totalPagado = 0;
    const turnosAtendidos = [];
    const pagosRealizados = [];

    cobros.forEach((c) => {
      const deudaCobro = Number(c.monto_a_cobrar) || 0;
      montoPactadoTotal += deudaCobro;

      if (c.Turno) {
        turnosAtendidos.push({
          id_turno: c.Turno.id_turno,
          fecha: c.Turno.fecha_hora_inicio,
          precio: deudaCobro,
        });
      }

      const cuotas = c.Cuotas || c.Cuota || [];
      cuotas.forEach((q) => {
        const pagado = Number(q.monto_cobrado) || 0;
        if (pagado > 0) {
          totalPagado += pagado;
          pagosRealizados.push({
            id_cuota: q.id_cuota,
            monto: pagado,
            metodo_pago: q.metodo_pago || "Efectivo",
            fecha_cobro: q.fecha_cobro,
          });
        }
      });
    });

    const saldo = montoPactadoTotal - totalPagado;
    let estado = "AL_DIA";
    if (saldo > 0) estado = "DEUDOR";
    else if (saldo < 0) estado = "A_FAVOR";

    return res.status(200).json({
      status: "success",
      data: {
        paciente: {
          id_paciente: paciente.id_paciente,
          nombre_completo: `${paciente.apellido}, ${paciente.nombre}`,
          dni: paciente.dni,
          telefono: paciente.telefono,
        },
        balance: {
          monto_pactado_total: montoPactadoTotal,
          total_pagado: totalPagado,
          saldo_deudor: saldo > 0 ? saldo : 0,
          saldo_a_favor: saldo < 0 ? Math.abs(saldo) : 0,
          estado,
        },
        turnos_atendidos: turnosAtendidos,
        pagos_realizados: pagosRealizados,
      },
    });
  } catch (error) {
    console.error("Error al obtener balance del paciente:", error);
    return res.status(500).json({ status: "error", message: "Error al calcular balance del paciente" });
  }
};

// ==========================================
// 6. OBTENER KPIS CONSOLIDADOS DE CAJA
// ==========================================
export const getKpisCaja = async (req, res) => {
  try {
    const totalIngresos = (await Cuota.sum("monto_cobrado")) || 0;

    const GastoModel = sequelize.models.Gasto;
    const totalEgresos = GastoModel ? ((await GastoModel.sum("monto", { where: { activo: true } })) || 0) : 0;

    const balanceNeto = totalIngresos - totalEgresos;

    const estadoAtendido = await EstadoTurno.findOne({
      where: { estado: { [Op.in]: ["Atendido", "atendido"] } },
    });

    const whereTurnos = { activo: true };
    if (estadoAtendido) {
      whereTurnos.id_estado = estadoAtendido.id_estado;
    }

    const turnosAtendidos = await Turno.findAll({
      where: whereTurnos,
      attributes: ["id_turno", "precio_final", "id_estado"],
      include: [
        {
          model: EstadoTurno,
          where: { estado: { [Op.in]: ["Atendido", "atendido"] } },
          required: true,
        },
        {
          model: Cobro,
          where: { activo: true },
          required: false,
          include: [
            {
              model: Cuota,
              where: { activo: true },
              attributes: ["monto_cuota", "monto_cobrado", "estado"],
              required: false,
            },
          ],
        },
      ],
    });

    let totalPendienteCobro = 0;
    turnosAtendidos.forEach((t) => {
      const deudaTurno = Number(t.Cobro?.monto_a_cobrar) || Number(t.precio_final) || 0;
      if (deudaTurno > 0) {
        const cuotas = t.Cobro?.Cuotas || t.Cobro?.Cuota || [];
        const pagado = cuotas.reduce((acc, q) => {
          const m = Number(q.monto_cobrado) || 0;
          return acc + m;
        }, 0);
        if (pagado < deudaTurno) {
          totalPendienteCobro += (deudaTurno - pagado);
        }
      }
    });

    return res.status(200).json({
      status: "success",
      data: {
        totalIngresos,
        totalEgresos,
        balanceNeto,
        totalPendienteCobro,
      },
    });
  } catch (error) {
    console.error("Error al calcular KPIs de caja:", error);
    return res.status(500).json({ error: "Error al calcular métricas de caja" });
  }
};
// ==========================================
// ALIASES DE COMPATIBILIDAD CON RUTAS EXISTENTES
// ==========================================
export const createCobroInmediato = registrarPagoTurno;
export const createCobroInformal = registrarPagoTurno;