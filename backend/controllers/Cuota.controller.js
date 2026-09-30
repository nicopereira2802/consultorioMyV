/** @format */

import { Cuota, Cobro } from "../models/index.model.js";
import { validarEntidadUpdate } from "../validations/validarEntidadUpdate.validation.js";

// Obtener una Cuota por cobro ID
export const getCuotaByCobroId = async (req, res) => {
  try {
    const id_cobro = req.cobro.id_cobro;

    const cuotas = await Cuota.findAll({ where: { id_cobro: id_cobro } });

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

// Crear una nueva cuota
export const createCuota = async (req, res) => {
  try {
    const { monto_cuota, fecha_vencimiento } = req.body;
    const id_cobro = req.cobro.id_cobro;

    const cantCuotas = await Cuota.count({ where: { id_cobro: id_cobro } });

    const newCuota = await Cuota.create({
      id_cobro: id_cobro,
      nro_cuota: cantCuotas + 1,
      monto_cuota: monto_cuota,
      monto_cobrado: 0,
      fecha_vencimiento: fecha_vencimiento,
      fecha_cobro: null,
      metodo_pago: null,
      estado: "Pendiente",
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
    const {
      id_cobro,
      monto_cuota,
      monto_cobrado,
      fecha_vencimiento,
      fecha_cobro,
      metodo_pago,
    } = req.body;

    const cuota = req.cuota;

    if (id_cobro) {
      const cobro = validarEntidadUpdate(Cobro, id_cobro);

      if (!cobro) {
        res.status(400).json({
          status: "error",
          message: "El cobro seleccionado no existe.",
        });
      }
    }

    await cuota.update({
      id_cobro: id_cobro || cuota.id_cobro,
      monto_cuota: monto_cuota || cuota.monto_cuota,
      monto_cobrado: monto_cobrado || cuota.monto_cobrado,
      fecha_vencimiento: fecha_vencimiento || cuota.fecha_vencimiento,
      fecha_cobro: fecha_cobro || cuota.fecha_cobro,
      metodo_pago: metodo_pago || cuota.metodo_pago,
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

    res.status(200).json({ message: "Cuota eliminada correctamente" });
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

    let estado;

    if (monto_cobrado < cuota.monto_cuota) {
      estado = "Parcialmente pagada";
    } else if ((monto_cobrado = cuota.monto_cuota)) {
      estado = "Pagada";
    } else {
      res.status(400).json({
        status: "error",
        message: "El monto cobrado es mayor al monto de la cuota.",
      });
    }

    await cuota.update({
      monto_cobrado: monto_cobrado,
      fecha_cobro: fecha_cobro,
      metodo_pago: metodo_pago,
      esatdo: estado,
    });

    res.status(200).json({
      status: "success",
      data: cuota,
    });
  } catch (error) {
    console.error("Error al cobrar la cuota:", error);
    res.status(500).json({ error: "Error al cobrar la cuota" });
  }
};
