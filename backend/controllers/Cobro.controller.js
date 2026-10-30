/** @format */

import { Cobro, Paciente, Turno, Cuota, Practica } from "../models/index.model.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

// ==========================================
// 1. OBTENER TODOS LOS COBROS 
// ==========================================
export const getAllCobros = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const sortField = req.query.sortField || "fecha_emision";
    const sortOrder = req.query.sortOrder || "ASC";
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
          required: false,
        },
      ],
      distinct: true,
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

    const turnoExiste = await Cobro.findOne({ where: { id_turno: id_turno, activo: true } });
    if (turnoExiste) {
      return res.status(409).json({
        status: "error",
        message: "Este turno ya tiene un cobro registrado.",
      });
    }

    const newCobro = await Cobro.create({
      id_turno: id_turno,
      id_paciente: id_paciente,
      monto_a_cobrar: monto_a_cobrar,
      cant_cuotas: cant_cuotas,
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
// 4. MÉTODOS DE PAGO ESPECÍFICOS (Inmediato, Cuotas, Informal)
// ==========================================

export const createCobroInmediato = async (req, res) => {
  try {
    const { monto_a_cobrar, monto_abonado, metodo_pago } = req.body;
    const id_turno = req.turno ? req.turno.id_turno : req.body.id_turno;
    const id_paciente = req.paciente ? req.paciente.id_paciente : req.body.id_paciente;

    const turno = await Turno.findByPk(id_turno);
    const precioTurno = turno ? Number(turno.precio_final) : 0;

    let cobro = await Cobro.findOne({ where: { id_turno, activo: true } });

    // La deuda total acordada no debe perderse ante un pago parcial
    const deudaTotal = Number(monto_a_cobrar) || (cobro ? Number(cobro.monto_a_cobrar) : precioTurno) || precioTurno || 0;
    const montoPagado = monto_abonado !== undefined && monto_abonado !== null && monto_abonado !== ""
      ? Number(monto_abonado)
      : (Number(monto_a_cobrar) || deudaTotal);

    if (!cobro) {
      cobro = await Cobro.create({
        id_turno,
        id_paciente,
        monto_a_cobrar: deudaTotal,
        cant_cuotas: 1,
      });
    } else {
      await cobro.update({
        monto_a_cobrar: deudaTotal || cobro.monto_a_cobrar,
      });
    }

    const cuotasPrevias = await Cuota.findAll({ where: { id_cobro: cobro.id_cobro, activo: true } });
    const pagadoPrevio = cuotasPrevias.reduce((acc, q) => acc + (Number(q.monto_cobrado) || 0), 0);
    const saldoRestante = Math.max(0, deudaTotal - pagadoPrevio);
    const montoCuotaActual = cuotasPrevias.length === 0 ? deudaTotal : saldoRestante;

    const estaTotalmentePagado = (pagadoPrevio + montoPagado) >= deudaTotal;
    const estadoCuota = montoPagado >= montoCuotaActual ? "Pagada" : "Parcialmente pagada";

    // Creamos la cuota correspondiente a este pago
    await Cuota.create({
      id_cobro: cobro.id_cobro,
      nro_cuota: cuotasPrevias.length + 1,
      monto_cuota: montoCuotaActual,
      monto_cobrado: montoPagado,
      fecha_vencimiento: new Date().toISOString().split("T")[0],
      fecha_cobro: new Date(),
      metodo_pago: metodo_pago || "Efectivo",
      estado: estadoCuota,
    });

    return res.status(201).json({
      status: "success",
      data: cobro,
      message: "Cobro inmediato registrado correctamente.",
    });
  } catch (error) {
    console.error("Error al crear cobro inmediato:", error);
    return res.status(500).json({ error: "Error al procesar el cobro inmediato." });
  }
};

export const createCobroCuotas = async (req, res) => {
  try {
    const {
      monto_a_cobrar,
      cant_cuotas,
      fecha_primer_vencimiento,
      cobrar_primera_cuota,
      metodo_pago,
    } = req.body;
    const id_turno = req.turno ? req.turno.id_turno : req.body.id_turno;
    const id_paciente = req.paciente ? req.paciente.id_paciente : req.body.id_paciente;

    const total = Number(monto_a_cobrar);
    const cantidadCuotas = Math.max(1, Number(cant_cuotas) || 1);
    const montoBaseCuota = Number((total / cantidadCuotas).toFixed(2));
    const montoCuotaFinal = Number((total - montoBaseCuota * (cantidadCuotas - 1)).toFixed(2));

    const turno = await Turno.findByPk(id_turno);
    let cobro = await Cobro.findOne({ where: { id_turno, activo: true } });

    // Validar que el monto total sea igual o mayor al monto acordado
    let montoMinimo = turno ? Number(turno.precio_final || 0) : 0;
    if (cobro) {
      const cuotasPrevias = await Cuota.findAll({ where: { id_cobro: cobro.id_cobro, activo: true } });
      const pagadoPrevio = cuotasPrevias.reduce((acc, q) => acc + (Number(q.monto_cobrado) || 0), 0);
      const deudaCobro = Number(cobro.monto_a_cobrar) || montoMinimo;
      montoMinimo = Math.max(0, deudaCobro - pagadoPrevio);
    }
    if (montoMinimo > 0 && total < montoMinimo) {
      return res.status(400).json({
        status: "error",
        message: `El monto total del plan de cuotas fijas ($${total}) debe ser igual o mayor al monto acordado ($${montoMinimo}).`,
      });
    }

    if (!cobro) {
      cobro = await Cobro.create({
        id_turno,
        id_paciente,
        monto_a_cobrar: total,
        cant_cuotas: cantidadCuotas,
      });
    } else {
      await cobro.update({
        monto_a_cobrar: total || cobro.monto_a_cobrar,
        cant_cuotas: cantidadCuotas,
      });
      // Si ya existían cuotas pendientes de este cobro, desactivarlas para regenerar el plan limpio
      await Cuota.update({ activo: false }, { where: { id_cobro: cobro.id_cobro, estado: "Pendiente" } });
    }

    const fechaBase = new Date(fecha_primer_vencimiento || Date.now());
    const cobrarPrimera = Boolean(cobrar_primera_cuota);

    for (let i = 1; i <= cantidadCuotas; i++) {
      let fechaVenc = new Date(fechaBase);
      fechaVenc.setMonth(fechaVenc.getMonth() + (i - 1));

      const esPrimeraPagada = i === 1 && cobrarPrimera;
      const montoEstaCuota = (i === cantidadCuotas) ? montoCuotaFinal : montoBaseCuota;

      await Cuota.create({
        id_cobro: cobro.id_cobro,
        nro_cuota: i,
        monto_cuota: montoEstaCuota,
        monto_cobrado: esPrimeraPagada ? montoEstaCuota : 0,
        fecha_vencimiento: fechaVenc.toISOString().split("T")[0],
        fecha_cobro: esPrimeraPagada ? new Date() : null,
        metodo_pago: esPrimeraPagada ? "Tarjeta" : null,
        estado: esPrimeraPagada ? "Pagada" : "Pendiente",
      });
    }

    return res.status(201).json({
      status: "success",
      data: cobro,
      message: "Plan de cuotas fijas creado correctamente.",
    });
  } catch (error) {
    console.error("Error al crear plan de cuotas:", error);
    return res.status(500).json({ error: "Error al procesar el plan de cuotas." });
  }
};

export const createCobroInformal = async (req, res) => {
  try {
    const { monto_a_cobrar, entrega_inicial, metodo_pago } = req.body;
    const id_turno = req.turno ? req.turno.id_turno : req.body.id_turno;
    const id_paciente = req.paciente ? req.paciente.id_paciente : req.body.id_paciente;

    let cobro = await Cobro.findOne({ where: { id_turno, activo: true } });

    const total = Number(monto_a_cobrar) || (cobro ? Number(cobro.monto_a_cobrar) : 0);
    const entrega = Number(entrega_inicial) || 0;

    if (!cobro) {
      cobro = await Cobro.create({
        id_turno,
        id_paciente,
        monto_a_cobrar: total,
        cant_cuotas: 1,
      });
    } else {
      await cobro.update({
        monto_a_cobrar: total || cobro.monto_a_cobrar,
      });
    }

    if (entrega > 0) {
      const cuotasCount = await Cuota.count({ where: { id_cobro: cobro.id_cobro } });
      const estadoCuota = entrega >= total ? "Pagada" : "Parcialmente pagada";
      await Cuota.create({
        id_cobro: cobro.id_cobro,
        nro_cuota: cuotasCount + 1,
        monto_cuota: total,
        monto_cobrado: entrega,
        fecha_vencimiento: new Date().toISOString().split("T")[0],
        fecha_cobro: new Date(),
        metodo_pago: metodo_pago || "Efectivo",
        estado: estadoCuota,
      });
    }

    return res.status(201).json({
      status: "success",
      data: cobro,
      message: "Acuerdo informal registrado correctamente.",
    });
  } catch (error) {
    console.error("Error al registrar acuerdo informal:", error);
    return res.status(500).json({ error: "Error al registrar el acuerdo informal." });
  }
};

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

    // 1. Obtener todos los cobros del paciente con sus cuotas
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

    // 2. Calcular acumulados
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
    // 1. Ingresos totales reales: suma de lo efectivamente cobrado en cuotas
    const totalIngresos = (await Cuota.sum("monto_cobrado")) || 0;

    // 2. Egresos totales reales: suma de gastos operativos activos
    const GastoModel = sequelize.models.Gasto;
    const totalEgresos = GastoModel ? ((await GastoModel.sum("monto", { where: { activo: true } })) || 0) : 0;

    // 3. Balance neto en caja (Cash Flow real)
    const balanceNeto = totalIngresos - totalEgresos;

    // 4. Cartera pendiente: deuda de turnos atendidos no saldados
    const turnosAtendidos = await Turno.findAll({
      where: { id_estado: 3, activo: true },
      attributes: ["id_turno", "precio_final"],
      include: [
        {
          model: Cobro,
          where: { activo: true },
          required: false,
          include: [
            {
              model: Cuota,
              attributes: ["monto_cobrado", "estado"],
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
        const pagado = cuotas.reduce((acc, q) => acc + (Number(q.monto_cobrado) || 0), 0);
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
