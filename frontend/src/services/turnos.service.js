

import api from './api';

export const ESTADOS_TURNO = {
  PROGRAMADO: { id_estado: 1, nombre: 'Programado' },
  CANCELADO: { id_estado: 2, nombre: 'Cancelado' },
  ATENDIDO: { id_estado: 3, nombre: 'Atendido' },
  INASISTENTE: { id_estado: 4, nombre: 'Inasistente' }
};

export const getEstadoInfo = (idOrName) => {
  if (typeof idOrName === 'number') {
    return Object.values(ESTADOS_TURNO).find((e) => e.id_estado === idOrName) || ESTADOS_TURNO.PROGRAMADO;
  }
  const match = Object.values(ESTADOS_TURNO).find(
    (e) => e.nombre.toLowerCase() === String(idOrName).toLowerCase()
  );
  return match || ESTADOS_TURNO.PROGRAMADO;
};

export const getTodayISO = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const sumarMinutosAHora = (horaStr, minutosASumar) => {
  const [hh, mm] = (horaStr || '08:00').split(':').map(Number);
  const totalMin = hh * 60 + mm + minutosASumar;
  const nuevoH = Math.floor(totalMin / 60);
  const nuevoM = totalMin % 60;
  return `${String(nuevoH).padStart(2, '0')}:${String(nuevoM).padStart(2, '0')}`;
};

export const unpackArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.rows)) return res.rows;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.rows)) return res.data.rows;
  return [];
};

export const unpackObject = (res) => {
  if (!res) return null;
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
  return res;
};

export const normalizarTurno = (t) => {
  if (!t) return t;
  const fechaHoraInicio = t.fecha_hora_inicio ? String(t.fecha_hora_inicio) : '';
  const fechaHoraFin = t.fecha_hora_fin ? String(t.fecha_hora_fin) : '';
  const fecha = t.fecha || (fechaHoraInicio ? fechaHoraInicio.slice(0, 10) : getTodayISO());
  const hora = t.hora || (fechaHoraInicio && fechaHoraInicio.length >= 16 ? fechaHoraInicio.slice(11, 16) : '08:00');
  const horaFin = t.horaFin || (fechaHoraFin && fechaHoraFin.length >= 16 ? fechaHoraFin.slice(11, 16) : sumarMinutosAHora(hora, 30));

  const paciente = t.paciente || t.Paciente || null;
  const estadoObj = t.EstadoTurno || t.estado || null;

  const rawEstadoNombre =
    (typeof estadoObj === 'object' && estadoObj ? estadoObj.estado : null) ||
    t.estado_nombre ||
    (typeof t.estado === 'string' ? t.estado : null);

  let idEstadoNormalizado = t.id_estado;
  let estadoNombreFinal = rawEstadoNombre || 'Programado';

  if (rawEstadoNombre) {
    const lower = rawEstadoNombre.toLowerCase();
    if (lower === 'programado' || lower === 'reprogramado') {
      idEstadoNormalizado = 1;
      estadoNombreFinal = 'Programado';
    } else if (lower === 'cancelado') {
      idEstadoNormalizado = 2;
      estadoNombreFinal = 'Cancelado';
    } else if (lower === 'atendido') {
      idEstadoNormalizado = 3;
      estadoNombreFinal = 'Atendido';
    } else if (lower === 'inasistente') {
      idEstadoNormalizado = 4;
      estadoNombreFinal = 'Inasistente';
    }
  } else if (t.id_estado) {
    const estadoInfo = getEstadoInfo(t.id_estado);
    estadoNombreFinal = estadoInfo.nombre;
    idEstadoNormalizado = estadoInfo.id_estado;
  }

  const practicasList =
    (Array.isArray(t.practicas_realizadas) && t.practicas_realizadas.length > 0 ? t.practicas_realizadas : null) ||
    (Array.isArray(t.practicas) && t.practicas.length > 0 ? t.practicas : null) ||
    (Array.isArray(t.Practicas) && t.Practicas.length > 0 ? t.Practicas : null) ||
    (t.practica ? [t.practica] : []);

  const totalCalculado =
    t.total !== undefined && t.total !== null
      ? Number(t.total)
      : (t.precio_final !== undefined && t.precio_final !== null
        ? Number(t.precio_final)
        : practicasList.reduce((acc, p) => acc + (parseFloat(p.precio_referencia) || 0), 0));

  const primeraPractica =
    t.practica ||
    (practicasList.length > 0 ? practicasList[0] : null);

  return {
    ...t,
    id_estado: idEstadoNormalizado,
    estado_nombre: estadoNombreFinal,
    fecha,
    hora,
    horaFin,
    paciente,
    practica: primeraPractica,
    practicas: practicasList,
    practicas_realizadas: practicasList,
    total: totalCalculado,
    precio_final: totalCalculado,
    id_obra_social: t.id_obra_social || t.ObraSocial?.id_obra_social || t.obra_social?.id_obra_social || null,
    obra_social_usada: t.obra_social_usada || (t.id_obra_social && Number(t.id_obra_social) > 1 ? (t.obra_social || t.ObraSocial) : null),
    obra_social: t.obra_social || t.ObraSocial || null,
    obras_sociales_utilizadas:
      (Array.isArray(t.obras_sociales_utilizadas) && t.obras_sociales_utilizadas.length > 0
        ? t.obras_sociales_utilizadas
        : (t.ObraSocial ? [t.ObraSocial] : (t.obra_social ? [t.obra_social] : (Array.isArray(t.ObraSocials) && t.ObraSocials.length > 0 ? t.ObraSocials : [])))),
    motivo_consulta: t.motivo_consulta ? String(t.motivo_consulta).trim() : '',
    notas_consulta: t.notas_consulta ? String(t.notas_consulta).trim() : '',
    observaciones: t.notas_consulta ? String(t.notas_consulta).trim() : (t.observaciones || '')
  };
};

