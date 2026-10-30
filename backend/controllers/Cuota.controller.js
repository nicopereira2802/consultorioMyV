/** @format */

import { Cuota, Cobro } from "../models/index.model.js";

// Obtener una Cuota por cobro ID
export const getCuotaByCobroId = async (req, res) => {
  try {
    const id_cobro = req.cobro.id_cobro;

    const cuotas = await Cuota.findAll({
      where: { id_cobro: id_cobro, activo: true },
      order: [["nro_cuota", "ASC"]],
    });

    res.status(200).json({
      status: "success",
      data: cuotas,
    });
  } catch (error) {
    console.error("Error al obtener las cuota del cobro:", error);
    res.status(500).json({ error: "Error al obtener la cuota del cobro" });
  }
};

// Obtener una Cuota por su ID
export const getCuotaById = async (req, res) => {
  try {
    const cuota = req.cuota;

    res.status(200).json({
      status: "success",
      data: cuota,
    });
  } catch (error) {
    console.error("Error al obtener la cuota:", error);
    res.status(500).json({ error: "Error al obtener la cuota" });
  }
};

// En Cuota.controller.js (Función createCuota)
export const createCuota = async (req, res) => {
  try {
    const { monto_cuota, monto_cobrado, fecha_vencimiento, fecha_cobro, metodo_pago, estado } = req.body;
    const id_cobro = req.cobro.id_cobro;

    const cantCuotas = await Cuota.count({ where: { id_cobro: id_cobro } });
    const cobrado = Number(monto_cobrado) || 0;
    const cuotaMonto = Number(monto_cuota) || cobrado;

    let estadoCalculado = estado;
    if (!estadoCalculado) {
      if (cobrado >= cuotaMonto && cuotaMonto > 0) estadoCalculado = "Pagada";
      else if (cobrado > 0) estadoCalculado = "Parcialmente pagada";
      else estadoCalculado = "Pendiente";
    }

    const newCuota = await Cuota.create({
      id_cobro: id_cobro,
      nro_cuota: cantCuotas + 1,
      monto_cuota: cuotaMonto,
      monto_cobrado: cobrado,
      fecha_vencimiento: fecha_vencimiento || new Date().toISOString().split("T")[0],
      fecha_cobro: fecha_cobro || (cobrado > 0 ? new Date() : null),
      metodo_pago: metodo_pago || (cobrado > 0 ? "Efectivo" : null),
      estado: estadoCalculado,
    });

    res.status(201).json({
      status: "success",
      data: newCuota,
    });
  } catch (error) {
    console.error("Error al crear la cuota:", error);
    res.status(500).json({ error: "Error al crear la cuota" });
  }
};

// Actualizar una cuota existente
export const updateCuota = async (req, res) => {
  try {
    const { id_cobro, monto_cuota, monto_cobrado, fecha_vencimiento, fecha_cobro, metodo_pago, estado } = req.body;

    const cuota = req.cuota;

    if (id_cobro) {
      const cobro = await Cobro.findByPk(id_cobro);

      if (!cobro) {
        return res.status(400).json({
          status: "error",
          message: "El cobro seleccionado no existe.",
        });
      }
    }

    await cuota.update({
      id_cobro: id_cobro || cuota.id_cobro,
      monto_cuota: monto_cuota !== undefined ? monto_cuota : cuota.monto_cuota,
      monto_cobrado: monto_cobrado !== undefined ? monto_cobrado : cuota.monto_cobrado,
      fecha_vencimiento: fecha_vencimiento || cuota.fecha_vencimiento,
      fecha_cobro: fecha_cobro !== undefined ? fecha_cobro : cuota.fecha_cobro,
      metodo_pago: metodo_pago || cuota.metodo_pago,
      estado: estado || cuota.estado,
    });

    res.status(200).json({
      status: "success",
      data: cuota,
    });
  } catch (error) {
    console.error("Error al actualizar la cuota:", error);
    res.status(500).json({ error: "Error al actualizar la cuota" });
  }
};

// Eliminar una cuota existente
export const deleteCuota = async (req, res) => {
  try {
    const cuota = req.cuota;

    await cuota.update({
      activo: false,
    });

    res.status(200).json({ status: "success", message: "Cuota eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la cuota:", error);
    res.status(500).json({ error: "Error al eliminar la cuota" });
  }
};

// Cobrar una cuota existente
export const cobrarCuota = async (req, res) => {
  try {
    const { monto_cobrado, fecha_cobro, metodo_pago } = req.body;
    const cuota = req.cuota;

    const monto_cuota = parseFloat(cuota.monto_cuota);
    const cobrado = parseFloat(monto_cobrado);

    let estado;
    if (cobrado >= monto_cuota) {
      estado = "Pagada";
    } else if (cobrado > 0) {
      estado = "Parcialmente pagada";
    } else {
      estado = "Pendiente";
    }

    await cuota.update({
      monto_cobrado: cobrado,
      fecha_cobro: fecha_cobro ? new Date(fecha_cobro) : new Date(),
      metodo_pago: metodo_pago || "Efectivo",
      estado: estado,
    });

    return res.status(200).json({
      status: "success",
      data: cuota,
    });
  } catch (error) {
    console.error("Error al cobrar la cuota:", error);
    return res.status(500).json({ error: "Error al cobrar la cuota" });
  }
};
