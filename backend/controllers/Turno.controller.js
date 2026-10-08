import sequelize from "../config/database.js";
import { Op, Sequelize } from "sequelize";
import {
  Turno,
  HistorialEstadoTurno,
  PracticaTurno,
  EstadoTurno,
  Paciente,
  Practica,
  ObraSocial,
  PacienteObraSocial,
} from "../models/index.model.js";
import {
  validarEstadoProgramado,
  validarEstados,
  validarSolapaminetoHorarios,
} from "../validations/Turno.validation.js";
import { obtenerEstadoTurno } from "../states/TurnoState.js";

// Include de Paciente con sus Obras Sociales
const includePacienteConObrasSociales = {
  model: Paciente,
  required: false,
  include: [
    {
      model: ObraSocial,
      through: {
        attributes: ["nro_afiliado", "activo"],
      },
      required: false,
    },
  ],
};

// Include de Prácticas odontológicas asociadas al turno (con atributos de la tabla intermedia practica_turno)
const includePracticasTurno = {
  model: Practica,
  through: { attributes: ["precio_aplicado", "id_obra_social"] },
  required: false,
};

// Include de Estado del Turno
const includeEstadoTurno = {
  model: EstadoTurno,
  required: false,
};

// Include de Historial de Estados del Turno (bitácora de auditoría)
const includeHistorialEstadoTurno = {
  model: HistorialEstadoTurno,
  as: "historial",
  include: [
    {
      model: EstadoTurno,
      attributes: ["id_estado", "estado"],
    },
  ],
  required: false,
};

// Includes estándar reutilizables para todas las consultas de turno
const defaultTurnoIncludes = [
  includePacienteConObrasSociales,
  includeEstadoTurno,
  includePracticasTurno,
  includeHistorialEstadoTurno,
];

// Helper para formatear fechas a YYYY-MM-DD HH:mm:ss sin conversiones UTC
export const formatearFechaHoraStr = (fechaHoraInput) => {
  if (!fechaHoraInput) return null;
  if (typeof fechaHoraInput === "string") {
    const s = fechaHoraInput.trim().replace("T", " ");
    const match = s.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(?::\d{2})?)/);
    if (match) {
      const fechaParte = match[1];
      const horaParte = match[2].length === 5 ? `${match[2]}:00` : match[2].slice(0, 8);
      return `${fechaParte} ${horaParte}`;
    }
  }
  const d = new Date(fechaHoraInput);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
};

export const calcularFechaHoraFinStr = (fechaHoraInicioStr, duracionMinutos) => {
  const inicioStr = formatearFechaHoraStr(fechaHoraInicioStr);
  if (!inicioStr) return null;
  const dur = Number(duracionMinutos) || 30;
  const match = inicioStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (match) {
    const [, y, m, d, hh, mm, ss] = match;
    const totalMin = Number(hh) * 60 + Number(mm) + dur;
    const newH = Math.floor(totalMin / 60) % 24;
    const newM = totalMin % 60;
    const hhStr = String(newH).padStart(2, "0");
    const mmStr = String(newM).padStart(2, "0");
    return `${y}-${m}-${d} ${hhStr}:${mmStr}:${ss}`;
  }
  const d = new Date(inicioStr);
  const fin = new Date(d.getTime() + dur * 60000);
  return formatearFechaHoraStr(fin);
};

// Catálogo en memoria de Obras Sociales para resolución rápida de nombres
const nombresObrasSocialesMap = new Map();
export const cargarNombresObrasSociales = async () => {
  try {
    const list = await ObraSocial.findAll({ attributes: ["id_obra_social", "nombre"] });
    list.forEach((os) => nombresObrasSocialesMap.set(Number(os.id_obra_social), os.nombre));
  } catch (e) {
    console.warn("No se pudieron cargar nombres de obras sociales:", e.message);
  }
};
cargarNombresObrasSociales();