export const generarFranjas15Min = (horaInicio = '08:00', horaFin = '18:00') => {
  const franjas = [];
  const [hIni, mIni] = horaInicio.split(':').map(Number);
  const [hFin, mFin] = horaFin.split(':').map(Number);
  let totalMin = hIni * 60 + mIni;
  const maxMin = hFin * 60 + mFin;

  while (totalMin <= maxMin) {
    const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const mm = String(totalMin % 60).padStart(2, '0');
    franjas.push(`${hh}:${mm}`);
    totalMin += 15;
  }
  return franjas;
};

export const HORARIOS_HABILES = generarFranjas15Min('08:00', '18:00');

export const getHorariosHabiles = () => {
  return HORARIOS_HABILES;
};

/**
 * Calcula la cantidad de bloques de 15 minutos, hora de inicio y hora de fin de un turno
 * @param {Object} turno
 * @returns {{ duracionMinutos: number, bloques: number, horaInicio: string, horaFin: string }}
 */
export const calcularBloquesTurno = (turno) => {
  if (!turno || turno.es_disponible || !turno.id_turno) {
    const horaBase = turno?.hora || '08:00';
    return {
      duracionMinutos: 15,
      bloques: 1,
      horaInicio: horaBase,
      horaFin: sumarMinutosAHora(horaBase, 15)
    };
  }

  let duracionMin = 0;

  if (turno.fecha_hora_inicio && turno.fecha_hora_fin) {
    try {
      const inicio = new Date(turno.fecha_hora_inicio.replace(' ', 'T'));
      const fin = new Date(turno.fecha_hora_fin.replace(' ', 'T'));
      const diffMin = Math.round((fin.getTime() - inicio.getTime()) / 60000);
      if (diffMin > 0 && diffMin <= 480) {
        duracionMin = diffMin;
      }
    } catch {
      /* empty */
    }
  }

  if (!duracionMin) {
    if (turno.duracion_minutos) {
      duracionMin = Number(turno.duracion_minutos);
    } else if (turno.practica?.duracion_minutos) {
      duracionMin = Number(turno.practica.duracion_minutos);
    } else if (turno.practica?.modulos) {
      duracionMin = Number(turno.practica.modulos) * 15;
    } else if (turno.modulos) {
      duracionMin = Number(turno.modulos) * 15;
    } else {
      duracionMin = 30;
    }
  }

  const bloques = Math.max(1, Math.round(duracionMin / 15));
  const horaInicio = turno.hora || (turno.fecha_hora_inicio ? turno.fecha_hora_inicio.slice(11, 16) : '08:00');
  const horaFin = sumarMinutosAHora(horaInicio, duracionMin);

  return {
    duracionMinutos: bloques * 15,
    bloques,
    horaInicio,
    horaFin
  };
};

