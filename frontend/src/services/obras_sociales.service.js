

import api from './api';

export const OBRAS_SOCIALES = [
  { id_obra_social: 1, nombre: 'Particular', activo: true },
  { id_obra_social: 2, nombre: 'OSDE', activo: true },
  { id_obra_social: 3, nombre: 'Swiss Medical', activo: true },
  { id_obra_social: 4, nombre: 'Galeno', activo: true },
  { id_obra_social: 5, nombre: 'Medifé', activo: true },
  { id_obra_social: 6, nombre: 'OMINT', activo: true },
  { id_obra_social: 7, nombre: 'Sancor Salud', activo: true },
  { id_obra_social: 8, nombre: 'Apross', activo: true }
];

let obrasSocialesCache = [...OBRAS_SOCIALES];

const unpackArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.rows)) return res.rows;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.rows)) return res.data.rows;
  return [];
};

/**
 * Obtener listado de obras sociales activas
 * @returns {Promise<Array>} Lista de obras sociales
 */
export const getObrasSociales = async () => {
  try {
    const data = await api.get('/obras-sociales');
    const items = unpackArray(data);
    if (items.length > 0) {
      obrasSocialesCache = items;
      return items;
    }
    return OBRAS_SOCIALES;
  } catch {
    return OBRAS_SOCIALES.filter((os) => os.activo);
  }
};

/**
 * Obtener obra social por su ID
 * @param {number|string} id - ID de la obra social
 * @returns {Object} Obra social encontrada o Particular por defecto
 */
export const getObraSocialById = (id) => {
  const found = obrasSocialesCache.find((os) => Number(os.id_obra_social) === Number(id));
  return found || obrasSocialesCache[0] || OBRAS_SOCIALES[0];
};

export default {
  OBRAS_SOCIALES,
  getObrasSociales,
  getObraSocialById
};
