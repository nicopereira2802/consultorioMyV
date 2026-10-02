
import api from './api';

let pacientesCache = [];

/**
 * Obtener todos los pacientes registrados desde el backend
 * @returns {Promise<Array>}
 */
export const getPacientes = async () => {
  const data = await api.get('/pacientes');
  pacientesCache = Array.isArray(data) ? data : [];
  return pacientesCache;
};

/**
 * Obtener paciente por ID
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const getPacientePorId = async (id) => {
  return await api.get(`/pacientes/${id}`);
};

export const getPacienteById = getPacientePorId;

/**
 * Registrar un nuevo paciente
 * @param {Object} paciente
 * @returns {Promise<Object>}
 */
export const crearPaciente = async (paciente) => {
  return await api.post('/pacientes', paciente);
};

/**
 * Actualizar datos de un paciente existente
 * @param {number|string} id
 * @param {Object} paciente
 * @returns {Promise<Object>}
 */
export const actualizarPaciente = async (id, paciente) => {
  return await api.put(`/pacientes/${id}`, paciente);
};

/**
 * Eliminar (o desactivar lógicamente) un paciente
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const eliminarPaciente = async (id) => {
  return await api.delete(`/pacientes/${id}`);
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
  eliminarPaciente,
  existePacienteConDni,
  buscarPacientes
};
