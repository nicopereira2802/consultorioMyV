

import api from './api';

/**
 * Obtener catálogo de prácticas odontológicas
 * @returns {Promise<Array>}
 */
export const getPracticas = async () => {
  const data = await api.get('/practicas');
  return Array.isArray(data) ? data : [];
};

/**
 * Obtener práctica por ID
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const getPracticaById = async (id) => {
  return await api.get(`/practicas/${id}`);
};

/**
 * Registrar una nueva práctica en el catálogo
 * @param {Object} practica
 * @returns {Promise<Object>}
 */
export const crearPractica = async (practica) => {
  return await api.post('/practicas', practica);
};

/**
 * Actualizar una práctica existente
 * @param {number|string} id
 * @param {Object} practica
 * @returns {Promise<Object>}
 */
export const actualizarPractica = async (id, practica) => {
  return await api.put(`/practicas/${id}`, practica);
};

/**
 * Eliminar (o desactivar lógicamente) una práctica
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const eliminarPractica = async (id) => {
  return await api.delete(`/practicas/${id}`);
};

export default {
  getPracticas,
  getPracticaById,
  crearPractica,
  actualizarPractica,
  eliminarPractica
};
