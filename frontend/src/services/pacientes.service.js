
import api from './api';

let pacientesCache = [];

/**
 * Desempaqueta respuestas tanto en formato { rows, count } como { data: [...] } o [...]
 */
const unpackArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.rows)) return res.rows;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.rows)) return res.data.rows;
  return [];
};

const unpackObject = (res) => {
  if (!res) return null;
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
  return res;
};

const normalizarPaciente = (p) => {
  if (!p) return p;

  let obrasSocialesList = [];
  if (Array.isArray(p.ObraSocials) && p.ObraSocials.length > 0) {
    obrasSocialesList = p.ObraSocials
      .filter((os) => os.PacienteObraSocial?.activo !== false && os.PacienteObraSocial?.activo !== 0)
      .map((os) => ({
        id_obra_social: os.id_obra_social,
        nombre: os.nombre,
        nro_afiliado: os.PacienteObraSocial?.nro_afiliado || os.nro_afiliado || '',
        activo: true,
      }));
  } else if (Array.isArray(p.obras_sociales) && p.obras_sociales.length > 0) {
    obrasSocialesList = p.obras_sociales
      .filter((os) => os.activo !== false && os.activo !== 0)
      .map((os) => ({
        id_obra_social: Number(os.id_obra_social),
        nombre: os.nombre || '',
        nro_afiliado: os.nro_afiliado || '',
        activo: true,
      }));
  }

  let obraSocial;
  if (obrasSocialesList.length > 0) {
    obraSocial = {
      id_obra_social: obrasSocialesList[0].id_obra_social,
      nombre: obrasSocialesList.map((os) => os.nombre).filter(Boolean).join(', ') || obrasSocialesList[0].nombre,
      nro_afiliado: obrasSocialesList[0].nro_afiliado,
    };
  } else if (p.obra_social && typeof p.obra_social === 'object') {
    obraSocial = {
      ...p.obra_social,
      nro_afiliado:
        p.obra_social.nro_afiliado ||
        p.obra_social.PacienteObraSocial?.nro_afiliado ||
        ''
    };
  } else if (p.id_obra_social && Number(p.id_obra_social) > 1) {
    obraSocial = {
      id_obra_social: Number(p.id_obra_social),
      nombre: 'Obra Social',
      nro_afiliado: p.nro_afiliado || ''
    };
  } else {
    obraSocial = {
      id_obra_social: 1,
      nombre: 'Particular',
      nro_afiliado: ''
    };
  }

  return {
    ...p,
    domicilio: p.domicilio || p.direccion || '',
    direccion: p.domicilio || p.direccion || '',
    obra_social: obraSocial,
    obras_sociales: obrasSocialesList,
    ObraSocials: p.ObraSocials || [],
  };
};

/**
 * Obtener todos los pacientes registrados desde el backend
 * @returns {Promise<Array>}
 */
export const getPacientes = async () => {
  const data = await api.get('/pacientes');
  const items = unpackArray(data);
  pacientesCache = items.map(normalizarPaciente);
  return pacientesCache;
};

/**
 * Obtener paciente por ID
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const getPacientePorId = async (id) => {
  const data = await api.get(`/pacientes/${id}`);
  return normalizarPaciente(unpackObject(data));
};

export const getPacienteById = getPacientePorId;

/**
 * Registrar un nuevo paciente
 * @param {Object} paciente
 * @returns {Promise<Object>}
 */
export const crearPaciente = async (paciente) => {
  const dniClean = paciente.dni ? String(paciente.dni).replace(/\D/g, '').trim() : '';
  const idOS = paciente.id_obra_social ? Number(paciente.id_obra_social) : 1;
  const domicilioClean = (paciente.domicilio || paciente.direccion || '').trim();

  const payload = {
    nombre: String(paciente.nombre || '').trim(),
    apellido: String(paciente.apellido || '').trim(),
    telefono: String(paciente.telefono || '').trim(),
    ...(dniClean ? { dni: dniClean } : {}),
    ...(paciente.fecha_nacimiento ? { fecha_nacimiento: paciente.fecha_nacimiento } : {}),
    ...(domicilioClean ? { domicilio: domicilioClean, direccion: domicilioClean } : {}),
    ...(Array.isArray(paciente.obras_sociales) ? { obras_sociales: paciente.obras_sociales } : {}),
    id_obra_social: idOS,
    nro_afiliado: paciente.nro_afiliado
      ? String(paciente.nro_afiliado).trim()
      : (idOS === 1 ? 'S/N' : '')
  };
  delete payload.email;

  const data = await api.post('/pacientes', payload);
  return normalizarPaciente(unpackObject(data));
};

/**
 * Actualizar datos de un paciente existente
 * @param {number|string} id
 * @param {Object} paciente
 * @returns {Promise<Object>}
 */