// Helper para formatear la respuesta del turno garantizando compatibilidad con el frontend
export const formatearTurnoResponse = (turnoInstance) => {
  if (!turnoInstance) return null;
  const json =
    typeof turnoInstance.toJSON === "function"
      ? turnoInstance.toJSON()
      : { ...turnoInstance };

  json.practicas = json.Practicas || json.practicas || [];

  // Extraer id_obra_social de la tabla intermedia practica_turno
  let ptIdOS = null;
  if (Array.isArray(json.practicas)) {
    for (const p of json.practicas) {
      const osId = p.PracticaTurno?.id_obra_social ?? p.id_obra_social;
      if (osId !== undefined && osId !== null) {
        ptIdOS = Number(osId);
        break;
      }
    }
  }

  // Si no está en las prácticas, revisar si vino registrado directamente en el objeto del turno
  if (ptIdOS === null && json.id_obra_social !== undefined && json.id_obra_social !== null) {
    ptIdOS = Number(json.id_obra_social);
  }

  // Identificar exclusivamente la obra social utilizada en la atención (si es > 1 y no es Particular)
  let obraSocialUsada = null;
  if (ptIdOS && ptIdOS > 1) {
    const osPaciente = json.Paciente?.ObraSocials?.find(
      (os) => Number(os.id_obra_social) === Number(ptIdOS)
    );
    const nombreOS =
      osPaciente?.nombre ||
      nombresObrasSocialesMap.get(ptIdOS) ||
      `Obra Social #${ptIdOS}`;
    const nroAfiliado =
      osPaciente?.PacienteObraSocial?.nro_afiliado ||
      osPaciente?.nro_afiliado ||
      null;

    obraSocialUsada = {
      id_obra_social: ptIdOS,
      nombre: nombreOS,
      nro_afiliado: nroAfiliado,
    };
  }

  json.id_obra_social = obraSocialUsada ? obraSocialUsada.id_obra_social : null;
  json.obra_social_usada = obraSocialUsada;
  json.obra_social = obraSocialUsada;
  json.obras_sociales_utilizadas = obraSocialUsada ? [obraSocialUsada] : [];
  json.precio_final = Number(json.precio_final) || 0;
  json.total = json.precio_final;

  // Historial de estados (bitácora de auditoría) ordenado cronológicamente
  const rawHistorial = json.historial || json.HistorialEstadoTurnos || [];
  json.historial = Array.isArray(rawHistorial)
    ? [...rawHistorial].sort((a, b) => new Date(a.fecha_hora_cambio) - new Date(b.fecha_hora_cambio))
    : [];

  // Extraer la evolución clínica del registro de atención en el historial (el más reciente con id_estado = 3: Atendido)
  const registroAtendido = [...json.historial].reverse().find(
    (h) => h.id_estado === 3 || h.EstadoTurno?.estado === "Atendido" || h.estado === "Atendido"
  );
  const evolucionClinica = registroAtendido ? registroAtendido.descripcion : null;
  json.evolucion_clinica = evolucionClinica;

  // El motivo inicial de reserva se preserva en notas_consulta y motivo_consulta
  const motivoInicial = json.motivo_consulta || json.notas_consulta || null;
  json.motivo_consulta = motivoInicial;
  json.notas_consulta = motivoInicial;

  // En turnos atendidos, exponer observaciones como la evolución clínica para máxima compatibilidad
  if (json.id_estado === 3 && evolucionClinica) {
    json.observaciones = evolucionClinica;
  }

  return json;
};

// Obtener todos los turnos
export const getAllTurnos = async (req, res) => {
  try {
    const { fecha, id_paciente } = req.query;
    const where = {};

    if (fecha) {
      where[Op.and] = [
        Sequelize.where(
          Sequelize.fn("DATE", Sequelize.col("fecha_hora_inicio")),
          fecha
        ),
      ];
    }

    if (id_paciente) {
      where.id_paciente = id_paciente;
    }

    const turnos = await Turno.findAll({
      where,
      include: defaultTurnoIncludes,
      order: [["fecha_hora_inicio", "ASC"]],
    });

    if (nombresObrasSocialesMap.size === 0) {
      await cargarNombresObrasSociales();
    }

    const turnosFormateados = turnos.map((t) => formatearTurnoResponse(t));

    res.status(200).json({
      status: "success",
      data: turnosFormateados,
    });
  } catch (error) {
    console.error("Error al obtener los turnos:", error);
    res.status(500).json({ error: "Error al obtener los turnos" });
  }
};

// Obtener un turno por su ID
export const getTurnoById = async (req, res) => {
  try {
    const id = req.params.id || req.turno?.id_turno;
    const turno = await Turno.findByPk(id, {
      include: defaultTurnoIncludes,
    });

    if (!turno) {
      return res.status(404).json({ error: "Error al obtener el turno" });
    }

    if (nombresObrasSocialesMap.size === 0) {
      await cargarNombresObrasSociales();
    }

    res.status(200).json({
      status: "success",
      data: formatearTurnoResponse(turno),
    });
  } catch (error) {
    console.error("Error al obtener el turno:", error);
    res.status(500).json({ error: "Error al obtener el turno" });
  }
};

