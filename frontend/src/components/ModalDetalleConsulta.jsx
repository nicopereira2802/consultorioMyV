import { useState, useEffect } from 'react';
import './ModalDetalleConsulta.css';

/**
 * ModalDetalleConsulta - Modal para consultar y editar las observaciones clínicas de turnos atendidos
 * Sincronizado con el esquema relacional:
 * TURNO: id_turno, id_paciente, id_estado (4: 'Atendido'), precio_final, notas_consulta
 * PACIENTE: nombre, apellido, dni, obra_social (nombre, nro_afiliado)
 * PRACTICA: nombre_referencia, modulos, duracion_minutos
 *
 * @param {boolean} isOpen - Estado de visibilidad del modal
 * @param {function} onClose - Callback para cerrar el modal
 * @param {Object} turno - Objeto del turno con datos de paciente, práctica y notas
 * @param {function} onGuardar - Callback async (idTurno, notasConsulta)
 */
export const ModalDetalleConsulta = ({
  isOpen,
  onClose,
  turno,
  onGuardar
}) => {
  const [notas, setNotas] = useState(turno?.observaciones || turno?.notas_consulta || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotas(turno?.observaciones || turno?.notas_consulta || '');
    setErrorMsg('');
    setIsSubmitting(false);
  }, [turno]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !turno) return null;

  const paciente = turno.paciente || {};

  const nombreCompleto = paciente.nombre && paciente.apellido
    ? `${paciente.nombre} ${paciente.apellido}`
    : (paciente.nombre || paciente.apellido || 'Paciente sin registrar');

  const dni = paciente.dni || '-';

  const obraSocialNombre =
    paciente.obra_social?.nombre ||
    paciente.obra_social_nombre ||
    (typeof paciente.obra_social === 'string' && paciente.obra_social.trim() !== '' ? paciente.obra_social : '') ||
    'Particular';

  const nroAfiliado =
    paciente.obra_social?.nro_afiliado ||
    paciente.nro_afiliado ||
    paciente.numero_afiliado ||
    null;

  const practicasList = Array.isArray(turno.practicas_realizadas) && turno.practicas_realizadas.length > 0
    ? turno.practicas_realizadas
    : (Array.isArray(turno.practicas) && turno.practicas.length > 0
      ? turno.practicas
      : (turno.practica ? [turno.practica] : []));

  const totalConsulta =
    turno.total !== undefined && turno.total !== null
      ? Number(turno.total)
      : (turno.precio_final !== undefined && turno.precio_final !== null
        ? Number(turno.precio_final)
        : practicasList.reduce((acc, p) => acc + (parseFloat(p.precio_referencia) || 0), 0));

  const fechaDisplay = turno.fecha || 'Fecha no registrada';
  const horaDisplay = turno.hora ? `${turno.hora} hs` : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      if (onGuardar) {
        await onGuardar(turno.id_turno, notas);
      }
    } catch (err) {
      console.error('Error al guardar observaciones clínicas:', err);
      setErrorMsg('Ocurrió un error al guardar las observaciones. Por favor intente nuevamente.');
      setIsSubmitting(false);
    }
  };

  const esInasistente = turno?.id_estado === 5;

  return (
    <div
      className="modal-detalle-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-detalle-title"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="modal-detalle-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-detalle-header">
          <div className="modal-detalle-title-group">
            <div className="modal-detalle-icon-badge" aria-hidden="true">
              {esInasistente ? '⚠️' : '📝'}
            </div>
            <div>
              <h2 id="modal-detalle-title" className="modal-detalle-title">
                {esInasistente ? 'Motivo de Inasistencia' : 'Detalle de Consulta Odontológica'}
              </h2>
              <p className="modal-detalle-subtitle">
                {esInasistente ? 'Inasistencia Registrada' : 'Atención finalizada'} {" • "} {fechaDisplay} {horaDisplay ? ` • ${horaDisplay}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-detalle-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar modal de detalle de consulta"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-detalle-form">
          <div className="modal-detalle-body">
            <div className="modal-detalle-info-card">
              <h3 className="modal-detalle-section-title">
                {esInasistente ? 'Ficha Informativa del Turno' : 'Ficha Informativa de la Atención'}
              </h3>

              <div className="modal-detalle-grid">
                <div className="modal-detalle-grid-item">
                  <span className="detalle-item-label">Paciente</span>
                  <strong className="detalle-item-value">{nombreCompleto}</strong>
                  <span className="detalle-item-sub">DNI: {dni}</span>
                </div>

                <div className="modal-detalle-grid-item">
                  <span className="detalle-item-label">Obra Social / Prepaga</span>
                  <strong className="detalle-item-value">{obraSocialNombre}</strong>
                  {nroAfiliado ? (
                    <span className="detalle-item-sub">N° Afiliado: {nroAfiliado}</span>
                  ) : (
                    <span className="detalle-item-sub text-muted">Particular / Sin credencial</span>
                  )}
                </div>

                <div className="modal-detalle-grid-item modal-detalle-grid-full">
                  <span className="detalle-item-label">{esInasistente ? 'Práctica Agendada' : 'Práctica(s) Realizada(s)'}</span>
                  {practicasList.length === 0 ? (
                    <strong className="detalle-item-value">Consulta Odontológica General</strong>
                  ) : (
                    <div className="detalle-practicas-lista-nombres">
                      {practicasList.map((p, idx) => {
                        const codigo = p.codigo_nomenclador ? `[${p.codigo_nomenclador}] ` : '';
                        const nombre = p.nombre_referencia || p.nombre_nomenclador || p.nombre || 'Práctica Odontológica';
                        return (
                          <span key={p.id_practica || idx} className="detalle-practica-tag">
                            <strong>{codigo}</strong>{nombre}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="modal-detalle-grid-item">
                  <span className="detalle-item-label">Horario</span>
                  <strong className="detalle-item-value">{horaDisplay || 'Horario programado'}</strong>
                </div>

                <div className="modal-detalle-grid-item detalle-dato">
                  <span className="detalle-item-label label">{esInasistente ? 'ESTADO' : 'TOTAL CONSULTA'}</span>
                  <span className="detalle-item-value valor-total">
                    {esInasistente ? 'Inasistente' : `$ ${Number(totalConsulta || 0).toLocaleString('es-AR')}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-detalle-field-group">
              <label htmlFor="notas-consulta-textarea" className="modal-detalle-label">
                {esInasistente ? 'Motivo de la Inasistencia / Notas' : 'Notas de Consulta / Evolución Clínica'}
              </label>
              <textarea
                id="notas-consulta-textarea"
                className="modal-detalle-textarea"
                rows={5}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder={esInasistente ? 'Detalle del motivo de la inasistencia o reprogramación...' : 'Redacte aquí el diagnóstico clínico, observaciones del procedimiento, piezas dentales tratadas o evolución del paciente...'}
                disabled={isSubmitting}
                autoFocus
              />
              <span className="modal-detalle-helper-text">
                {esInasistente
                  ? 'Este motivo queda registrado en el historial de citas del paciente y en el registro diario de inasistencias.'
                  : 'Estas observaciones quedan asociadas a la ficha del turno y pueden consultarse o actualizarse en cualquier momento.'}
              </span>
            </div>

            {errorMsg && (
              <div className="modal-detalle-error-banner" role="alert">
                <span>⚠️ {errorMsg}</span>
              </div>
            )}
          </div>

          <div className="modal-detalle-actions">
            <button
              type="button"
              className="btn-modal-detalle-cancelar btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cerrar
            </button>

            <button
              type="submit"
              className="btn-modal-detalle-guardar btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="modal-detalle-spinner" aria-hidden="true"></span>
                  <span>Guardando...</span>
                </>
              ) : (
                esInasistente ? 'Guardar Motivo' : 'Guardar Observaciones'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ModalDetalleAtencion = ModalDetalleConsulta;
export default ModalDetalleConsulta;