export const actualizarPaciente = async (id, paciente) => {
  const dniClean = paciente.dni !== undefined ? String(paciente.dni || '').replace(/\D/g, '').trim() : undefined;
  const domicilioClean = (paciente.domicilio !== undefined || paciente.direccion !== undefined)
    ? String(paciente.domicilio || paciente.direccion || '').trim()
    : undefined;

  const payload = {
    ...(paciente.nombre ? { nombre: String(paciente.nombre).trim() } : {}),
    ...(paciente.apellido ? { apellido: String(paciente.apellido).trim() } : {}),
    ...(paciente.telefono ? { telefono: String(paciente.telefono).trim() } : {}),
    ...(dniClean !== undefined ? (dniClean ? { dni: dniClean } : { dni: null }) : {}),
    ...(paciente.fecha_nacimiento !== undefined ? { fecha_nacimiento: paciente.fecha_nacimiento || null } : {}),
    ...(domicilioClean !== undefined ? { domicilio: domicilioClean || null, direccion: domicilioClean || null } : {}),
    ...(Array.isArray(paciente.obras_sociales) ? { obras_sociales: paciente.obras_sociales } : {}),
    ...(paciente.id_obra_social ? { id_obra_social: Number(paciente.id_obra_social) } : {}),
    ...(paciente.nro_afiliado !== undefined ? { nro_afiliado: String(paciente.nro_afiliado).trim() } : {})
  };
  delete payload.email;

  const data = await api.put(`/pacientes/${id}`, payload);
  return normalizarPaciente(unpackObject(data));
};

/**
 * Eliminar (o desactivar lógicamente) un paciente
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const eliminarPaciente = async (id) => {
  try {
    return await api.delete(`/pacientes/${id}`);
  } catch (err) {
    if (err.response && err.response.status !== 404) {
      throw err;
    }
    return await api.patch(`/pacientes/${id}/delete`);
  }
};

/**
 * Reactivar un paciente dado de baja lógica
 * @param {number|string} id
 * @param {Object} paciente
 * @returns {Promise<Object>}
 */
export const reactivarPaciente = async (id, paciente = {}) => {
  const dniClean = paciente.dni !== undefined ? String(paciente.dni || '').replace(/\D/g, '').trim() : undefined;
  const domicilioClean = (paciente.domicilio !== undefined || paciente.direccion !== undefined)
    ? String(paciente.domicilio || paciente.direccion || '').trim()
    : undefined;

  const payload = {
    ...(paciente.nombre ? { nombre: String(paciente.nombre).trim() } : {}),
    ...(paciente.apellido ? { apellido: String(paciente.apellido).trim() } : {}),
    ...(paciente.telefono ? { telefono: String(paciente.telefono).trim() } : {}),
    ...(dniClean !== undefined ? (dniClean ? { dni: dniClean } : { dni: null }) : {}),
    ...(paciente.fecha_nacimiento !== undefined ? { fecha_nacimiento: paciente.fecha_nacimiento || null } : {}),
    ...(domicilioClean !== undefined ? { domicilio: domicilioClean || null, direccion: domicilioClean || null } : {}),
    ...(Array.isArray(paciente.obras_sociales) ? { obras_sociales: paciente.obras_sociales } : {}),
    ...(paciente.id_obra_social ? { id_obra_social: Number(paciente.id_obra_social) } : {}),
    ...(paciente.nro_afiliado !== undefined ? { nro_afiliado: String(paciente.nro_afiliado).trim() } : {})
  };
  delete payload.email;

  const data = await api.patch(`/pacientes/${id}/reactivar`, payload);
  return normalizarPaciente(unpackObject(data));
};

/**
 * Valida si existe un paciente con el DNI indicado usando la caché en memoria
 * @param {string|number} dni
 * @param {number|string|null} [idPacienteExcluir]
 * @returns {boolean}
 */
export const existePacienteConDni = (dni, idPacienteExcluir = null) => {
  if (!dni) return false;
  const cleanDni = String(dni).replace(/\D/g, '').trim();
  if (!cleanDni) return false;

  return pacientesCache.some((p) => {
    if (!p || p.activo === false) return false;
    if (idPacienteExcluir && String(p.id_paciente) === String(idPacienteExcluir)) {
      return false;
    }
    const pDni = String(p.dni || '').replace(/\D/g, '').trim();
    return pDni === cleanDni;
  });
};

/**
 * Búsqueda de pacientes en el listado
 * @param {string} query
 * @returns {Promise<Array>}
 */
export const buscarPacientes = async (query = '') => {
  const pacientes = await getPacientes();
  const q = query.trim().toLowerCase();
  if (!q) return pacientes;

  const queryDni = q.replace(/\D/g, '');
  return pacientes.filter((p) => {
    const nombre = (p.nombre || '').toLowerCase();
    const apellido = (p.apellido || '').toLowerCase();
    const nombreCompleto = `${nombre} ${apellido}`;
    const dni = String(p.dni || '').replace(/\D/g, '');
    const obraSocial = (
      typeof p.obra_social === 'object' ? p.obra_social?.nombre || '' : String(p.obra_social || '')
    ).toLowerCase();

    return (
      nombre.includes(q) ||
      apellido.includes(q) ||
      nombreCompleto.includes(q) ||
      obraSocial.includes(q) ||
      (queryDni.length > 0 && dni.includes(queryDni))
    );
  });
};

export default {
  getPacientes,
  getPacientePorId,
  getPacienteById,
  crearPaciente,
  actualizarPaciente,
  reactivarPaciente,
  eliminarPaciente,
  existePacienteConDni,
  buscarPacientes
};