// Crear un nuevo turno (T-123)
export const createTurno = async (req, res) => {
  try {
    const {
      id_paciente,
      id_practica,
      practicas,
      id_practicas,
      practicas_realizadas,
      fecha_hora_inicio,
      duracion_minutos,
      precio_final,
      motivo_consulta,
      notas_consulta,
      observaciones,
      notas,
    } = req.body;

    const duracion = Number(duracion_minutos) || 30;
    const inicioStr = formatearFechaHoraStr(fecha_hora_inicio);
    const finStr = req.body.fecha_hora_fin
      ? formatearFechaHoraStr(req.body.fecha_hora_fin)
      : calcularFechaHoraFinStr(inicioStr, duracion);

    if (!inicioStr || !finStr) {
      return res.status(400).json({
        error: "Fecha u hora de inicio inválida.",
      });
    }

    // Si no encuentra el estado lo crea
    const estado = await validarEstadoProgramado();

    const haySolapamiento = await validarSolapaminetoHorarios(
      inicioStr,
      finStr,
      null,
    );

    if (haySolapamiento) {
      return res.status(409).json({
        error:
          "El horario seleccionado se superpone con un turno ya programado.",
      });
    }

    // Recolectar IDs de prácticas
    const practicasIds = [];
    if (id_practica) practicasIds.push(Number(id_practica));
    if (Array.isArray(id_practicas)) {
      id_practicas.forEach((id) => {
        const num = Number(id);
        if (num && !practicasIds.includes(num)) practicasIds.push(num);
      });
    }
    if (Array.isArray(practicas)) {
      practicas.forEach((p) => {
        const num = typeof p === "object" && p ? Number(p.id_practica || p.id) : Number(p);
        if (num && !practicasIds.includes(num)) practicasIds.push(num);
      });
    }
    if (Array.isArray(practicas_realizadas)) {
      practicas_realizadas.forEach((p) => {
        const num = typeof p === "object" && p ? Number(p.id_practica || p.id) : Number(p);
        if (num && !practicasIds.includes(num)) practicasIds.push(num);
      });
    }

    let sumaPracticas = 0;
    let practicasEncontradas = [];
    if (practicasIds.length > 0) {
      practicasEncontradas = await Practica.findAll({
        where: { id_practica: { [Op.in]: practicasIds } },
      });
      sumaPracticas = practicasEncontradas.reduce(
        (sum, p) => sum + (Number(p.precio_referencia) || 0),
        0
      );
    }

    let precio = sumaPracticas;
    if (precio === 0 && precio_final !== undefined && precio_final !== null && !isNaN(Number(precio_final))) {
      precio = Number(precio_final);
    }

    const motivoTexto =
      motivo_consulta !== undefined && motivo_consulta !== null
        ? String(motivo_consulta).trim() || null
        : (notas_consulta || observaciones || notas || "").trim() || null;

    const result = await sequelize.transaction(async (t) => {
      let obraSocialId = null;
      if (req.body.id_obra_social) {
        obraSocialId = Number(req.body.id_obra_social);
      } else if (req.body.obras_sociales_utilizadas && Array.isArray(req.body.obras_sociales_utilizadas) && req.body.obras_sociales_utilizadas.length > 0) {
        const firstOS = req.body.obras_sociales_utilizadas[0];
        obraSocialId = typeof firstOS === "object" && firstOS !== null ? (firstOS.id_obra_social || firstOS.id) : firstOS;
        obraSocialId = obraSocialId ? Number(obraSocialId) : null;
      }

      const nuevoTurno = await Turno.create(
        {
          id_paciente: Number(id_paciente),
          id_estado: estado.id_estado,
          fecha_hora_inicio: inicioStr,
          fecha_hora_fin: finStr,
          precio_final: precio,
          motivo_consulta: motivoTexto,
          notas_consulta: motivoTexto,
        },
        { transaction: t },
      );

      await HistorialEstadoTurno.create(
        {
          id_turno: nuevoTurno.id_turno,
          id_estado: estado.id_estado,
          fecha_hora_cambio: new Date(),
          descripcion: motivoTexto || "Turno programado inicialmente",
        },
        { transaction: t },
      );

      if (practicasIds.length > 0) {
        for (const pid of practicasIds) {
          const pModel = practicasEncontradas.find((p) => p.id_practica === pid);
          await PracticaTurno.create(
            {
              id_turno: nuevoTurno.id_turno,
              id_practica: pid,
              precio_aplicado: pModel ? (Number(pModel.precio_referencia) || 0) : 0,
              id_obra_social: obraSocialId,
            },
            { transaction: t }
          );
        }
      }

      const turnoCompleto = await Turno.findByPk(nuevoTurno.id_turno, {
        include: defaultTurnoIncludes,
        transaction: t,
      });

      return turnoCompleto;
    });

    res.status(201).json({
      status: "success",
      data: formatearTurnoResponse(result),
    });
  } catch (error) {
    console.error("Error al crear el turno:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al crear el turno." });
  }
};

