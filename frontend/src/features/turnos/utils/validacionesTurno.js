/** @format */

/**
 * Valida si un intervalo propuesto [fechaInicio, fechaFin) colisiona con algún turno activo existente.
 * Lógica de colisión estricta: A_inicio < B_fin && A_fin > B_inicio.
 *
 * @param {string|Date} fechaInicio - Inicio del turno propuesto
 * @param {string|Date} fechaFin - Fin del turno propuesto
 * @param {number|string|null} idTurnoExcluir - ID del turno que se está editando/reprogramando para ignorarlo
 * @param {Array} turnosList - Lista de turnos existentes
 * @returns {null|{solapa: boolean, turnoConflicto: object, mensaje: string}}
 */
export const verificarSolapamientoTurnos = (
  fechaInicio,
  fechaFin,
  idTurnoExcluir = null,
  turnosList = []
) => {
  if (!fechaInicio || !fechaFin || !Array.isArray(turnosList) || turnosList.length === 0) {
    return null;
  }

  const inicioDate = fechaInicio instanceof Date ? fechaInicio : new Date(fechaInicio);
  const finDate = fechaFin instanceof Date ? fechaFin : new Date(fechaFin);

  const inicioMs = inicioDate.getTime();
  const finMs = finDate.getTime();

  if (isNaN(inicioMs) || isNaN(finMs) || inicioMs >= finMs) {
    return null;
  }

  for (const t of turnosList) {
    if (!t) continue;

    // Excluir turno inactivo
    if (t.activo === false) continue;

    // Excluir el propio turno al editar o reprogramar
    const tId = t.id_turno ?? t.id;
    if (idTurnoExcluir && tId && String(tId) === String(idTurnoExcluir)) {
      continue;
    }

    // Excluir turnos cancelados (id_estado === 3 o estado === 'cancelado')
    const estadoStr = (t.estado || t.EstadoTurno?.estado || "").toLowerCase();
    if (Number(t.id_estado) === 3 || estadoStr.includes("cancel")) {
      continue;
    }

    // Obtener inicio y fin del turno existente
    const tInicioRaw = t.fecha_hora_inicio || t.start;
    const tFinRaw = t.fecha_hora_fin || t.end;
    if (!tInicioRaw) continue;

    const tInicioDate = tInicioRaw instanceof Date ? tInicioRaw : new Date(tInicioRaw);
    let tFinDate = tFinRaw ? (tFinRaw instanceof Date ? tFinRaw : new Date(tFinRaw)) : null;

    if (!tFinDate || isNaN(tFinDate.getTime())) {
      const durMin = Number(t.duracion_minutos) || 30;
      tFinDate = new Date(tInicioDate.getTime() + durMin * 60000);
    }

    const tIniMs = tInicioDate.getTime();
    const tFinMs = tFinDate.getTime();

    if (isNaN(tIniMs) || isNaN(tFinMs)) continue;

    // Condición de colisión estricta: A_inicio < B_fin && A_fin > B_inicio
    const colisiona = inicioMs < tFinMs && finMs > tIniMs;

    if (colisiona) {
      // Extraer nombre del paciente
      let nombrePac = "";
      if (t.Paciente) {
        nombrePac = `${t.Paciente.nombre || ""} ${t.Paciente.apellido || ""}`.trim();
      } else if (t.paciente) {
        nombrePac = `${t.paciente.nombre || ""} ${t.paciente.apellido || ""}`.trim();
      } else if (t.nombre_paciente) {
        nombrePac = t.nombre_paciente.trim();
      } else if (t.paciente_nombre) {
        nombrePac = t.paciente_nombre.trim();
      } else if (t.title) {
        nombrePac = t.title.trim();
      }

      if (!nombrePac) {
        nombrePac = "otro paciente";
      }

      const hIni = `${String(tInicioDate.getHours()).padStart(2, "0")}:${String(tInicioDate.getMinutes()).padStart(2, "0")}`;
      const hFin = `${String(tFinDate.getHours()).padStart(2, "0")}:${String(tFinDate.getMinutes()).padStart(2, "0")}`;

      return {
        solapa: true,
        turnoConflicto: t,
        mensaje: `Horario no disponible: se solapa con el turno de ${nombrePac} (${hIni} a ${hFin} hs).`,
      };
    }
  }

  return null;
};

