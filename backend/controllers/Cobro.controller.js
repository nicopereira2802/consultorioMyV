/** @format */

import { Cobro, Paciente, Turno, Cuota } from "../models/index.model.js";

// Obtener una cobro por turno ID
export const getAllCobros = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const sortField = req.query.sortField || "fecha_emision";
    const sortOrder = req.query.sortOrder || "ASC";
    const where = {
      activo: true,
    };

    // Busqueda por nombre apellido dni telefono
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
          attributes: ["fecha_hora_inicio", "fecha_hora_fin"],
        },
        {
          model: Paciente,
          attributes: ["nombre", "apellido", "dni", "telefono"],
        },
        {
          model: Cuota,
          attributes: ["id_cuota", "monto_cuota", "monto_cobrado", "estado", "fecha_cobro"],
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
    console.error("Error al obtener el cobro del turno:", error);
    res.status(500).json({ error: "Error al obtener el cobro del turno" });
  }
};

// Obtener una cobro por su ID
export const getCobroById = async (req, res) => {
  try {
    const cobro = req.cobro;

    res.status(200).json({
      status: "success",
      data: cobro,
    });
  } catch (error) {
    console.error("Error al obtener el cobro:", error);
    res.status(500).json({ error: "Error al obtener el cobro" });
  }
};