/**
 * Retorna un Set con todas las franjas horarias de 15 minutos ocupadas por turnos activos en el día
 * @param {Array} turnosDelDia
 * @param {number|string} [idTurnoExcluir]
 * @returns {Set<string>}
 */
export const getHorasOcupadasDia = (turnosDelDia = [], idTurnoExcluir = null) => {
  const horasOcupadas = new Set();
  const idExcluirStr = idTurnoExcluir ? String(idTurnoExcluir) : null;

  (turnosDelDia || []).forEach((t) => {
    if (t.es_disponible || !t.id_turno) return;
    const esCancelado =
      t.id_estado === 2 ||
      String(t.estado_nombre).toLowerCase() === 'cancelado' ||
      String(t.estado).toLowerCase() === 'cancelado';
    if (esCancelado) return;
    if (idExcluirStr && String(t.id_turno) === idExcluirStr) return;

    const { bloques, horaInicio } = calcularBloquesTurno(t);
    for (let b = 0; b < bloques; b++) {
      horasOcupadas.add(sumarMinutosAHora(horaInicio, b * 15));
    }
  });

  return horasOcupadas;
};

/**
 * Convierte 'HH:mm' a minutos transcurridos desde medianoche
 * @param {string} horaStr
 * @returns {number}
 */
export const horaAMinutos = (horaStr) => {
  if (!horaStr || typeof horaStr !== 'string') return 0;
  const [h, m] = horaStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Verifica si un nuevo intervalo propuesto entra en conflicto con los turnos activos de ese día
 * @param {Array} turnosDelDia
 * @param {string} nuevaHoraInicio HH:mm
 * @param {number} duracionMinutos
 * @param {number|string} [idTurnoExcluir]
 * @returns {boolean}
 */
export const haySuperposicionTurnos = (turnosDelDia = [], nuevaHoraInicio, duracionMinutos, idTurnoExcluir = null) => {
  if (!nuevaHoraInicio || !duracionMinutos) return false;
  const nuevoInicio = horaAMinutos(nuevaHoraInicio);
  const nuevoFin = nuevoInicio + Number(duracionMinutos);
  const idExcluirStr = idTurnoExcluir !== null && idTurnoExcluir !== undefined ? String(idTurnoExcluir) : null;

  return (turnosDelDia || [])
    .filter((t) => {
      if (t.es_disponible || !t.id_turno) return false;
      if (idExcluirStr && String(t.id_turno) === idExcluirStr) return false;
      const esCancelado =
        t.id_estado === 2 ||
        String(t.estado_nombre).toLowerCase() === 'cancelado' ||
        String(t.estado).toLowerCase() === 'cancelado';
      if (esCancelado) return false;
      return true;
    })
    .some((t) => {
      const horaT = t.hora || (t.fecha_hora_inicio ? t.fecha_hora_inicio.slice(11, 16) : '08:00');
      const turnoInicio = horaAMinutos(horaT);
      const duracionExistente = Number(t.duracion_minutos) || (t.practica?.duracion_minutos ? Number(t.practica.duracion_minutos) : (t.practica?.modulos ? Number(t.practica.modulos) * 15 : 30));
      const turnoFin = turnoInicio + duracionExistente;

      return nuevoInicio < turnoFin && nuevoFin > turnoInicio;
    });
};

/**
 * Sanitiza una lista de turnos eliminando turnos superpuestos
 * @param {Array} turnos
 * @returns {Array}
 */
export const sanitizarTurnosSuperpuestos = (turnos = []) => {
  if (!Array.isArray(turnos)) return [];
  const ordenados = [...turnos].sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
  const validos = [];

  for (const t of ordenados) {
    if (t.es_disponible || !t.id_turno) {
      validos.push(t);
      continue;
    }
    if (t.id_estado === 3 || t.estado_nombre === 'Cancelado') {
      validos.push(t);
      continue;
    }

    const duracion = t.practica?.duracion_minutos || (t.practica?.modulos ? t.practica.modulos * 15 : 30);
    const colisiona = haySuperposicionTurnos(validos, t.hora, duracion, t.id_turno);
    if (!colisiona) {
      validos.push(t);
    }
  }

  return validos;
};

/**
 * Calcula la diferencia en minutos entre dos horas HH:mm
 * @param {string} horaFin
 * @param {string} horaInicio
 * @returns {number}
 */
export const calcularMinutosDiff = (horaFin, horaInicio) => {
  if (!horaFin || !horaInicio) return 0;
  const [h1, m1] = horaFin.split(':').map(Number);
  const [h2, m2] = horaInicio.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
};

/**
 * Formatea el texto de una franja disponible entre turnos
 * @param {string} hFin
 * @param {string} hIni
 * @param {number} diffMinutos
 * @returns {string}
 */
export const formatearTextoBache = (hFin, hIni, diffMinutos) => {
  let duracionStr;
  if (diffMinutos < 60) {
    duracionStr = `${diffMinutos} min`;
  } else {
    const horas = Math.floor(diffMinutos / 60);
    const mins = diffMinutos % 60;
    duracionStr = mins === 0 ? `${horas} h` : `${horas} h ${mins} min`;
  }
  return `Espacio disponible: ${hFin} a ${hIni} (${duracionStr})`;
};

/**
 * Construye la lista de filas para la grilla de la agenda con divisores de bache
 * @param {Array} turnosReales
 * @returns {Array<Object>}
 */
export const construirFilasAgendaConBaches = (turnosReales = []) => {
  const normalizados = (turnosReales || [])
    .filter((t) => !t.es_disponible && Boolean(t.id_turno))
    .map(normalizarTurno);

  const ordenados = [...normalizados].sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));

  const filas = [];

  for (let i = 0; i < ordenados.length; i++) {
    const turnoActual = ordenados[i];
    const { duracionMinutos, bloques, horaInicio, horaFin } = calcularBloquesTurno(turnoActual);

    if (i > 0) {
      const turnoAnterior = ordenados[i - 1];
      const infoAnterior = calcularBloquesTurno(turnoAnterior);
      const diff = calcularMinutosDiff(infoAnterior.horaFin, horaInicio);

      if (diff >= 15) {
        filas.push({
          key: `bache-${infoAnterior.horaFin}-${horaInicio}`,
          tipo: 'bache',
          horaInicio: infoAnterior.horaFin,
          horaFin: horaInicio,
          duracionMinutos: diff,
          texto: formatearTextoBache(infoAnterior.horaFin, horaInicio, diff)
        });
      }
    }

    filas.push({
      key: `tur-${turnoActual.id_turno}`,
      tipo: 'turno',
      hora: horaInicio,
      horaFin: horaFin,
      duracionMinutos,
      bloques,
      turno: {
        ...turnoActual,
        hora: horaInicio,
        fecha_hora_fin: turnoActual.fecha_hora_fin || `${turnoActual.fecha} ${horaFin}:00`
      }
    });
  }

  return filas;
};

