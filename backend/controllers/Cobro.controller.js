/** @format */

import sequelize from "../config/database.js";
import { Cobro, Cuota, Paciente, Turno, Practica } from "../models/index.model.js";

// Obtener todos los cobros con paciente, turno, prácticas y cuotas
export const getAllCobros = async (req, res) => {
  try {
    const cobros = await Cobro.findAll({
      where: { activo: true },
      include: [
        {
          model: Paciente,
          attributes: ["id_paciente", "nombre", "apellido", "dni"],
        },
        {
          model: Turno,
          attributes: [
            "id_turno",
            "notas_consulta",
            "fecha_hora_inicio",
          ],
          include: [
            {
              model: Practica,
              attributes: [
                "id_practica",
                "nombre_referencia",
                "nombre_nomenclador",
              ],
              through: { attributes: [] },
              required: false,
            },
          ],
          required: false,
        },
        {
          model: Cuota,
          attributes: [
            "id_cuota",
            "nro_cuota",
            "monto_cuota",
            "monto_cobrado",
            "metodo_pago",
            "estado",
            "fecha_cobro",
            "fecha_vencimiento",
          ],
          required: false,
        },
      ],
      order: [["fecha_emision", "DESC"]],
    });

    res.status(200).json({
      status: "success",
      data: cobros,
    });
  } catch (error) {
    console.error("Error al obtener los cobros:", error);
    res.status(500).json({ error: "Error al obtener los cobros" });
  }
};

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

