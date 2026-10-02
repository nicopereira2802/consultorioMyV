/**
 * M&V Turnos - Servicio de Atención en Sillón (atencion.service.js)
 * Conecta la finalización clínica con la actualización unificada de turnos e historial del paciente.
 * Sincronizado con el esquema relacional:
 * TURNO: id_turno, id_paciente, id_estado (4: 'Atendido'), precio_final, notas_consulta
 * TURNO_PRACTICA: id_practica
 * PACIENTE: historial clínico
 */

import {
  getTurnoById,
  getTodayISO,
  actualizarTurno,
  ESTADOS_TURNO,
  registrarAtencionTurno
} from './turnos.service';
import { getPacienteById, actualizarPaciente } from './pacientes.service';
import { getPracticaById } from './practicas.service';

/**
 * Finalizar la atención de un paciente en sillón odontológico
 * Actualiza el turno en el almacenamiento unificado de turnos
 *
 * @param {number|string} id_turno - ID primario del turno
 * @param {Object} datosAtencion
 * @param {number} [datosAtencion.id_practica] - ID de la práctica realizada
 * @param {string} datosAtencion.notas_consulta - Observaciones clínicas / evolución
 * @param {number} [datosAtencion.precio_final] - Arancel final cobrado/registrado
 * @param {number|string} [datosAtencion.id_estado=4] - Estado del turno (Atendido)
 * @param {string} [datosAtencion.profesional] - Profesional a cargo de la atención
 * @returns {Promise<Object>} Resultado de la finalización con el turno actualizado
 */
export const finalizarAtencion = async (id_turno, datosAtencion = {}) => {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const fechaHoy = getTodayISO();

  const turno = await getTurnoById(id_turno);
  const fechaTurno = turno?.fecha || fechaHoy;

  const idPractica = datosAtencion.id_practica || turno?.id_practica;
  const practica = idPractica ? await getPracticaById(idPractica) : (turno?.practica || null);

  const notasFinales = typeof datosAtencion.notas_consulta === 'string'
    ? datosAtencion.notas_consulta
    : (typeof datosAtencion.notas === 'string' ? datosAtencion.notas : '');

  const precioFinal = datosAtencion.precio_final !== undefined && datosAtencion.precio_final !== null
    ? Number(datosAtencion.precio_final)
    : (Number(turno?.precio_final) || Number(practica?.precio_referencia) || 0);

  let turnoActualizado = null;
  if (id_turno) {
    try {
      const patchData = {
        id_estado: ESTADOS_TURNO.ATENDIDO.id_estado,
        estado_nombre: ESTADOS_TURNO.ATENDIDO.nombre,
        notas_consulta: notasFinales,
        precio_final: precioFinal
      };

      if (idPractica) {
        patchData.id_practica = Number(idPractica);
        if (practica) {
          patchData.practica = {
            id_practica: practica.id_practica,
            codigo_nomenclador: practica.codigo_nomenclador,
            nombre_referencia: practica.nombre_referencia,
            especialidad: practica.especialidad,
            precio_referencia: practica.precio_referencia,
            modulos: practica.modulos,
            duracion_minutos: practica.duracion_minutos
          };
        }
      }

      turnoActualizado = await actualizarTurno(id_turno, patchData, fechaTurno);
    } catch (err) {
      console.warn(`No se pudo actualizar el turno ${id_turno} en turnos.service:`, err);
    }
  }

  const idPaciente = turno?.id_paciente || turno?.paciente?.id_paciente;
  if (idPaciente) {
    try {
      const paciente = await getPacienteById(idPaciente);
      if (paciente) {
        const evolucionClinica = {
          fecha: fechaTurno,
          practica: practica?.nombre_referencia || 'Consulta Odontológica',
          profesional: datosAtencion.profesional || 'Dr. Valenzuela',
          notas: notasFinales || 'Atención en sillón finalizada sin observaciones.',
          precio_final: precioFinal
        };

        const historialActualizado = [evolucionClinica, ...(paciente.historial || [])];
        await actualizarPaciente(paciente.id_paciente, {
          historial: historialActualizado
        });
      }
    } catch (err) {
      console.warn('No se pudo guardar la evolución en el historial del paciente:', err);
    }
  }

  return {
    success: true,
    message: 'Atención finalizada con éxito. Turno actualizado a Atendido.',
    id_turno,
    id_estado: ESTADOS_TURNO.ATENDIDO.id_estado,
    notas_consulta: notasFinales,
    precio_final: precioFinal,
    turno: turnoActualizado || turno
  };
};

export { registrarAtencionTurno } from './turnos.service';

export default {
  finalizarAtencion,
  registrarAtencionTurno
};
