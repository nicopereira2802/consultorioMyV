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
    const { monto_a_cobrar, metodo_pago } = req.body;
    const id_turno = req.turno ? req.turno.id_turno : req.body.id_turno;
    const id_paciente = req.paciente ? req.paciente.id_paciente : req.body.id_paciente;

    let cobro = await Cobro.findOne({ where: { id_turno, activo: true } });

    if (!cobro) {
      cobro = await Cobro.create({
        id_turno,
        id_paciente,
        monto_a_cobrar: Number(monto_a_cobrar),
        cant_cuotas: 1,
      });
    } else {
      await cobro.update({
        monto_a_cobrar: Number(monto_a_cobrar) || cobro.monto_a_cobrar,
        cant_cuotas: 1,
      });
    }

    const montoFinal = Number(monto_a_cobrar) || Number(cobro.monto_a_cobrar);

    // Creamos la cuota pagada
    await Cuota.create({
      id_cobro: cobro.id_cobro,
      nro_cuota: 1,
      monto_cuota: montoFinal,
      monto_cobrado: montoFinal,
      fecha_vencimiento: new Date().toISOString().split("T")[0],
      fecha_cobro: new Date(),
      metodo_pago: metodo_pago || "Efectivo",
      estado: "Pagada",
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
    const { monto_a_cobrar, cant_cuotas, fecha_primer_vencimiento } = req.body;
    const id_turno = req.turno ? req.turno.id_turno : req.body.id_turno;
    const id_paciente = req.paciente ? req.paciente.id_paciente : req.body.id_paciente;

    const total = Number(monto_a_cobrar);
    const cantidadCuotas = Number(cant_cuotas) || 1;
    const montoPorCuota = Number((total / cantidadCuotas).toFixed(2));

    let cobro = await Cobro.findOne({ where: { id_turno, activo: true } });

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
    }

    const fechaBase = new Date(fecha_primer_vencimiento || Date.now());
    for (let i = 1; i <= cantidadCuotas; i++) {
      let fechaVenc = new Date(fechaBase);
      fechaVenc.setMonth(fechaVenc.getMonth() + (i - 1));

      await Cuota.create({
        id_cobro: cobro.id_cobro,
        nro_cuota: i,
        monto_cuota: montoPorCuota,
        monto_cobrado: 0,
        fecha_vencimiento: fechaVenc.toISOString().split("T")[0],
        estado: "Pendiente",
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
    }

    if (entrega > 0) {
      const estadoCuota = entrega >= total ? "Pagada" : "Parcialmente pagada";
      await Cuota.create({
        id_cobro: cobro.id_cobro,
        nro_cuota: 1,
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