// Crear una nueva cobro
export const createCobro = async (req, res) => {
  try {
    const { monto_a_cobrar, cant_cuotas } = req.body;

    const id_turno = req.turno.id_turno;
    const id_paciente = req.paciente.id_paciente;

    const turnoExiste = await Cobro.findOne({ where: { id_turno: id_turno } });
    if (turnoExiste) {
      res.status(409).json({
        status: "error",
        message: "Este turno ya tiene un cobro",
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

// Actualizar una cobro existente
export const updateCobro = async (req, res) => {
  try {
    const { id_turno, id_paciente, monto_a_cobrar, cant_cuotas } = req.body;

    const cobro = req.cobro;

    if (id_turno) {
      const turno = await Turno.findByPk(id_turno);

      if (!turno) {
        res.status(400).json({
          status: "error",
          message: "El turno seleccionado no existe.",
        });
      }
    }

    if (id_paciente) {
      const paciente = await Paciente.findByPk(id_paciente);

      if (!paciente) {
        res.status(400).json({
          status: "error",
          message: "El paciente seleccionado no existe.",
        });
      }
    }

    await cobro.update({
      id_turno: id_turno || cobro.id_turno,
      id_paciente: id_paciente || cobro.id_paciente,
      monto_a_cobrar: monto_a_cobrar || cobro.monto_a_cobrar,
      cant_cuotas: cant_cuotas || cobro.cant_cuotas,
    });

    res.status(200).json({
      status: "success",
      data: cobro,
    });
  } catch (error) {
    console.error("Error al actualizar el cobro:", error);
    res.status(500).json({ error: "Error al actualizar el cobro" });
  }
};

// ==========================================
// 1. COBRO INMEDIATO (Pago Total en 1 cuota)
// ==========================================
export const createCobroInmediato = async (req, res) => {
  try {
    const { monto_a_cobrar, metodo_pago } = req.body;
    const id_turno = req.turno.id_turno;
    const id_paciente = req.paciente.id_paciente;

    const turnoExiste = await Cobro.findOne({ where: { id_turno, activo: true } });
    if (turnoExiste) {
      return res.status(409).json({
        status: "error",
        message: "Este turno ya tiene un cobro registrado.",
      });
    }

    // Creamos el cobro con 1 sola cuota
    const newCobro = await Cobro.create({
      id_turno,
      id_paciente,
      monto_a_cobrar: Number(monto_a_cobrar),
      cant_cuotas: 1,
    });

    // Creamos y asentamos automáticamente la cuota como pagada en el acto
    await Cuota.create({
      id_cobro: newCobro.id_cobro,
      nro_cuota: 1,
      monto_cuota: Number(monto_a_cobrar),
      monto_cobrado: Number(monto_a_cobrar),
      fecha_vencimiento: new Date().toISOString().split("T")[0],
      fecha_cobro: new Date(),
      metodo_pago: metodo_pago || "Efectivo",
      estado: "Pagada",
    });

    return res.status(201).json({
      status: "success",
      data: newCobro,
      message: "Cobro inmediato registrado correctamente.",
    });
  } catch (error) {
    console.error("Error al crear cobro inmediato:", error);
    return res.status(500).json({ error: "Error al procesar el cobro inmediato." });
  }
};

// ==========================================
// 2. PLAN DE CUOTAS FIJAS (Distribución automática)
// ==========================================
export const createCobroCuotas = async (req, res) => {
  try {
    const { monto_a_cobrar, cant_cuotas, fecha_primer_vencimiento } = req.body;
    const id_turno = req.turno.id_turno;
    const id_paciente = req.paciente.id_paciente;

    const turnoExiste = await Cobro.findOne({ where: { id_turno, activo: true } });
    if (turnoExiste) {
      return res.status(409).json({
        status: "error",
        message: "Este turno ya tiene un cobro registrado.",
      });
    }

    const total = Number(monto_a_cobrar);
    const cantidadCuotas = Number(cant_cuotas) || 1;
    const montoPorCuota = Number((total / cantidadCuotas).toFixed(2));

    const newCobro = await Cobro.create({
      id_turno,
      id_paciente,
      monto_a_cobrar: total,
      cant_cuotas: cantidadCuotas,
    });

    // Generamos las n cuotas con sus respectivos vencimientos mensuales
    const fechaBase = new Date(fecha_primer_vencimiento || Date.now());

    for (let i = 1; i <= cantidadCuotas; i++) {
      let fechaVenc = new Date(fechaBase);
      fechaVenc.setMonth(fechaVenc.getMonth() + (i - 1));

      await Cuota.create({
        id_cobro: newCobro.id_cobro,
        nro_cuota: i,
        monto_cuota: montoPorCuota,
        monto_cobrado: 0,
        fecha_vencimiento: fechaVenc.toISOString().split("T")[0],
        estado: "Pendiente",
      });
    }

    return res.status(201).json({
      status: "success",
      data: newCobro,
      message: "Plan de cuotas fijas creado correctamente.",
    });
  } catch (error) {
    console.error("Error al crear plan de cuotas:", error);
    return res.status(500).json({ error: "Error al procesar el plan de cuotas." });
  }
};

// ==========================================
// 3. ACUERDO INFORMAL / LIBRE (Con o sin entrega inicial)
// ==========================================
export const createCobroInformal = async (req, res) => {
  try {
    const { monto_a_cobrar, entrega_inicial, metodo_pago } = req.body;
    const id_turno = req.turno.id_turno;
    const id_paciente = req.paciente.id_paciente;

    const turnoExiste = await Cobro.findOne({ where: { id_turno, activo: true } });
    if (turnoExiste) {
      return res.status(409).json({
        status: "error",
        message: "Este turno ya tiene un cobro registrado.",
      });
    }

    const total = Number(monto_a_cobrar);
    const entrega = Number(entrega_inicial) || 0;

    const newCobro = await Cobro.create({
      id_turno,
      id_paciente,
      monto_a_cobrar: total,
      cant_cuotas: 1, // Se maneja como libre a cuenta
    });

    // Si hay una entrega inicial, la registramos como un pago parcial o total inicial
    if (entrega > 0) {
      const estadoCuota = entrega >= total ? "Pagada" : "Parcialmente pagada";
      await Cuota.create({
        id_cobro: newCobro.id_cobro,
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
      data: newCobro,
      message: "Acuerdo informal registrado correctamente.",
    });
  } catch (error) {
    console.error("Error al registrar acuerdo informal:", error);
    return res.status(500).json({ error: "Error al registrar el acuerdo informal." });
  }
};

// Eliminar una cobro existente
export const deleteCobro = async (req, res) => {
  try {
    const cobro = req.cobro;

    await cobro.update({
      activo: false,
    });

    res.status(200).json({ status: "success", message: "Cobro eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el cobro:", error);
    res.status(500).json({ error: "Error al eliminar el cobro" });
  }
};
