/** @format */

import { Op } from "sequelize";
import { Cobro, Gasto, Cuota, Paciente, CategoriaGasto } from "../models/index.model.js";

/**
 * Obtiene de forma unificada y paginada los cobros y los gastos para la gestión de caja.
 */
export const getCajaConsolidada = async (req, res) => {
  try {
    // ─── PARÁMETROS DE PAGINACIÓN Y BÚSQUEDA PARA COBROS ───
    const pageCobro = parseInt(req.query.pageCobro) || 1;
    const limitCobro = parseInt(req.query.limitCobro) || 10;
    const offsetCobro = (pageCobro - 1) * limitCobro;
    const searchCobro = req.query.searchCobro || "";

    // ─── PARÁMETROS DE PAGINACIÓN Y BÚSQUEDA PARA GASTOS ───
    const pageGasto = parseInt(req.query.pageGasto) || 1;
    const limitGasto = parseInt(req.query.limitGasto) || 10;
    const offsetGasto = (pageGasto - 1) * limitGasto;
    const searchGasto = req.query.searchGasto || "";

    // ─── FILTROS (WHERE) PARA COBROS ───
    let whereCobro = { activo: true };
    if (searchCobro.trim() !== "") {
      whereCobro[Op.or] = [
        { "$Paciente.nombre$": { [Op.like]: `%${searchCobro}%` } },
        { "$Paciente.apellido$": { [Op.like]: `%${searchCobro}%` } },
        { "$Paciente.dni$": { [Op.like]: `%${searchCobro}%` } },
      ];
    }

    // ─── FILTROS (WHERE) PARA GASTOS ───
    let whereGasto = { activo: true }; // Ajusta si tu modelo Gasto no usa la propiedad activo
    if (searchGasto.trim() !== "") {
      whereGasto[Op.or] = [
        { concepto: { [Op.like]: `%${searchGasto}%` } },
        { comprobante: { [Op.like]: `%${searchGasto}%` } },
        { "$CategoriaGasto.nombre$": { [Op.like]: `%${searchGasto}%` } },
      ];
    }

    // ─── EJECUCIÓN EN PARALELO DE AMBAS CONSULTAS ───
    const [resultadoCobros, resultadoGastos] = await Promise.all([
      Cobro.findAndCountAll({
        where: whereCobro,
        limit: limitCobro,
        offset: offsetCobro,
        order: [["fecha_emision", "DESC"]],
        include: [
          {
            model: Paciente,
            attributes: ["nombre", "apellido", "dni", "telefono"],
          },
          {
            model: Cuota,
            attributes: ["id_cuota", "monto_cobrado", "monto_cuota", "estado", "metodo_pago"],
          },
        ],
      }),
      Gasto.findAndCountAll({
        where: whereGasto,
        limit: limitGasto,
        offset: offsetGasto,
        order: [["fecha_gasto", "DESC"]],
        include: [
          {
            model: CategoriaGasto,
            as: "CategoriaGasto",
            attributes: ["nombre"],
          },
        ],
      }),
    ]);

    const totalPagesCobro = Math.ceil(resultadoCobros.count / limitCobro);
    const totalPagesGasto = Math.ceil(resultadoGastos.count / limitGasto);

    // ─── RESPUESTA CON LA ESTRUCTURA SOLICITADA ───
    res.status(200).json({
      status: "success",
      data: {
        cobros: resultadoCobros.rows,
        gastos: resultadoGastos.rows,
      },
      meta: {
        cobros: {
          total: resultadoCobros.count,
          page: pageCobro,
          limit: limitCobro,
          totalPages: totalPagesCobro,
          hasNextPage: pageCobro < totalPagesCobro,
          hasPrevPage: pageCobro > 1,
        },
        gastos: {
          total: resultadoGastos.count,
          page: pageGasto,
          limit: limitGasto,
          totalPages: totalPagesGasto,
          hasNextPage: pageGasto < totalPagesGasto,
          hasPrevPage: pageGasto > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener los datos consolidados de caja:", error);
    res.status(500).json({ error: "Error interno al obtener los datos de la caja" });
  }
};