/**
 * Construye la lista de filas para la grilla de la agenda con resolución de 15 minutos
 * @param {Array} turnosDelDia
 * @param {string} fecha YYYY-MM-DD
 * @returns {Array<Object>}
 */
export const construirAgendaConBloquesExtendidos = (turnosDelDia = [], fecha = getTodayISO()) => {
  const turnosReales = (turnosDelDia || []).filter(
    (t) => !t.es_disponible && Boolean(t.id_turno)
  );

  const raicesMap = new Map();
  const subsumidasMap = new Map();

  turnosReales.forEach((t) => {
    const { duracionMinutos, bloques, horaInicio, horaFin } = calcularBloquesTurno(t);
    raicesMap.set(horaInicio, {
      turno: t,
      duracionMinutos,
      bloques,
      horaInicio,
      horaFin
    });

    for (let b = 1; b < bloques; b++) {
      const subHora = sumarMinutosAHora(horaInicio, b * 15);
      subsumidasMap.set(subHora, {
        parentTurno: t,
        parentHoraInicio: horaInicio,
        duracionMinutos,
        bloques,
        horaFin
      });
    }
  });

  const todasLasHoras = new Set(HORARIOS_HABILES);
  turnosReales.forEach((t) => {
    if (t.hora) todasLasHoras.add(t.hora);
  });
  const franjasOrdenadas = Array.from(todasLasHoras).sort((a, b) => a.localeCompare(b));

  const filas = [];

  for (const h of franjasOrdenadas) {
    if (raicesMap.has(h)) {
      const info = raicesMap.get(h);
      filas.push({
        key: `tur-${info.turno.id_turno}`,
        tipo: 'turno',
        hora: h,
        horaFin: info.horaFin,
        duracionMinutos: info.duracionMinutos,
        bloques: info.bloques,
        rowSpan: info.bloques,
        esSubsumido: false,
        turno: {
          ...info.turno,
          hora: h,
          fecha_hora_fin: info.turno.fecha_hora_fin || `${fecha} ${info.horaFin}:00`
        }
      });
    } else if (subsumidasMap.has(h)) {
      const subInfo = subsumidasMap.get(h);
      filas.push({
        key: `sub-${subInfo.parentTurno.id_turno}-${h}`,
        tipo: 'subsumido',
        hora: h,
        horaFin: subInfo.horaFin,
        duracionMinutos: subInfo.duracionMinutos,
        bloques: subInfo.bloques,
        rowSpan: 0,
        esSubsumido: true,
        turno: {
          ...subInfo.parentTurno,
          hora: h
        }
      });
    } else {
      const existingFree = (turnosDelDia || []).find(
        (t) => t.hora === h && (t.es_disponible || !t.id_turno)
      );
      const horaFinSlot = sumarMinutosAHora(h, 15);

      filas.push({
        key: `free-${h}`,
        tipo: 'disponible',
        hora: h,
        horaFin: horaFinSlot,
        duracionMinutos: 15,
        bloques: 1,
        rowSpan: 1,
        esSubsumido: false,
        turno: existingFree || {
          id_turno: null,
          es_disponible: true,
          id_estado: null,
          estado_nombre: 'Disponible',
          fecha: fecha,
          hora: h,
          fecha_hora_inicio: `${fecha} ${h}:00`,
          fecha_hora_fin: `${fecha} ${horaFinSlot}:00`
        }
      });
    }
  }

  return filas;
};