// Obtener un cobro por su ID con paciente, turno y cuotas
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
          attributes: [
            "id_turno",
            "notas_consulta",
            "fecha_hora_inicio",
          ],
          include: [
            {
              model: Practica,
              attributes: [
                "id_practica",
                "nombre_referencia",
                "nombre_nomenclador",
              ],
              through: { attributes: [] },
              required: false,
            },
          ],
          required: false,
        },
        {
          model: Cuota,
          attributes: [
            "id_cuota",
            "nro_cuota",
            "monto_cuota",
            "monto_cobrado",
            "metodo_pago",
            "estado",
            "fecha_cobro",
            "fecha_vencimiento",
          ],
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

    const turnoId = req.turno?.id_turno || (id_turno ? Number(id_turno) : null);
    const pacienteId = req.paciente?.id_paciente || Number(id_paciente);

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

// ==========================================================
// CUENTAS DE PACIENTES & SALDOS CORRIENTES
// ==========================================================

// Helper para normalizar metodo_pago al ENUM oficial de Cuota
const normalizarMetodoPagoEnum = (raw) => {
  if (!raw) return "Efectivo";
  const s = String(raw).toLowerCase().trim();
  if (s.includes("transf")) return "Transferencia";
  if (s.includes("tarj") || s.includes("deb") || s.includes("cred")) return "Tarjeta";
  if (s.includes("efect")) return "Efectivo";
  return "Otro";
};

// 1. GET /api/cobros/pacientes - Listado Maestro de Saldos por Paciente
export const getSaldosPacientes = async (req, res) => {
  try {
    const pacientes = await Paciente.findAll({
      where: { activo: true },
      include: [
        {
          model: Cobro,
          where: { activo: true },
          required: false,
        },
      ],
      order: [
        ["apellido", "ASC"],
        ["nombre", "ASC"],
      ],
    });

    const allCobros = pacientes.flatMap((p) => p.Cobros || []);
    const idCobros = allCobros.map((c) => c.id_cobro);
    const todasLasCuotas =
      idCobros.length > 0
        ? await Cuota.findAll({
            where: {
              id_cobro: idCobros,
              activo: true,
            },
          })
        : [];

    const cuotasPorCobro = new Map();
    todasLasCuotas.forEach((cuota) => {
      if (!cuotasPorCobro.has(cuota.id_cobro)) {
        cuotasPorCobro.set(cuota.id_cobro, []);
      }
      cuotasPorCobro.get(cuota.id_cobro).push(cuota);
    });

    const saldos = pacientes.map((p) => {
      const cobros = p.Cobros || [];
      const costo_acordado = cobros.reduce(
        (sum, c) => sum + (Number(c.monto_a_cobrar) || 0),
        0
      );

      let total_pagado = 0;
      let cobros_registrados = 0;
      let ultimo_pago = null;

      cobros.forEach((c) => {
        const cuotas = cuotasPorCobro.get(c.id_cobro) || [];
        cuotas.forEach((cuota) => {
          if (
            cuota.activo !== false &&
            cuota.estado &&
            cuota.estado.toLowerCase() === "pagada"
          ) {
            const montoCobrado = Number(cuota.monto_cobrado ?? cuota.monto_cuota ?? 0);
            total_pagado += montoCobrado;
            cobros_registrados += 1;
            if (cuota.fecha_cobro) {
              const f = new Date(cuota.fecha_cobro);
              if (!ultimo_pago || f > new Date(ultimo_pago)) {
                ultimo_pago = cuota.fecha_cobro;
              }
            }
          }
        });
      });

      const costoAcordadoRedondeado = Math.round(costo_acordado * 100) / 100;
      const totalPagadoRedondeado = Math.round(total_pagado * 100) / 100;
      const saldo_pendiente = Math.max(
        0,
        Math.round((costoAcordadoRedondeado - totalPagadoRedondeado) * 100) / 100
      );

      const estado_cuenta = saldo_pendiente <= 0 ? "AL_DIA" : "CON_DEUDA";

      return {
        id_paciente: p.id_paciente,
        nombre: p.nombre,
        apellido: p.apellido,
        nombre_completo: p.apellido && p.nombre ? `${p.apellido}, ${p.nombre}` : (p.nombre || "Paciente"),
        dni: p.dni,
        telefono: p.telefono,
        costo_acordado: costoAcordadoRedondeado,
        total_pagado: totalPagadoRedondeado,
        saldo_pendiente: saldo_pendiente,
        estado_cuenta: estado_cuenta,
        cobros_registrados: cobros_registrados,
        cantidad_acuerdos: cobros.length,
        ultimo_pago: ultimo_pago,
      };
    });

    res.status(200).json({
      status: "success",
      data: saldos,
    });
  } catch (error) {
    console.error("Error al obtener saldos de pacientes:", error);
    res.status(500).json({
      status: "error",
      error: "Error al obtener saldos de pacientes",
      message: error.message,
    });
  }
};

// 2. GET /api/cobros/pacientes/:id_paciente/cuenta - Detalle de cuenta del paciente
export const getCuentaPaciente = async (req, res) => {
  try {
    const id_paciente = req.params.id_paciente || req.paciente?.id_paciente;

    const paciente = await Paciente.findByPk(id_paciente);
    if (!paciente) {
      return res.status(404).json({
        status: "error",
        error: "Paciente no encontrado",
        message: "Paciente no encontrado",
      });
    }

    const cobros = await Cobro.findAll({
      where: {
        id_paciente: id_paciente,
        activo: true,
      },
      include: [
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
          required: false,
          attributes: [
            "id_cuota",
            "nro_cuota",
            "monto_cuota",
            "monto_cobrado",
            "metodo_pago",
            "estado",
            "fecha_cobro",
            "fecha_vencimiento",
            "activo",
          ],
        },
      ],
      order: [["fecha_emision", "DESC"]],
    });

    const idCobros = cobros.map((c) => c.id_cobro);
    const todasLasCuotas =
      idCobros.length > 0
        ? await Cuota.findAll({
            where: {
              id_cobro: idCobros,
              activo: true,
            },
          })
        : [];

    let totalCostoAcordado = 0;
    let totalPagadoGlobal = 0;
    let cobrosRegistradosGlobal = 0;

    // Consultar turnos atendidos del paciente (id_estado = 4) con sus prácticas reales
    const turnosAtendidos = await Turno.findAll({
      where: {
        id_paciente: id_paciente,
        id_estado: 4, // Atendido
      },
      include: [
        {
          model: Practica,
          attributes: [
            "id_practica",
            "nombre_nomenclador",
            "nombre_referencia",
            "precio_referencia",
          ],
          through: { attributes: [] },
          required: false,
        },
      ],
      order: [["fecha_hora_inicio", "DESC"]],
    });

    const turnosAtendidosFormateados = turnosAtendidos.map((t) => {
      const practicas = t.Practicas || [];
      const nombrePractica =
        practicas
          .map((p) => p.nombre_referencia || p.nombre_nomenclador)
          .filter(Boolean)
          .join(", ") || t.notas_consulta || `Consulta Turno #${t.id_turno}`;

      const totalPracticas = practicas.reduce(
        (sum, p) => sum + (Number(p.precio_referencia) || 0),
        0
      );

      return {
        id_turno: t.id_turno,
        fecha_hora_inicio: t.fecha_hora_inicio,
        practica: nombrePractica,
        practicas: practicas,
        costo: Number(t.precio_final) || totalPracticas,
        notas_consulta: t.notas_consulta,
      };
    });

    const acuerdos = cobros.map((cobro) => {
      const montoAcordado = Number(cobro.monto_a_cobrar) || 0;
      totalCostoAcordado += montoAcordado;

      const cuotas = todasLasCuotas.filter((c) => c.id_cobro === cobro.id_cobro);
      const entregas = [];
      let pagadoAcuerdo = 0;

      // Ordenar cuotas por nro_cuota ascendente
      const cuotasOrdenadas = [...cuotas].sort(
        (a, b) => (Number(a.nro_cuota) || 0) - (Number(b.nro_cuota) || 0)
      );

      cuotasOrdenadas.forEach((cuota) => {
        if (
          cuota.estado &&
          cuota.estado.toLowerCase() === "pagada"
        ) {
          const montoCobrado = Number(cuota.monto_cobrado ?? cuota.monto_cuota ?? 0);
          pagadoAcuerdo += montoCobrado;
          totalPagadoGlobal += montoCobrado;
          cobrosRegistradosGlobal += 1;
          entregas.push(cuota);
        }
      });

      const montoAcordadoRedondeado = Math.round(montoAcordado * 100) / 100;
      const pagadoRedondeado = Math.round(pagadoAcuerdo * 100) / 100;
      const saldoPendienteAcuerdo = Math.max(
        0,
        Math.round((montoAcordadoRedondeado - pagadoRedondeado) * 100) / 100
      );

      const porcentajeCubierto =
        montoAcordadoRedondeado > 0
          ? Math.min(100, Math.round((pagadoRedondeado / montoAcordadoRedondeado) * 1000) / 10)
          : 100;

      // Nombre del tratamiento real desde BD (relación con Turno o Práctica)
      let nombreTratamiento = "Acuerdo General de Tratamiento";
      const turno = cobro.Turno;
      if (turno) {
        if (turno.Practicas && turno.Practicas.length > 0) {
          nombreTratamiento = turno.Practicas
            .map((p) => p.nombre_referencia || p.nombre_nomenclador)
            .filter(Boolean)
            .join(", ");
        } else if (turno.notas_consulta) {
          nombreTratamiento = turno.notas_consulta;
        } else {
          nombreTratamiento = `Atención Turno #${turno.id_turno}`;
        }
      }

      const tipoAcuerdo =
        Number(cobro.cant_cuotas) === 0
          ? "Cuotas informales"
          : `Plan de ${cobro.cant_cuotas} cuotas`;

      return {
        id_cobro: cobro.id_cobro,
        id_turno: cobro.id_turno,
        tratamiento: nombreTratamiento,
        costo_acordado: montoAcordadoRedondeado,
        monto_a_cobrar: montoAcordadoRedondeado,
        pagado: pagadoRedondeado,
        saldo_pendiente: saldoPendienteAcuerdo,
        porcentaje_cubierto: porcentajeCubierto,
        tipo_acuerdo: tipoAcuerdo,
        cant_cuotas: Number(cobro.cant_cuotas),
        es_informal: Number(cobro.cant_cuotas) === 0,
        fecha_emision: cobro.fecha_emision,
        estado: saldoPendienteAcuerdo <= 0 ? "Completado" : "Parcial",
        entregas: entregas,
        cuotas: cuotasOrdenadas,
      };
    });

    const costoAcordadoGlobalRedondeado = Math.round(totalCostoAcordado * 100) / 100;
    const totalPagadoGlobalRedondeado = Math.round(totalPagadoGlobal * 100) / 100;
    const saldoPendienteGlobal = Math.max(
      0,
      Math.round((costoAcordadoGlobalRedondeado - totalPagadoGlobalRedondeado) * 100) / 100
    );
    const estadoCuentaGlobal = saldoPendienteGlobal <= 0 ? "AL_DIA" : "CON_DEUDA";

    res.status(200).json({
      status: "success",
      data: {
        paciente: {
          id_paciente: paciente.id_paciente,
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          nombre_completo: `${paciente.apellido}, ${paciente.nombre}`,
          dni: paciente.dni,
          telefono: paciente.telefono,
          domicilio: paciente.domicilio,
          activo: paciente.activo,
        },
        metricas: {
          costo_acordado: costoAcordadoGlobalRedondeado,
          pagado: totalPagadoGlobalRedondeado,
          total_pagado: totalPagadoGlobalRedondeado,
          saldo_pendiente: saldoPendienteGlobal,
          cobros_registrados: cobrosRegistradosGlobal,
          estado_cuenta: estadoCuentaGlobal,
        },
        acuerdos: acuerdos,
        cobros: acuerdos,
        turnos_atendidos: turnosAtendidosFormateados,
      },
    });
  } catch (error) {
    console.error("Error al obtener cuenta del paciente:", error);
    res.status(500).json({
      status: "error",
      error: "Error al obtener cuenta del paciente",
      message: error.message,
    });
  }
};

