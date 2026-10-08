

import api from './api';

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

/**
 * Obtener catálogo de prácticas odontológicas
 * @returns {Promise<Array>}
 */
export const getPracticas = async () => {
  const data = await api.get('/practicas');
  return unpackArray(data);
};

/**
 * Obtener práctica por ID
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const getPracticaById = async (id) => {
  const data = await api.get(`/practicas/${id}`);
  return unpackObject(data);
};

/**
 * Registrar una nueva práctica en el catálogo
 * @param {Object} practica
 * @returns {Promise<Object>}
 */
export const crearPractica = async (practica) => {
  const payload = {
    codigo_nomenclador: String(practica.codigo_nomenclador || '').trim(),
    nombre_referencia: String(practica.nombre_referencia || '').trim(),
    nombre_nomenclador: String(
      practica.nombre_nomenclador || practica.nombre_referencia || ''
    ).trim(),
    especialidad: String(practica.especialidad || 'General').trim(),
    precio_referencia: Number(practica.precio_referencia ?? 0),
    activo: practica.activo !== undefined ? Boolean(practica.activo) : true
  };
  const data = await api.post('/practicas', payload);
  return unpackObject(data);
};

/**
 * Actualizar una práctica existente
 * @param {number|string} id
 * @param {Object} practica
 * @returns {Promise<Object>}
 */
export const actualizarPractica = async (id, practica) => {
  const payload = {
    ...(practica.codigo_nomenclador ? { codigo_nomenclador: String(practica.codigo_nomenclador).trim() } : {}),
    ...(practica.nombre_referencia ? { nombre_referencia: String(practica.nombre_referencia).trim() } : {}),
    ...(practica.nombre_nomenclador ? { nombre_nomenclador: String(practica.nombre_nomenclador).trim() } : {}),
    ...(practica.especialidad ? { especialidad: String(practica.especialidad).trim() } : {}),
    ...(practica.precio_referencia !== undefined ? { precio_referencia: Number(practica.precio_referencia) } : {}),
    ...(practica.activo !== undefined ? { activo: Boolean(practica.activo) } : {})
  };
  const data = await api.put(`/practicas/${id}`, payload);
  return unpackObject(data);
};

/**
 * Eliminar (o desactivar lógicamente) una práctica
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const eliminarPractica = async (id) => {
  try {
    const data = await api.delete(`/practicas/${id}`);
    return unpackObject(data);
  } catch (err) {
    if (err.response && err.response.status !== 404) {
      throw err;
    }
    const data = await api.patch(`/practicas/${id}/delete`);
    return unpackObject(data);
  }
};

export default {
  getPracticas,
  getPracticaById,
  crearPractica,
  actualizarPractica,
  eliminarPractica
};