/**
 * Valida si un intento de bloqueo (día completo o franja horaria) colisiona con algún turno asignado activo.
 *
 * @param {object} datosRestriccion - { fechaInicio, fechaFin, todoElDia, horaInicio, horaFin }
 * @param {Array} turnosList - Lista de turnos existentes
 * @returns {null|{hayConflicto: boolean, turnoConflicto: object, mensaje: string}}
 */
export const validarBloqueoConTurnos = (datosRestriccion, turnosList = []) => {
  if (!datosRestriccion || !Array.isArray(turnosList) || turnosList.length === 0) {
    return null;
  }

  const { fechaInicio, fechaFin, todoElDia, horaInicio, horaFin } = datosRestriccion;
  const fIniStr = fechaInicio;
  const fFinStr = fechaFin || fIniStr;

  if (!fIniStr) return null;

  for (const t of turnosList) {
    if (!t) continue;
    if (t.activo === false) continue;

    // Excluir turnos cancelados (id_estado === 3 o estado === 'cancelado')
    const estadoStr = (t.estado || t.EstadoTurno?.estado || "").toLowerCase();
    if (Number(t.id_estado) === 3 || estadoStr.includes("cancel")) {
      continue;
    }

    const tInicioRaw = t.fecha_hora_inicio || t.start;
    if (!tInicioRaw) continue;

    const tInicioDate = tInicioRaw instanceof Date ? tInicioRaw : new Date(tInicioRaw);
    if (isNaN(tInicioDate.getTime())) continue;

    // Obtener fecha del turno en formato "YYYY-MM-DD" local
    const y = tInicioDate.getFullYear();
    const m = String(tInicioDate.getMonth() + 1).padStart(2, "0");
    const d = String(tInicioDate.getDate()).padStart(2, "0");
    const tFechaStr = `${y}-${m}-${d}`;

    // Verificar si la fecha del turno cae dentro del rango [fIniStr, fFinStr]
    if (tFechaStr >= fIniStr && tFechaStr <= fFinStr) {
      if (todoElDia) {
        // En bloqueo de día completo, cualquier turno activo en la fecha es un conflicto
        return {
          hayConflicto: true,
          turnoConflicto: t,
          mensaje:
            "No se puede bloquear el período: Hay turnos asignados en esa fecha. Debes reprogramarlos o cancelarlos antes de aplicar el bloqueo.",
        };
      }

      // Si es franja horaria: verificar solapamiento horario [horaInicio, horaFin) con el turno
      if (horaInicio && horaFin) {
        const tFinRaw = t.fecha_hora_fin || t.end;
        let tFinDate = tFinRaw ? (tFinRaw instanceof Date ? tFinRaw : new Date(tFinRaw)) : null;
        if (!tFinDate || isNaN(tFinDate.getTime())) {
          const durMin = Number(t.duracion_minutos) || 30;
          tFinDate = new Date(tInicioDate.getTime() + durMin * 60000);
        }

        const tHoraIni = `${String(tInicioDate.getHours()).padStart(2, "0")}:${String(tInicioDate.getMinutes()).padStart(2, "0")}`;
        const tHoraFin = `${String(tFinDate.getHours()).padStart(2, "0")}:${String(tFinDate.getMinutes()).padStart(2, "0")}`;

        const hIniBloqueo = horaInicio.padStart(5, "0");
        const hFinBloqueo = horaFin.padStart(5, "0");

        // Condición de colisión horaria: A_inicio < B_fin && A_fin > B_inicio
        if (tHoraIni < hFinBloqueo && tHoraFin > hIniBloqueo) {
          return {
            hayConflicto: true,
            turnoConflicto: t,
            mensaje:
              "No se puede bloquear el período: Hay turnos asignados en esa fecha. Debes reprogramarlos o cancelarlos antes de aplicar el bloqueo.",
          };
        }
      }
    }
  }

  return null;
};
