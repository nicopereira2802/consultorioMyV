/** @format */

export const validarEntidadUpdate = async (Modelo, id) => {
 
  const entidad = await Modelo.findByPk(id);

  if (!entidad) {
    return false;
  }

  return true;
};