// 3. POST /api/cobros/:id_cobro/entregas - Registrar Pago Parcial / Entrega
export const registrarEntrega = async (req, res) => {
  try {
    const id_cobro = req.params.id_cobro || req.params.id;
    const { monto, metodo_pago, fecha_cobro } = req.body;

    const montoNum = Number(monto);
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      return res.status(400).json({
        status: "error",
        error: "Monto inválido",
        message: "El monto a entregar debe ser un número mayor a 0.",
      });
    }

    const cobro = await Cobro.findOne({
      where: { id_cobro, activo: true },
    });

    if (!cobro) {
      return res.status(404).json({
        status: "error",
        error: "Cobro no encontrado",
        message: "No se encontró el acuerdo o cobro especificado.",
      });
    }

    const cuotas = await Cuota.findAll({
      where: { id_cobro: cobro.id_cobro, activo: true },
    });
    const totalPagado = cuotas.reduce((sum, c) => {
      if (c.estado && c.estado.toLowerCase() === "pagada") {
        return sum + (Number(c.monto_cobrado ?? c.monto_cuota ?? 0) || 0);
      }
      return sum;
    }, 0);

    const montoTotalAcuerdo = Number(cobro.monto_a_cobrar) || 0;
    const saldoPendiente = Math.max(
      0,
      Math.round((montoTotalAcuerdo - totalPagado) * 100) / 100
    );

    // Validación estricta con tolerancia a centavos
    if (Math.round(montoNum * 100) > Math.round(saldoPendiente * 100)) {
      return res.status(400).json({
        status: "error",
        error: "Monto excede saldo pendiente",
        message: `El monto ingresado ($ ${montoNum.toLocaleString("es-AR")}) supera el saldo pendiente restante ($ ${saldoPendiente.toLocaleString("es-AR")}).`,
      });
    }

    const correlativos = cuotas.map((c) => Number(c.nro_cuota) || 0);
    const siguienteNro = correlativos.length > 0 ? Math.max(...correlativos) + 1 : 1;

    const metodoEnum = normalizarMetodoPagoEnum(metodo_pago);
    const fechaCobroDate = fecha_cobro ? new Date(fecha_cobro) : new Date();
    const fechaVencimientoStr = fechaCobroDate.toISOString().slice(0, 10);

    const nuevaCuota = await Cuota.create({
      id_cobro: cobro.id_cobro,
      nro_cuota: siguienteNro,
      monto_cuota: Math.round(montoNum * 100) / 100,
      monto_cobrado: Math.round(montoNum * 100) / 100,
      fecha_vencimiento: fechaVencimientoStr,
      fecha_cobro: fechaCobroDate,
      metodo_pago: metodoEnum,
      estado: "Pagada",
      activo: true,
    });

    const nuevoTotalPagado = Math.round((totalPagado + montoNum) * 100) / 100;
    const nuevoSaldoRestante = Math.max(
      0,
      Math.round((montoTotalAcuerdo - nuevoTotalPagado) * 100) / 100
    );

    res.status(201).json({
      status: "success",
      message: "Entrega registrada exitosamente",
      data: {
        cuota: nuevaCuota,
        saldo_restante: nuevoSaldoRestante,
        total_pagado: nuevoTotalPagado,
        id_cobro: cobro.id_cobro,
      },
    });
  } catch (error) {
    console.error("Error al registrar la entrega:", error);
    res.status(500).json({
      status: "error",
      error: "Error interno al registrar la entrega",
      message: error.message,
    });
  }
};