export const updateTurno = async (req, res) => {
  try {
    const turno = req.turno;

    const {
      id_paciente,
      id_estado,
      id_practica,
      practicas,
      id_practicas,
      practicas_realizadas,
      fecha_hora_inicio,
      duracion_minutos,
      precio_final,
      motivo_consulta,
      notas_consulta,
      observaciones,
      notas,
    } = req.body;

    const inicioStr = fecha_hora_inicio
      ? formatearFechaHoraStr(fecha_hora_inicio)
      : formatearFechaHoraStr(turno.fecha_hora_inicio);

    const duracion =
      Number(duracion_minutos) ||
      (turno.fecha_hora_fin && turno.fecha_hora_inicio
        ? Math.round(
            (new Date(turno.fecha_hora_fin).getTime() -
              new Date(turno.fecha_hora_inicio).getTime()) /
              60000,
          )
        : 30) ||
      30;

    const finStr = req.body.fecha_hora_fin
      ? formatearFechaHoraStr(req.body.fecha_hora_fin)
      : calcularFechaHoraFinStr(inicioStr, duracion);

    if (fecha_hora_inicio || duracion_minutos || req.body.fecha_hora_fin) {
      const haySolapamiento = await validarSolapaminetoHorarios(
        inicioStr,
        finStr,
        turno.id_turno,
      );

      if (haySolapamiento) {
        return res.status(409).json({
          error:
            "El horario seleccionado se superpone con un turno ya programado.",
        });
      }
    }

    const practicasIds = [];
    if (id_practica) practicasIds.push(Number(id_practica));
    if (Array.isArray(id_practicas)) {
      id_practicas.forEach((id) => {
        const num = Number(id);
        if (num && !practicasIds.includes(num)) practicasIds.push(num);
      });
    }
    if (Array.isArray(practicas)) {
      practicas.forEach((p) => {
        const num = typeof p === "object" && p ? Number(p.id_practica || p.id) : Number(p);
        if (num && !practicasIds.includes(num)) practicasIds.push(num);
      });
    }
    if (Array.isArray(practicas_realizadas)) {
      practicas_realizadas.forEach((p) => {
        const num = typeof p === "object" && p ? Number(p.id_practica || p.id) : Number(p);
        if (num && !practicasIds.includes(num)) practicasIds.push(num);
      });
    }

    let sumaPracticas = 0;
    let practicasEncontradas = [];
    if (practicasIds.length > 0) {
      practicasEncontradas = await Practica.findAll({
        where: { id_practica: { [Op.in]: practicasIds } },
      });
      sumaPracticas = practicasEncontradas.reduce(
        (sum, p) => sum + (Number(p.precio_referencia) || 0),
        0
      );
    }

    let nuevoPrecio = turno.precio_final;
    if (practicasIds.length > 0) {
      nuevoPrecio = sumaPracticas;
    } else if (precio_final !== undefined && precio_final !== null && !isNaN(Number(precio_final))) {
      nuevoPrecio = Number(precio_final);
    }

    const notasTexto =
      notas_consulta !== undefined
        ? notas_consulta
        : observaciones !== undefined
        ? observaciones
        : notas !== undefined
        ? notas
        : turno.notas_consulta;

    const motivoTexto =
      motivo_consulta !== undefined
        ? (motivo_consulta ? String(motivo_consulta).trim() : null)
        : turno.motivo_consulta;

    await sequelize.transaction(async (t) => {
      const updateData = {
        id_paciente: id_paciente ? Number(id_paciente) : turno.id_paciente,
        id_estado: id_estado ? Number(id_estado) : turno.id_estado,
        fecha_hora_inicio: inicioStr,
        fecha_hora_fin: finStr,
        precio_final: nuevoPrecio,
        motivo_consulta: motivoTexto,
        notas_consulta: notasTexto,
      };

      let idObraSocialUpdate = undefined;
      if (req.body.id_obra_social !== undefined) {
        idObraSocialUpdate = req.body.id_obra_social && !isNaN(Number(req.body.id_obra_social))
          ? Number(req.body.id_obra_social)
          : null;
      } else if (req.body.obras_sociales_utilizadas !== undefined && Array.isArray(req.body.obras_sociales_utilizadas)) {
        const firstOS = req.body.obras_sociales_utilizadas[0];
        const osId = typeof firstOS === "object" && firstOS !== null ? (firstOS.id_obra_social || firstOS.id) : firstOS;
        idObraSocialUpdate = osId && !isNaN(Number(osId)) ? Number(osId) : null;
      }

      await turno.update(updateData, { transaction: t });

      // Si el turno está atendido y se modifican las notas de consulta, actualizar la bitácora de auditoría
      if (turno.id_estado === 3 && notasTexto !== undefined && notasTexto !== null) {
        const histAtencion = await HistorialEstadoTurno.findOne({
          where: { id_turno: turno.id_turno, id_estado: 3 },
          order: [["fecha_hora_cambio", "DESC"]],
          transaction: t,
        });
        if (histAtencion) {
          await histAtencion.update({ descripcion: notasTexto }, { transaction: t });
        } else {
          await HistorialEstadoTurno.create(
            {
              id_turno: turno.id_turno,
              id_estado: 3,
              fecha_hora_cambio: new Date(),
              descripcion: notasTexto,
            },
            { transaction: t },
          );
        }
      }

      if (practicasIds.length > 0) {
        let osActual = null;
        if (idObraSocialUpdate === undefined) {
          const ptPrev = await PracticaTurno.findOne({ where: { id_turno: turno.id_turno } });
          osActual = ptPrev ? ptPrev.id_obra_social : null;
        } else {
          osActual = idObraSocialUpdate;
        }

        await PracticaTurno.destroy({
          where: { id_turno: turno.id_turno },
          transaction: t,
        });

        for (const pid of practicasIds) {
          const pModel = practicasEncontradas.find((p) => p.id_practica === pid);
          await PracticaTurno.create(
            {
              id_turno: turno.id_turno,
              id_practica: pid,
              precio_aplicado: pModel ? (Number(pModel.precio_referencia) || 0) : 0,
              id_obra_social: osActual,
            },
            { transaction: t }
          );
        }
      } else if (idObraSocialUpdate !== undefined) {
        await PracticaTurno.update(
          { id_obra_social: idObraSocialUpdate },
          { where: { id_turno: turno.id_turno }, transaction: t }
        );
      }
    });

    const turnoActualizado = await Turno.findByPk(turno.id_turno, {
      include: defaultTurnoIncludes,
    });

    res.status(200).json({
      status: "success",
      data: formatearTurnoResponse(turnoActualizado),
    });
  } catch (error) {
    console.error("Error al modificar el turno:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al modificar el turno." });
  }
};

