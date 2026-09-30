/** @format */

/**
 * Middleware para validar si un registro existe por su ID en la base de datos
 * @param {Object} Modelo - Modelo de Sequelize (ej: Turno, Practica)
 */
export const validarEntidadUpdate = async (Modelo, id) => {
  // 2. Buscar en la BD
  const entidad = await Modelo.findByPk(id);

  if (!entidad) {
    return false;
  }

  return true;
};
