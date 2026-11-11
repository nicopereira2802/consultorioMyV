/** @format */

import { Gasto, CategoriaGasto } from "../models/index.model.js";
import { Op } from "sequelize";

// Obtener todos los gastos con paginación y búsqueda
export const getAllGastos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const categoria = req.query.categoria || "";
    const sortField = req.query.sortField || "fecha_gasto";
    const sortOrder = req.query.sortOrder || "DESC";

    const where = {
      activo: true,
    };

    // Búsqueda por concepto, comprobante o notas
    if (search.trim() !== "") {
      where[Op.or] = [
        { concepto: { [Op.like]: `%${search}%` } },
        { comprobante: { [Op.like]: `%${search}%` } },
        { notas: { [Op.like]: `%${search}%` } },
      ];
    }

    if (categoria) {
      where.id_categoria_gasto = categoria;
    }

    const { count, rows: gastos } = await Gasto.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, sortOrder]],
      include: [
        {
          model: CategoriaGasto,
          as: "CategoriaGasto",
          attributes: ["id_categoria_gasto", "nombre"],
        },
      ],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      data: gastos,
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
    console.error("Error al obtener los gastos:", error);
    res.status(500).json({
      status: "error",
      message: "Error al obtener los gastos",
      error: error.message,
    });
  }
};

// Obtener un gasto por su ID
export const getGastoById = async (req, res) => {
  try {
    const gasto = req.gasto; // Inyectado por el middleware validarExistencia

    res.status(200).json({
      status: "success",
      data: gasto,
    });
  } catch (error) {
    console.error("Error al obtener el gasto:", error);
    res.status(500).json({ error: "Error al obtener el gasto" });
  }
};

// Crear un nuevo gasto
export const createGasto = async (req, res) => {
  try {
    const { id_categoria_gasto, monto, concepto, fecha_gasto, metodo_pago, comprobante, notas } = req.body;

    const newGasto = await Gasto.create({
      id_categoria_gasto,
      monto,
      concepto,
      fecha_gasto: fecha_gasto || new Date(),
      metodo_pago: metodo_pago || "Efectivo",
      comprobante,
      notas,
    });

    res.status(201).json({
      status: "success",
      data: newGasto,
    });
  } catch (error) {
    console.error("Error al crear el gasto:", error);
    res.status(500).json({ error: "Error al crear el gasto" });
  }
};

// Actualizar un gasto existente
export const updateGasto = async (req, res) => {
  try {
    const { id_categoria_gasto, monto, concepto, fecha_gasto, metodo_pago, comprobante, notas } = req.body;
    const gasto = req.gasto; // Inyectado por el middleware

    await gasto.update({
      id_categoria_gasto: id_categoria_gasto || gasto.id_categoria_gasto,
      monto: monto !== undefined ? monto : gasto.monto,
      concepto: concepto || gasto.concepto,
      fecha_gasto: fecha_gasto || gasto.fecha_gasto,
      metodo_pago: metodo_pago || gasto.metodo_pago,
      comprobante: comprobante !== undefined ? comprobante : gasto.comprobante,
      notas: notas !== undefined ? notas : gasto.notas,
    });

    res.status(200).json({
      status: "success",
      data: gasto,
    });
  } catch (error) {
    console.error("Error al actualizar el gasto:", error);
    res.status(500).json({ error: "Error al actualizar el gasto" });
  }
};

// Baja lógica de un gasto
export const deleteGasto = async (req, res) => {
  try {
    const gasto = req.gasto;

    await gasto.update({
      activo: !gasto.activo,
    });

    res.status(200).json({ message: "Gasto actualizado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el gasto:", error);
    res.status(500).json({ error: "Error al eliminar el gasto" });
  }
};
