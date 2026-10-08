/**
 * Utilitarios centralizados para la visualización y formateo de datos de Pacientes y Coberturas.
 * Single Source of Truth (SSOT).
 */

/**
 * Retorna el nombre de la(s) obra(s) social(es) activa(s) del paciente.
 * Si no posee ninguna cargada, retorna "Particular".
 *
 * @param {Object|null} paciente
 * @returns {string}
 */
export const obtenerNombreCobertura = (paciente) => {
  if (!paciente) return 'Particular';

  let coberturas = paciente.ObraSocials || paciente.obras_sociales || [];
  if ((!Array.isArray(coberturas) || coberturas.length === 0) && paciente.obra_social) {
    if (typeof paciente.obra_social === 'object' && Number(paciente.obra_social.id_obra_social) > 1) {
      coberturas = [paciente.obra_social];
    } else if (
      typeof paciente.obra_social === 'string' &&
      paciente.obra_social.trim() !== '' &&
      paciente.obra_social.toLowerCase() !== 'particular'
    ) {
      return paciente.obra_social;
    }
  }

  const activas = (Array.isArray(coberturas) ? coberturas : []).filter(
    (os) =>
      os &&
      os.PacienteObraSocial?.activo !== false &&
      os.activo !== false &&
      Number(os.id_obra_social) !== 1
  );

  if (activas.length === 0) return 'Particular';
  return (
    activas
      .map((os) => os.nombre || os.nombre_obra_social)
      .filter(Boolean)
      .join(' / ') || 'Particular'
  );
};

/**
 * Retorna los números de afiliado/credencial de las coberturas activas.
 * Si no tiene, retorna "Particular / Sin credencial".
 *
 * @param {Object|null} paciente
 * @returns {string}
 */
export const obtenerCredencialCobertura = (paciente) => {
  if (!paciente) return 'Particular / Sin credencial';

  let coberturas = paciente.ObraSocials || paciente.obras_sociales || [];
  if ((!Array.isArray(coberturas) || coberturas.length === 0) && paciente.obra_social) {
    if (typeof paciente.obra_social === 'object' && Number(paciente.obra_social.id_obra_social) > 1) {
      coberturas = [paciente.obra_social];
    } else if (paciente.nro_afiliado) {
      return paciente.nro_afiliado;
    }
  }

  const activas = (Array.isArray(coberturas) ? coberturas : []).filter(
    (os) =>
      os &&
      os.PacienteObraSocial?.activo !== false &&
      os.activo !== false &&
      Number(os.id_obra_social) !== 1
  );

  if (activas.length === 0) return 'Particular / Sin credencial';
  return (
    activas
      .map((os) => os.PacienteObraSocial?.nro_afiliado || os.nro_afiliado)
      .filter(Boolean)
      .join(' / ') || 'Sin N° de credencial registrado'
  );
};