// 4. POST /api/cobros/acuerdo - Crear Nuevo Costo Acordado / Deuda
export const crearAcuerdo = async (req, res) => {
  try {
    const {
      id_paciente,
      id_turno,
      monto_a_cobrar,
      tipo_acuerdo = "INFORMAL",
      cant_cuotas,
      primer_vencimiento,
      intervalo_dias = 30,
    } = req.body;

    const pacienteId = Number(id_paciente);
    if (!pacienteId) {
      return res.status(400).json({
        status: "error",
        error: "ID de paciente requerido",
        message: "Debe especificar un paciente válido.",
      });
    }

    const paciente = await Paciente.findByPk(pacienteId);
    if (!paciente) {
      return res.status(404).json({
        status: "error",
        error: "Paciente no encontrado",
        message: "El paciente especificado no existe.",
      });
    }

    const montoNum = Number(monto_a_cobrar);
    if (!montoNum || isNaN(montoNum) || montoNum <= 0) {
      return res.status(400).json({
        status: "error",
        error: "Monto inválido",
        message: "El monto acordado debe ser mayor a 0.",
      });
    }

    const turnoId = id_turno ? Number(id_turno) : null;
    if (turnoId) {
      const turno = await Turno.findByPk(turnoId);
      if (!turno) {
        return res.status(404).json({
          status: "error",
          error: "Turno no encontrado",
          message: "El turno especificado no existe.",
        });
      }
    }

    const tipoUpper = String(tipo_acuerdo).toUpperCase();
    const esInformal = tipoUpper === "INFORMAL" || Number(cant_cuotas) === 0;

    if (esInformal) {
      // 1. Acuerdo Abierto / Cuotas Informales: cant_cuotas = 0, no pre-genera cuotas fijas
      const nuevoCobro = await Cobro.create({
        id_paciente: pacienteId,
        id_turno: turnoId,
        monto_a_cobrar: Math.round(montoNum * 100) / 100,
        cant_cuotas: 0,
        fecha_emision: new Date(),
        activo: true,
      });

      const cuotasCreadas = [];
      const entregaNum = Number(req.body.entrega_inicial || req.body.monto_entrega || req.body.anticipo || 0);

      if (entregaNum > 0 && entregaNum <= montoNum) {
        const metodoEnum = normalizarMetodoPagoEnum(req.body.metodo_pago);
        const fechaCobroDate = req.body.fecha_cobro ? new Date(req.body.fecha_cobro) : new Date();
        const fechaVencimientoStr = fechaCobroDate.toISOString().slice(0, 10);

        const cuotaEntrega = await Cuota.create({
          id_cobro: nuevoCobro.id_cobro,
          nro_cuota: 1,
          monto_cuota: Math.round(entregaNum * 100) / 100,
          monto_cobrado: Math.round(entregaNum * 100) / 100,
          fecha_vencimiento: fechaVencimientoStr,
          fecha_cobro: fechaCobroDate,
          metodo_pago: metodoEnum,
          estado: "Pagada",
          activo: true,
        });
        cuotasCreadas.push(cuotaEntrega);
      }

      return res.status(201).json({
        status: "success",
        message: "Acuerdo abierto de tratamiento creado exitosamente",
        data: {
          cobro: nuevoCobro,
          cuotas: cuotasCreadas,
        },
      });
    } else {
      // 2. Plan Estructurado de Cuotas Fijas
      const cantNum = Math.max(1, Number(cant_cuotas) || 1);
      const baseDate = primer_vencimiento
        ? new Date(`${primer_vencimiento}T00:00:00Z`)
        : new Date(Date.now() + 30 * 86400000);

      const result = await sequelize.transaction(async (t) => {
        const nuevoCobro = await Cobro.create(
          {
            id_paciente: pacienteId,
            id_turno: turnoId,
            monto_a_cobrar: Math.round(montoNum * 100) / 100,
            cant_cuotas: cantNum,
            fecha_emision: new Date(),
            activo: true,
          },
          { transaction: t }
        );

        const montoBase = Math.floor((montoNum / cantNum) * 100) / 100;
        const sumaBase = Math.round(montoBase * cantNum * 100) / 100;
        const diferencia = Math.round((montoNum - sumaBase) * 100) / 100;

        const cuotasCreadas = [];
        for (let i = 0; i < cantNum; i++) {
          const montoCuota =
            i === cantNum - 1
              ? Math.round((montoBase + diferencia) * 100) / 100
              : montoBase;

          const cuotaDate = new Date(
            baseDate.getTime() + i * (Number(intervalo_dias) || 30) * 86400000
          );
          const fechaVencimientoStr = cuotaDate.toISOString().slice(0, 10);

          const nuevaCuota = await Cuota.create(
            {
              id_cobro: nuevoCobro.id_cobro,
              nro_cuota: i + 1,
              monto_cuota: montoCuota,
              monto_cobrado: 0,
              fecha_vencimiento: fechaVencimientoStr,
              fecha_cobro: null,
              metodo_pago: null,
              estado: "Pendiente",
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

      return res.status(201).json({
        status: "success",
        message: "Plan de cuotas fijas creado exitosamente",
        data: result,
      });
    }
  } catch (error) {
    console.error("Error al crear el acuerdo de cobro:", error);
    res.status(500).json({
      status: "error",
      error: "Error interno al crear el acuerdo de cobro",
      message: error.message,
    });
  }
};