// Finalizar atención del turno y registrar prácticas (T-1314)
export const turnoAtendido = async (req, res) => {
  try {
    const notas_consulta =
      req.body.notas_consulta !== undefined && req.body.notas_consulta !== null
        ? String(req.body.notas_consulta).trim()
        : req.body.notas_atencion !== undefined && req.body.notas_atencion !== null
        ? String(req.body.notas_atencion).trim()
        : req.body.observaciones !== undefined && req.body.observaciones !== null
        ? String(req.body.observaciones).trim()
        : null;

    const rawPracticas =
      req.body.practicas ||
      req.body.practicas_realizadas ||
      req.body.id_practicas ||
      [];
    const practicas_realizadas = Array.isArray(rawPracticas)
      ? rawPracticas.map((p) => (typeof p === "object" && p ? (p.id_practica || p.id) : p)).filter(Boolean).map(Number)
      : [];

    const id = req.params.id;
    const turno = req.turno || (id ? await Turno.findByPk(id) : null);

    if (!turno) {
      return res.status(404).json({ status: "error", error: "Turno no encontrado", message: "Turno no encontrado" });
    }

    const idsUnicos = [...new Set(practicas_realizadas)];
    if (idsUnicos.length === 0) {
      return res.status(400).json({
        status: "error",
        error: "Debe seleccionar al menos una práctica odontológica.",
        message: "Debe seleccionar al menos una práctica odontológica."
      });
    }

    const practicasEncontradas = await Practica.findAll({
      where: {
        id_practica: { [Op.in]: idsUnicos },
      },
    });

    if (practicasEncontradas.length !== idsUnicos.length) {
      return res.status(400).json({
        status: "error",
        error: "Una o más prácticas especificadas no existen.",
        message: "Una o más prácticas especificadas no existen."
      });
    }

    const sumaPracticas = practicasEncontradas.reduce(
      (acc, p) => acc + (Number(p.precio_referencia) || 0),
      0
    );

    let precioFinalAtendido;
    if (req.body.precio_final !== undefined && req.body.precio_final !== null && !isNaN(Number(req.body.precio_final))) {
      precioFinalAtendido = Number(req.body.precio_final);
    } else if (req.body.total !== undefined && req.body.total !== null && !isNaN(Number(req.body.total))) {
      precioFinalAtendido = Number(req.body.total);
    } else if (sumaPracticas > 0) {
      precioFinalAtendido = sumaPracticas;
    } else {
      precioFinalAtendido = Number(turno.precio_final) || 0;
    }

    // Extraer id_obra_social
    let idObraSocialAtencion = null;
    if (req.body.id_obra_social !== undefined && req.body.id_obra_social !== null && !isNaN(Number(req.body.id_obra_social))) {
      idObraSocialAtencion = Number(req.body.id_obra_social);
    } else if (req.body.obras_sociales_utilizadas !== undefined && Array.isArray(req.body.obras_sociales_utilizadas) && req.body.obras_sociales_utilizadas.length > 0) {
      const firstOS = req.body.obras_sociales_utilizadas[0];
      const osId = typeof firstOS === "object" && firstOS !== null ? (firstOS.id_obra_social || firstOS.id) : firstOS;
      idObraSocialAtencion = osId && !isNaN(Number(osId)) ? Number(osId) : null;
    }

    // Si viene id_obra_social y es distinto de 1 (Particular), registrar la asociación para el paciente si no existía
    if (idObraSocialAtencion && idObraSocialAtencion !== 1 && turno.id_paciente) {
      try {
        await PacienteObraSocial.findOrCreate({
          where: {
            id_paciente: turno.id_paciente,
            id_obra_social: idObraSocialAtencion,
          },
          defaults: {
            id_paciente: turno.id_paciente,
            id_obra_social: idObraSocialAtencion,
            nro_afiliado: null,
            activo: true,
          },
        });
      } catch (e) {
        console.warn("No se pudo asociar obra social al paciente:", e.message);
      }
    }

    const turnoActualizado = await sequelize.transaction(async (t) => {
      // 1. Obtener la instancia polimórfica del estado actual (GoF State)
      const estadoActual = await obtenerEstadoTurno(turno.id_estado, t);

      // 2. Delegar la transición a estadoActual.atender()
      // Esto valida la transición, actualiza el estado y registra la evolución en HistorialEstadoTurno
      await estadoActual.atender(
        turno,
        {
          observacion: notas_consulta || "Atención odontológica finalizada",
          practicas_realizadas: idsUnicos,
        },
        t,
      );

      // 3. Actualizar precio_final SIN sobreescribir turno.notas_consulta (motivo de reserva preservado)
      await turno.update(
        {
          precio_final: precioFinalAtendido ? Number(precioFinalAtendido) : 0,
        },
        { transaction: t },
      );

      // 4. Limpiar prácticas previas si existían y asociar las nuevas con id_obra_social
      await PracticaTurno.destroy({
        where: { id_turno: turno.id_turno },
        transaction: t,
      });

      for (const p of practicasEncontradas) {
        await PracticaTurno.create(
          {
            id_turno: turno.id_turno,
            id_practica: p.id_practica,
            precio_aplicado: p.precio_referencia ? Number(p.precio_referencia) : 0,
            id_obra_social: idObraSocialAtencion,
          },
          { transaction: t }
        );
      }

      return await Turno.findByPk(turno.id_turno, {
        include: defaultTurnoIncludes,
        transaction: t,
      });
    });

    const turnoResponse = formatearTurnoResponse(turnoActualizado);

    res.status(200).json({
      status: "success",
      message: "Atención registrada exitosamente",
      data: turnoResponse,
      ...turnoResponse,
    });
  } catch (error) {
    console.error("Error al finalizar la atención:", error);
    res.status(500).json({ status: "error", error: error.message || "Error interno al registrar la atención", message: error.message || "Error interno al registrar la atención" });
  }
};

