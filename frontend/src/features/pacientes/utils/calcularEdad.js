/**
 * Calcula la edad exacta a partir de una fecha de nacimiento (AAAA-MM-DD o Date)
 */
export const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);

  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) {
    edad--;
  }

  return edad >= 0 ? edad : null;
};
