/** @format */

// src/middlewares/existencia.middleware.js

/**
 * Middleware para validar si un registro existe por su ID en la base de datos
 * @param {Object} Modelo - Modelo de Sequelize (ej: Turno, Practica)
 * @param {string} paramName - Nombre del campo que contiene el ID (ej: 'turno_id' o 'id')
 * @param {string} location - 'body' o 'params' (por defecto busca en body y luego en params)
 */
export const validarExistencia = (Modelo, paramName, location = null) => {
  return async (req, res, next) => {
    try {
      // 1. Extraer el ID según la ubicación
      let id;
      if (location === "body") id = req.body[paramName];
      else if (location === "params") id = req.params[paramName];
      else id = req.body[paramName] ?? req.params[paramName];

      if (!id) {
        return res.status(400).json({
          status: "fail",
          message: `El parámetro '${paramName}' es requerido`,
        });
      }

      // 2. Buscar en la BD
      const entidad = await Modelo.findByPk(id);

      if (!entidad) {
        return res.status(404).json({
          status: "error",
          message: `No se encontró ${Modelo.name} con ID ${id}`,
        });
      }

      // 3. Inyectar la entidad encontrada en el objeto req con camelCase (opcional)
      const keyName =
        Modelo.name.charAt(0).toLowerCase() + Modelo.name.slice(1);

      req[keyName] = entidad;

      next();
    } catch (error) {
      next(error);
    }
  };
};