export const atenderTurno = turnoAtendido;

// Cambiar estado del turno
// Cambiar estado del turno a Cancelado
export const turnoCancelado = async (req, res) => {
  try {
    const id = req.params.id;
    const turno = req.turno || (id ? await Turno.findByPk(id) : null);

    if (!turno) {
      return res.status(404).json({ error: "Turno no encontrado" });
    }

    const motivo =
      req.body.notas_consulta !== undefined && req.body.notas_consulta !== null
        ? String(req.body.notas_consulta).trim()
        : req.body.motivo !== undefined && req.body.motivo !== null
        ? String(req.body.motivo).trim()
        : "Turno cancelado";

    const turnoActualizado = await sequelize.transaction(async (t) => {
      // Delegar la transición a la máquina de estados GoF
      const estadoActual = await obtenerEstadoTurno(turno.id_estado, t);
      await estadoActual.cancelar(turno, motivo, t);

      return await Turno.findByPk(turno.id_turno, {
        include: defaultTurnoIncludes,
        transaction: t,
      });
    });

    res.status(200).json({
      status: "success",
      data: formatearTurnoResponse(turnoActualizado),
    });
  } catch (error) {
    console.error("Error al cancelar turno:", error);
    res.status(400).json({ error: error.message });
  }
};

export const turnoInasistido = async (req, res) => {
  try {
    const id = req.params.id;
    const turno = req.turno || (id ? await Turno.findByPk(id) : null);

    if (!turno) {
      return res.status(404).json({ error: "Turno no encontrado" });
    }

    const motivo =
      req.body.notas_consulta !== undefined && req.body.notas_consulta !== null
        ? String(req.body.notas_consulta).trim()
        : req.body.motivo !== undefined && req.body.motivo !== null
        ? String(req.body.motivo).trim()
        : "El profesional constató la inasistencia del paciente.";

    const turnoActualizado = await sequelize.transaction(async (t) => {
      // Delegar la transición a la máquina de estados GoF
      const estadoActual = await obtenerEstadoTurno(turno.id_estado, t);
      await estadoActual.marcarInasistente(turno, motivo, t);

      return await Turno.findByPk(turno.id_turno, {
        include: defaultTurnoIncludes,
        transaction: t,
      });
    });

    res.status(200).json({
      status: "success",
      data: formatearTurnoResponse(turnoActualizado),
    });
  } catch (error) {
    console.error("Error al marcar inasistencia:", error);
    res.status(400).json({ error: error.message });
  }
};