/**
 * Obtener turnos programados para una fecha específica
 * GET /turnos?fecha=YYYY-MM-DD
 * @param {string} fecha YYYY-MM-DD
 * @returns {Promise<Array>}
 */
export const getTurnosPorFecha = async (fecha = getTodayISO()) => {
  const data = await api.get('/turnos', { params: { fecha } });
  const rawList = unpackArray(data);
  const normalizados = rawList.map(normalizarTurno);
  if (fecha) {
    return normalizados.filter((t) => t.fecha === fecha);
  }
  return normalizados;
};

export const getTurnosDia = getTurnosPorFecha;

/**
 * Obtener detalle de un turno por su ID
 * GET /turnos/:id
 * @param {number|string} id_turno
 * @returns {Promise<Object>}
 */
export const getTurnoById = async (id_turno) => {
  const data = await api.get(`/turnos/${id_turno}`);
  return normalizarTurno(unpackObject(data));
};

/**
 * Crear / Asignar un nuevo turno
 * POST /turnos
 * @param {Object} turno
 * @returns {Promise<Object>}
 */
export const crearTurno = async (turno) => {
  const duracion = Number(turno.duracion_minutos || 30);
  let fechaInicio = turno.fecha_hora_inicio;
  let fechaFin = turno.fecha_hora_fin;

  if (!fechaInicio && turno.fecha && turno.hora) {
    fechaInicio = `${turno.fecha} ${turno.hora}:00`;
  }
  if (!fechaFin && fechaInicio) {
    const s = String(fechaInicio).trim().replace('T', ' ');
    const parts = s.split(' ');
    if (parts.length >= 2) {
      const fechaParte = parts[0];
      const horaParte = parts[1].slice(0, 5);
      const finHora = sumarMinutosAHora(horaParte, duracion);
      fechaFin = `${fechaParte} ${finHora}:00`;
    }
  }

  const practicasArr =
    turno.practicas ||
    turno.id_practicas ||
    turno.practicas_realizadas ||
    (turno.id_practica ? [Number(turno.id_practica)] : []);

  const motivoTexto = String(
    turno.motivo_consulta !== undefined && turno.motivo_consulta !== null
      ? turno.motivo_consulta
      : turno.notas_consulta || turno.observaciones || turno.notas || ''
  ).trim();

  const payload = {
    id_paciente: Number(turno.id_paciente),
    ...(turno.id_practica ? { id_practica: Number(turno.id_practica) } : {}),
    ...(Array.isArray(practicasArr) && practicasArr.length > 0 ? { practicas: practicasArr } : {}),
    id_estado: turno.id_estado ? Number(turno.id_estado) : 1,
    fecha_hora_inicio: fechaInicio,
    fecha_hora_fin: fechaFin,
    duracion_minutos: duracion,
    precio_final: Number(turno.precio_final ?? 0),
    motivo_consulta: motivoTexto || null,
    notas_consulta: null
  };

  const data = await api.post('/turnos', payload);
  return normalizarTurno(unpackObject(data));
};

