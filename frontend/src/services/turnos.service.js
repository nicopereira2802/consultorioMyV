

import api from './api';

export const ESTADOS_TURNO = {
  PROGRAMADO: { id_estado: 1, nombre: 'Programado' },
  REPROGRAMADO: { id_estado: 2, nombre: 'Reprogramado' },
  CANCELADO: { id_estado: 3, nombre: 'Cancelado' },
  ATENDIDO: { id_estado: 4, nombre: 'Atendido' },
  INASISTENTE: { id_estado: 5, nombre: 'Inasistente' }
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
    if (t.es_disponible || !t.id_turno || t.id_estado === 3) return;
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
      if (t.id_estado === 3 || t.estado_nombre === 'Cancelado') return false;
      return true;
    })
    .some((t) => {
      const horaT = t.hora || (t.fecha_hora_inicio ? t.fecha_hora_inicio.slice(11, 16) : '08:00');
      const turnoInicio = horaAMinutos(horaT);
      const duracionExistente = t.duracion_minutos || t.practica?.duracion_minutos || (t.practica?.modulos ? t.practica.modulos * 15 : 30);
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
    } else {
      console.warn(`[sanitizarTurnosSuperpuestos] Removiendo turno con solapamiento: ID ${t.id_turno} (${t.hora} hs)`);
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
  const ordenados = [...turnosReales]
    .filter((t) => !t.es_disponible && Boolean(t.id_turno))
    .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));

  const filas = [];

  for (let i = 0; i < ordenados.length; i++) {
    const turnoActual = ordenados[i];
    const { duracionMinutos, bloques, horaFin } = calcularBloquesTurno(turnoActual);

    if (i > 0) {
      const turnoAnterior = ordenados[i - 1];
      const infoAnterior = calcularBloquesTurno(turnoAnterior);
      const diff = calcularMinutosDiff(infoAnterior.horaFin, turnoActual.hora);

      if (diff >= 15) {
        filas.push({
          key: `bache-${infoAnterior.horaFin}-${turnoActual.hora}`,
          tipo: 'bache',
          horaInicio: infoAnterior.horaFin,
          horaFin: turnoActual.hora,
          duracionMinutos: diff,
          texto: formatearTextoBache(infoAnterior.horaFin, turnoActual.hora, diff)
        });
      }
    }

    filas.push({
      key: `tur-${turnoActual.id_turno}`,
      tipo: 'turno',
      hora: turnoActual.hora,
      horaFin: horaFin,
      duracionMinutos,
      bloques,
      turno: {
        ...turnoActual,
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
  return Array.isArray(data) ? data : [];
};

export const getTurnosDia = getTurnosPorFecha;

/**
 * Obtener detalle de un turno por su ID
 * GET /turnos/:id
 * @param {number|string} id_turno
 * @returns {Promise<Object>}
 */
export const getTurnoById = async (id_turno) => {
  return await api.get(`/turnos/${id_turno}`);
};

/**
 * Crear / Asignar un nuevo turno
 * POST /turnos
 * @param {Object} turno
 * @returns {Promise<Object>}
 */
export const crearTurno = async (turno) => {
  return await api.post('/turnos', turno);
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
  const payload = typeof nuevoTurnoPayload === 'object' && nuevoTurnoPayload !== null
    ? nuevoTurnoPayload
    : { fecha: nuevoTurnoPayload, hora: nuevaHora };
  return await api.post(`/turnos/${idTurnoOriginal}/reprogramar`, payload);
};

/**
 * Registrar la atención odontológica realizada en sillón (HU 2)
 * POST /turnos/:id/atencion
 * @param {number|string} idTurno
 * @param {Object} datosAtencion { practicas, observaciones, total }
 * @returns {Promise<Object>}
 */
export const registrarAtencion = async (idTurno, datosAtencion = {}) => {
  const body = {
    practicas: datosAtencion.practicas || datosAtencion.id_practicas || datosAtencion.practicas_realizadas || [],
    observaciones: datosAtencion.observaciones || datosAtencion.notas_consulta || '',
    total: datosAtencion.total !== undefined ? datosAtencion.total : (datosAtencion.precio_final || 0)
  };
  return await api.post(`/turnos/${idTurno}/atencion`, body);
};

export const registrarAtencionTurno = registrarAtencion;

/**
 * Liberar un turno cancelado o inasistente para habilitar nuevamente el horario
 * PUT /turnos/:id/liberar
 * @param {number|string} idTurno
 * @returns {Promise<Object>}
 */
export const liberarTurno = async (idTurno) => {
  return await api.put(`/turnos/${idTurno}/liberar`);
};

/**
 * Obtener historial clínico completo de un paciente
 * GET /pacientes/:id/historial
 * @param {number|string} idPaciente
 * @returns {Promise<Array>}
 */
export const getHistorialPorPaciente = async (idPaciente) => {
  const data = await api.get(`/pacientes/${idPaciente}/historial`);
  return Array.isArray(data) ? data : [];
};

export const getTurnosAtendidosPorPaciente = getHistorialPorPaciente;
export const getTurnosPorPaciente = getHistorialPorPaciente;

/**
 * Actualizar campos de un turno existente
 * PUT /turnos/:id
 * @param {number|string} idTurno
 * @param {Object} camposActualizados
 * @returns {Promise<Object>}
 */
export const actualizarTurno = async (idTurno, camposActualizados = {}) => {
  return await api.put(`/turnos/${idTurno}`, camposActualizados);
};

/**
 * Cambiar estado de un turno
 * @param {number|string} id_turno
 * @param {string|number} nuevoEstado
 * @returns {Promise<Object>}
 */
export const cambiarEstadoTurno = async (id_turno, nuevoEstado) => {
  const estadoInfo = getEstadoInfo(nuevoEstado);
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
