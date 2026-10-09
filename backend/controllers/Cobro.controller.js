/** @format */

import sequelize from "../config/database.js";
import { Cobro, Cuota, Paciente, Turno } from "../models/index.model.js";

// Obtener una cobro por turno ID
export const getCobroByTurnoId = async (req, res) => {
  try {
    const id_turno = req.turno.id_turno;

    const cobro = await Cobro.findAll({ where: { id_turno: id_turno } });

    res.status(200).json({
      status: "success",
      data: cobro,
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

    if (id_turno || id_paciente) {
      const turno = await Turno.findByPk(id_turno);
      const paciente = await Paciente.findByPk(id_paciente);

      if (!turno || !paciente) {
        res.status(400).json({
          status: "error",
          message: "El paciente o el turno seleccionado no existe.",
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

// Eliminar una cobro existente
export const deleteCobro = async (req, res) => {
  try {
    const cobro = req.cobro;

    await cobro.update({
      activo: false,
    });

    res
      .status(200)
      .json({ status: "success", message: "Cobro eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el cobro:", error);
    res.status(500).json({ error: "Error al eliminar el cobro" });
  }
};

// Crear un plan de pago atómico (Cobro cabecera + Cuotas detalladas)
export const crearPlanPago = async (req, res) => {
  try {
    const {
      id_turno,
      id_paciente,
      monto_total,
      cant_cuotas = 1,
      primer_vencimiento,
      intervalo_dias = 30,
      pago_inmediato = false,
      metodo_pago = null,
    } = req.body;

    const turnoId = req.turno?.id_turno || id_turno;
    const pacienteId = req.paciente?.id_paciente || id_paciente;

    const result = await sequelize.transaction(async (t) => {
      // 1. Crear el registro cabecera en Cobro
      const nuevoCobro = await Cobro.create(
        {
          id_turno: turnoId,
          id_paciente: pacienteId,
          monto_a_cobrar: monto_total,
          cant_cuotas: cant_cuotas,
          activo: true,
        },
        { transaction: t }
      );

      // 2. Calcular el monto base por cuota y distribuir centavos en la última cuota
      const totalNum = Number(monto_total);
      const cantNum = Number(cant_cuotas) || 1;
      const montoBase = Math.floor((totalNum / cantNum) * 100) / 100;
      const sumaBase = Math.round(montoBase * cantNum * 100) / 100;
      const diferencia = Math.round((totalNum - sumaBase) * 100) / 100;

      // 3. Generar las cuotas en un bucle
      const cuotasCreadas = [];
      const baseDate = new Date(`${primer_vencimiento}T00:00:00Z`);

      for (let i = 0; i < cantNum; i++) {
        // En la última cuota sumamos la diferencia para que la suma sea idéntica al monto_total
        const montoCuota =
          i === cantNum - 1
            ? Math.round((montoBase + diferencia) * 100) / 100
            : montoBase;

        const cuotaDate = new Date(
          baseDate.getTime() + i * (Number(intervalo_dias) || 30) * 86400000
        );
        const fechaVencimientoStr = cuotaDate.toISOString().slice(0, 10);

        const esPagoInmediato = i === 0 && Boolean(pago_inmediato);

        const nuevaCuota = await Cuota.create(
          {
            id_cobro: nuevoCobro.id_cobro,
            nro_cuota: i + 1,
            monto_cuota: montoCuota,
            monto_cobrado: esPagoInmediato ? montoCuota : 0,
            fecha_vencimiento: fechaVencimientoStr,
            fecha_cobro: esPagoInmediato ? new Date() : null,
            metodo_pago: esPagoInmediato ? (metodo_pago || "Efectivo") : null,
            estado: esPagoInmediato ? "Pagada" : "Pendiente",
            activo: true,
          },
          { transaction: t }
        );

        cuotasCreadas.push(nuevaCuota);
      }

      return {
        cobro: nuevoCobro,
        cuotas: cuotasCreadas,
      };
    });

    res.status(201).json({
      status: "success",
      message: "Plan de pago generado exitosamente",
      data: result,
    });
  } catch (error) {
    console.error("Error al crear el plan de pago:", error);
    res.status(500).json({
      status: "error",
      message: "Error interno al crear el plan de pago.",
      error: error.message,
    });
  }
};