export const asignarTurno = crearTurno;

/**
 * Reprogramar un turno tras inasistencia o solicitud del paciente
 * POST /turnos/:id/reprogramar
 * @param {number|string} idTurnoOriginal
 * @param {Object|string} nuevoTurnoPayload - Objeto con datos del nuevo turno, o nuevaFecha YYYY-MM-DD
 * @param {string} [nuevaHora] HH:mm si se pasa nuevaFecha como string
 * @returns {Promise<Object>}
 */
export const reprogramarTurno = async (idTurnoOriginal, nuevoTurnoPayload, nuevaHora = null) => {
  let payload =
    typeof nuevoTurnoPayload === 'object' && nuevoTurnoPayload !== null
      ? { ...nuevoTurnoPayload }
      : { fecha: nuevoTurnoPayload, hora: nuevaHora };

  const duracion = Number(payload.duracion_minutos || 30);
  let fechaInicio = payload.fecha_hora_inicio;

  if (!fechaInicio && payload.fecha && payload.hora) {
    fechaInicio = `${payload.fecha} ${payload.hora}:00`;
  }

  let fechaFin = payload.fecha_hora_fin;
  if (!fechaFin && fechaInicio) {
    const s = String(fechaInicio).trim().replace('T', ' ');
    const parts = s.split(' ');
    if (parts.length >= 2) {
      const fechaParte = parts[0];
      const horaParte = parts[1].slice(0, 5);
      const finHora = sumarMinutosAHora(horaParte, duracion);
      fechaFin = `${fechaParte} ${finHora}:00`;
    }
  }

  payload = {
    ...payload,
    idTurnoOriginal,
    id_turno: idTurnoOriginal,
    fecha_hora_inicio: fechaInicio,
    fecha_hora_fin: fechaFin,
    duracion_minutos: duracion
  };

  try {
    const res = await api.post(`/turnos/${idTurnoOriginal}/reprogramar`, payload);
    return normalizarTurno(unpackObject(res));
  } catch (err) {
    if (err.response && err.response.status !== 404) {
      throw err;
    }
    try {
      const res = await api.post(`/turnos/reprogramar`, payload);
      return normalizarTurno(unpackObject(res));
    } catch (err2) {
      if (err2.response && err2.response.status !== 404) {
        throw err2;
      }
      // Fallback en dos pasos: marcar original como inasistente y agendar el nuevo como programado
      try {
        await api.patch(`/turnos/${idTurnoOriginal}/inasistente`, {});
      } catch {
        await api.put(`/turnos/${idTurnoOriginal}`, { id_estado: 4 });
      }
      return await crearTurno({
        ...payload,
        id_estado: 1
      });
    }
  }
};