export const turnoReprogramado = async (req, res) => {
  try {
    const idOriginal = req.params.id || req.body.id_turno || req.body.idTurnoOriginal;
    const turnoOriginal = req.turno || (idOriginal ? await Turno.findByPk(idOriginal) : null);

    if (!turnoOriginal) {
      return res.status(404).json({
        error: "No se encontró el turno original a reprogramar.",
      });
    }

    let { fecha_hora_inicio, duracion_minutos, fecha, hora } = req.body;

    if (!fecha_hora_inicio && fecha && hora) {
      fecha_hora_inicio = `${fecha} ${hora}:00`;
    }

    if (!fecha_hora_inicio) {
      return res.status(400).json({
        error: "Se requiere la fecha y hora de inicio para la nueva cita.",
      });
    }

    const duracion =
      Number(duracion_minutos) ||
      (turnoOriginal.fecha_hora_fin && turnoOriginal.fecha_hora_inicio
        ? Math.round(
            (new Date(turnoOriginal.fecha_hora_fin).getTime() -
              new Date(turnoOriginal.fecha_hora_inicio).getTime()) /
              60000,
          )
        : 30) ||
      30;

    const inicioStr = formatearFechaHoraStr(fecha_hora_inicio);
    const finStr = req.body.fecha_hora_fin
      ? formatearFechaHoraStr(req.body.fecha_hora_fin)
      : calcularFechaHoraFinStr(inicioStr, duracion);

    if (!inicioStr || !finStr) {
      return res.status(400).json({
        error: "Fecha u hora de reprogramación inválida.",
      });
    }

    const haySolapamiento = await validarSolapaminetoHorarios(
      inicioStr,
      finStr,
      null,
    );

    if (haySolapamiento) {
      return res.status(409).json({
        error:
          "El horario seleccionado se superpone con un turno ya programado.",
      });
    }

    // Estados oficiales relacionales
    const estadoInasistente = await EstadoTurno.findOne({ where: { estado: "Inasistente" } });
    const idEstadoInasistente = estadoInasistente ? estadoInasistente.id_estado : 4;

    const estadoProgramado = await EstadoTurno.findOne({ where: { estado: "Programado" } });
    const idEstadoProgramado = estadoProgramado ? estadoProgramado.id_estado : 1;

    const nuevoTurnoCompleto = await sequelize.transaction(async (t) => {
      // 1. Marcar el turno original como Inasistente (id_estado = 4) sin eliminarlo
      await turnoOriginal.update(
        {
          id_estado: idEstadoInasistente,
        },
        { transaction: t },
      );

      await HistorialEstadoTurno.create(
        {
          id_turno: turnoOriginal.id_turno,
          id_estado: idEstadoInasistente,
          fecha_hora_cambio: new Date(),
          descripcion: `Turno marcado como inasistente por reprogramación para el ${inicioStr}`,
        },
        { transaction: t },
      );

      // 2. Obtener las prácticas a asignar a la nueva cita
      const practicasIds = [];
      if (req.body.id_practica) practicasIds.push(Number(req.body.id_practica));
      if (Array.isArray(req.body.id_practicas)) {
        req.body.id_practicas.forEach((id) => {
          const num = Number(id);
          if (num && !practicasIds.includes(num)) practicasIds.push(num);
        });
      }
      if (Array.isArray(req.body.practicas)) {
        req.body.practicas.forEach((p) => {
          const num = typeof p === "object" && p ? Number(p.id_practica || p.id) : Number(p);
          if (num && !practicasIds.includes(num)) practicasIds.push(num);
        });
      }
      if (Array.isArray(req.body.practicas_realizadas)) {
        req.body.practicas_realizadas.forEach((p) => {
          const num = typeof p === "object" && p ? Number(p.id_practica || p.id) : Number(p);
          if (num && !practicasIds.includes(num)) practicasIds.push(num);
        });
      }

      // Si no vinieron prácticas en el body, copiar las del turno original
      if (practicasIds.length === 0) {
        const practicasOriginales = await PracticaTurno.findAll({
          where: { id_turno: turnoOriginal.id_turno },
          transaction: t,
        });
        practicasOriginales.forEach((pt) => {
          if (!practicasIds.includes(pt.id_practica)) {
            practicasIds.push(pt.id_practica);
          }
        });
      }

      // 3. Calcular el precio del nuevo turno
      let sumaPracticas = 0;
      let practicasEncontradas = [];
      if (practicasIds.length > 0) {
        practicasEncontradas = await Practica.findAll({
          where: { id_practica: { [Op.in]: practicasIds } },
          transaction: t,
        });
        sumaPracticas = practicasEncontradas.reduce(
          (acc, p) => acc + (Number(p.precio_referencia) || 0),
          0
        );
      }

      let precioNuevo = sumaPracticas;
      if (precioNuevo === 0 && req.body.precio_final !== undefined && req.body.precio_final !== null && !isNaN(Number(req.body.precio_final))) {
        precioNuevo = Number(req.body.precio_final);
      } else if (precioNuevo === 0 && turnoOriginal.precio_final) {
        precioNuevo = Number(turnoOriginal.precio_final);
      }

      const motivoTexto =
        req.body.motivo_consulta !== undefined
          ? (req.body.motivo_consulta ? String(req.body.motivo_consulta).trim() : null)
          : turnoOriginal.motivo_consulta;

      // 4. Crear el nuevo turno en estado Programado (id_estado = 1)
      let idObraSocialReprog = null;
      if (req.body.id_obra_social !== undefined && req.body.id_obra_social !== null && !isNaN(Number(req.body.id_obra_social))) {
        idObraSocialReprog = Number(req.body.id_obra_social);
      } else if (req.body.obras_sociales_utilizadas !== undefined && Array.isArray(req.body.obras_sociales_utilizadas)) {
        const firstOS = req.body.obras_sociales_utilizadas[0];
        const osId = typeof firstOS === "object" && firstOS !== null ? (firstOS.id_obra_social || firstOS.id) : firstOS;
        idObraSocialReprog = osId && !isNaN(Number(osId)) ? Number(osId) : null;
      } else {
        const ptOriginal = await PracticaTurno.findOne({ where: { id_turno: turnoOriginal.id_turno }, transaction: t });
        if (ptOriginal && ptOriginal.id_obra_social) {
          idObraSocialReprog = ptOriginal.id_obra_social;
        }
      }

      const nuevoTurno = await Turno.create(
        {
          id_paciente: req.body.id_paciente ? Number(req.body.id_paciente) : turnoOriginal.id_paciente,
          id_estado: idEstadoProgramado,
          fecha_hora_inicio: inicioStr,
          fecha_hora_fin: finStr,
          precio_final: precioNuevo,
          motivo_consulta: motivoTexto,
          notas_consulta: req.body.notas_consulta || null,
        },
        { transaction: t },
      );

      await HistorialEstadoTurno.create(
        {
          id_turno: nuevoTurno.id_turno,
          id_estado: idEstadoProgramado,
          fecha_hora_cambio: new Date(),
          descripcion: `Turno programado (reprogramación del turno #${turnoOriginal.id_turno})`,
        },
        { transaction: t },
      );

      // 5. Copiar / vincular las prácticas a la nueva cita asignando precio_aplicado e id_obra_social
      if (practicasIds.length > 0) {
        for (const pid of practicasIds) {
          const pModel = practicasEncontradas.find((p) => p.id_practica === pid);
          await PracticaTurno.create(
            {
              id_turno: nuevoTurno.id_turno,
              id_practica: pid,
              precio_aplicado: pModel ? (Number(pModel.precio_referencia) || 0) : 0,
              id_obra_social: idObraSocialReprog,
            },
            { transaction: t }
          );
        }
      }

      return await Turno.findByPk(nuevoTurno.id_turno, {
        include: defaultTurnoIncludes,
        transaction: t,
      });
    });

    res.status(200).json({
      status: "success",
      message: "Turno reprogramado exitosamente. El turno previo quedó como Inasistente y se agendó la nueva cita como Programada.",
      data: formatearTurnoResponse(nuevoTurnoCompleto),
      turnoOriginal: {
        id_turno: turnoOriginal.id_turno,
        id_estado: idEstadoInasistente,
        estado: "Inasistente",
      },
    });
  } catch (error) {
    console.error("Error al reprogramar turno:", error);
    res.status(500).json({ error: "Error interno al reprogramar el turno." });
  }
};

// Eliminar un turno existente
export const deleteTurno = async (req, res) => {
  try {
    const turno = req.turno;

    await turno.destroy();

    res.status(200).json({ message: "Turno eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el turno:", error);
    res.status(500).json({ error: "Error al eliminar el turno" });
  }
};
