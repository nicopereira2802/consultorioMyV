import { ObraSocial } from "../models/index.model.js";

export const formatearFechaHoraStr = (fechaHoraInput) => {
  if (!fechaHoraInput) return null;
  if (typeof fechaHoraInput === "string") {
    if (fechaHoraInput.includes("Z")) {
      const d = new Date(fechaHoraInput);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    }
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
  if (typeof inicioStr === "string" && inicioStr.includes("Z")) {
    const d = new Date(inicioStr);
    return new Date(d.getTime() + dur * 60000).toISOString();
  }
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

  // Si no está en las prácticas, revisar si vino registrado directamente en el turno
  if (ptIdOS === null && json.id_obra_social !== undefined && json.id_obra_social !== null) {
    ptIdOS = Number(json.id_obra_social);
  }

  // Identificar obra social utilizada (si es > 1 y no Particular)
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

  // Historial de estados ordenado cronológicamente
  const rawHistorial = json.historial || json.HistorialEstadoTurnos || [];
  json.historial = Array.isArray(rawHistorial)
    ? [...rawHistorial].sort((a, b) => new Date(a.fecha_hora_cambio) - new Date(b.fecha_hora_cambio))
    : [];

  // Extraer última nota de atención médica (Atendido)
  const registroAtendido = [...json.historial].reverse().find(
    (h) => h.id_estado === 3 || h.EstadoTurno?.estado === "Atendido" || h.estado === "Atendido"
  );
  const evolucionHistorial = registroAtendido ? registroAtendido.descripcion : null;
  json.descripcion_atencion = evolucionHistorial;

  // Extraer última nota de cancelación (Cancelado)
  const registroCancelado = [...json.historial].reverse().find(
    (h) => h.id_estado === 2 || h.EstadoTurno?.estado === "Cancelado" || h.estado === "Cancelado"
  );
  const motivoCancelacion = registroCancelado ? registroCancelado.descripcion : null;
  json.motivo_cancelacion = motivoCancelacion;

  // Extraer última nota de inasistencia (Inasistente)
  const registroInasistente = [...json.historial].reverse().find(
    (h) => h.id_estado === 4 || h.EstadoTurno?.estado === "Inasistente" || h.estado === "Inasistente"
  );
  const motivoInasistencia = registroInasistente ? registroInasistente.descripcion : null;
  json.motivo_inasistencia = motivoInasistencia;

  // Resolver el campo genérico observaciones según el estado actual
  const estadoStr = json.EstadoTurno?.estado;
  if (json.id_estado === 2 || estadoStr === "Cancelado") {
    json.observaciones = motivoCancelacion || json.notas_consulta || "";
  } else if (json.id_estado === 3 || estadoStr === "Atendido") {
    json.observaciones = evolucionHistorial || json.notas_consulta || "";
  } else if (json.id_estado === 4 || estadoStr === "Inasistente") {
    json.observaciones = motivoInasistencia || json.notas_consulta || "";
  } else {
    json.observaciones = json.notas_consulta || "";
  }

  return json;
};

// --- 1. CATÁLOGO EN MEMORIA DE OBRAS SOCIALES (Necesario para el formateador) ---
export const nombresObrasSocialesMap = new Map();
export const cargarNombresObrasSociales = async () => {
  try {
    const list = await ObraSocial.findAll({ attributes: ["id_obra_social", "nombre"] });
    list.forEach((os) => nombresObrasSocialesMap.set(Number(os.id_obra_social), os.nombre));
  } catch {
    // Catálogo inicial vacío si aún no se migraron tablas
  }
};
cargarNombresObrasSociales();


// --- 2. HELPER: EXTRACTOR DE PRÁCTICAS (Reemplaza los ifs repetidos en el controlador) ---
export const extraerIdsPracticas = (body) => {
  const ids = new Set();
  const { id_practica, id_practicas, practicas, practicas_realizadas } = body;

  if (id_practica) ids.add(Number(id_practica));
  
  const agregarAlSet = (arr) => {
    if (Array.isArray(arr)) {
      arr.forEach(p => {
        const num = typeof p === "object" && p ? Number(p.id_practica || p.id) : Number(p);
        if (!isNaN(num)) ids.add(num);
      });
    }
  };

  agregarAlSet(id_practicas);
  agregarAlSet(practicas);
  agregarAlSet(practicas_realizadas);

  return [...ids].filter(id => !isNaN(id) && id > 0);
};


// --- 3. HELPER: EXTRACTOR DE OBRA SOCIAL (Maneja las distintas variantes del Frontend) ---
export const obtenerObraSocialBody = (body) => {
  if (body.id_obra_social !== undefined && body.id_obra_social !== null && !isNaN(Number(body.id_obra_social))) {
    return Number(body.id_obra_social);
  }
  if (body.obras_sociales_utilizadas && Array.isArray(body.obras_sociales_utilizadas) && body.obras_sociales_utilizadas.length > 0) {
    const firstOS = body.obras_sociales_utilizadas[0];
    const osId = typeof firstOS === "object" && firstOS !== null ? (firstOS.id_obra_social || firstOS.id) : firstOS;
    return osId && !isNaN(Number(osId)) ? Number(osId) : null;
  }
  return null;
};