/**
 * Registrar la atención odontológica realizada en sillón (HU 2)
 * POST /turnos/:id/atencion
 * @param {number|string} idTurno
 * @param {Object} datosAtencion { practicas, observaciones, total }
 * @returns {Promise<Object>}
 */
export const registrarAtencion = async (idTurno, datosAtencion = {}) => {
  const practicasArr =
    datosAtencion.practicas ||
    datosAtencion.id_practicas ||
    datosAtencion.practicas_realizadas ||
    [];

  const precioFinalCalculado =
    datosAtencion.precio_final !== undefined && datosAtencion.precio_final !== null
      ? Number(datosAtencion.precio_final)
      : (datosAtencion.total !== undefined && datosAtencion.total !== null ? Number(datosAtencion.total) : 0);

  const obrasSocialesUtilizadas =
    datosAtencion.obras_sociales_utilizadas ||
    datosAtencion.obrasSocialesUtilizadas ||
    [];

  const idObraSocial =
    datosAtencion.id_obra_social !== undefined
      ? (datosAtencion.id_obra_social ? Number(datosAtencion.id_obra_social) : null)
      : (obrasSocialesUtilizadas.length > 0 ? Number(obrasSocialesUtilizadas[0]) : null);

  const body = {
    practicas: practicasArr,
    id_practicas: practicasArr,
    practicas_realizadas: practicasArr,
    observaciones: datosAtencion.observaciones || datosAtencion.notas_consulta || '',
    notas_consulta: datosAtencion.notas_consulta || datosAtencion.observaciones || '',
    total: precioFinalCalculado,
    precio_final: precioFinalCalculado,
    id_obra_social: idObraSocial,
    obras_sociales_utilizadas: obrasSocialesUtilizadas
  };
  try {
    const res = await api.post(`/turnos/${idTurno}/atencion`, body);
    return normalizarTurno(unpackObject(res));
  } catch {
    const res = await api.patch(`/turnos/${idTurno}/atender`, {
      notas_consulta: body.observaciones,
      practicas_realizadas: body.practicas,
      total: body.total,
      precio_final: body.precio_final,
      id_obra_social: body.id_obra_social,
      obras_sociales_utilizadas: body.obras_sociales_utilizadas
    });
    return normalizarTurno(unpackObject(res));
  }
};

export const registrarAtencionTurno = registrarAtencion;

/**
 * Liberar un turno cancelado o inasistente para habilitar nuevamente el horario
 * PUT /turnos/:id/liberar
 * @param {number|string} idTurno
 * @returns {Promise<Object>}
 */
export const liberarTurno = async (idTurno) => {
  try {
    return await api.put(`/turnos/${idTurno}/liberar`);
  } catch {
    return await api.delete(`/turnos/${idTurno}`);
  }
};

/**
 * Obtener historial clínico completo de un paciente
 * GET /pacientes/:id/historial
 * @param {number|string} idPaciente
 * @returns {Promise<Array>}
 */
export const getHistorialPorPaciente = async (idPaciente) => {
  try {
    const data = await api.get(`/pacientes/${idPaciente}/historial`);
    const rawList = unpackArray(data);
    if (rawList.length > 0) return rawList.map(normalizarTurno);
  } catch {
    // Si no existe la ruta de historial por paciente, consultar turnos
  }

  try {
    const dataTurnos = await api.get('/turnos', { params: { id_paciente: idPaciente } });
    const rawList = unpackArray(dataTurnos);
    return rawList
      .map(normalizarTurno)
      .filter((t) => String(t.id_paciente) === String(idPaciente));
  } catch {
    return [];
  }
};

export const getTurnosAtendidosPorPaciente = getHistorialPorPaciente;
export const getTurnosPorPaciente = getHistorialPorPaciente;

export const actualizarTurno = async (idTurno, camposActualizados = {}) => {
  const payload = { ...camposActualizados };
  if (payload.id_paciente !== undefined) payload.id_paciente = Number(payload.id_paciente);
  if (payload.id_estado !== undefined) payload.id_estado = Number(payload.id_estado);
  if (payload.id_practica !== undefined) payload.id_practica = Number(payload.id_practica);
  if (payload.duracion_minutos !== undefined) payload.duracion_minutos = Number(payload.duracion_minutos);
  if (payload.precio_final !== undefined) payload.precio_final = Number(payload.precio_final);
  if (payload.motivo_consulta !== undefined) {
    payload.motivo_consulta = payload.motivo_consulta ? String(payload.motivo_consulta).trim() : null;
  }
  if (payload.notas_consulta !== undefined || payload.observaciones !== undefined) {
    payload.notas_consulta = String(payload.notas_consulta || payload.observaciones || '').trim();
  }
  const data = await api.put(`/turnos/${idTurno}`, payload);
  return normalizarTurno(unpackObject(data));
};

/**
 * Cambiar estado de un turno
 * @param {number|string} id_turno
 * @param {string|number} nuevoEstado
 * @returns {Promise<Object>}
 */
export const cambiarEstadoTurno = async (id_turno, nuevoEstado) => {
  const estadoInfo = getEstadoInfo(nuevoEstado);
  const nombreLower = estadoInfo.nombre.toLowerCase();

  try {
    if (nombreLower === 'cancelado') {
      const res = await api.patch(`/turnos/${id_turno}/cancelar`, { notas_consulta: '' });
      return normalizarTurno(unpackObject(res));
    } else if (nombreLower === 'inasistente') {
      const res = await api.patch(`/turnos/${id_turno}/inasistente`, {});
      return normalizarTurno(unpackObject(res));
    }
  } catch {
    // Fallback a PUT
  }

  return await actualizarTurno(id_turno, {
    id_estado: estadoInfo.id_estado,
    estado_nombre: estadoInfo.nombre
  });
};

/**
 * Actualizar las notas de consulta clínica de un turno
 * @param {number|string} idTurno
 * @param {string} notasConsulta
 * @returns {Promise<Object>}
 */
export const actualizarNotasConsulta = async (idTurno, notasConsulta) => {
  return await actualizarTurno(idTurno, {
    notas_consulta: typeof notasConsulta === 'string' ? notasConsulta : ''
  });
};

export default {
  ESTADOS_TURNO,
  getEstadoInfo,
  getTodayISO,
  sumarMinutosAHora,
  generarFranjas15Min,
  HORARIOS_HABILES,
  getHorariosHabiles,
  calcularBloquesTurno,
  getHorasOcupadasDia,
  horaAMinutos,
  haySuperposicionTurnos,
  sanitizarTurnosSuperpuestos,
  calcularMinutosDiff,
  formatearTextoBache,
  construirFilasAgendaConBaches,
  construirAgendaConBloquesExtendidos,
  getTurnosPorFecha,
  getTurnosDia,
  getTurnoById,
  crearTurno,
  asignarTurno,
  reprogramarTurno,
  registrarAtencion,
  registrarAtencionTurno,
  liberarTurno,
  getHistorialPorPaciente,
  getTurnosAtendidosPorPaciente,
  getTurnosPorPaciente,
  actualizarTurno,
  cambiarEstadoTurno,
  actualizarNotasConsulta
};
