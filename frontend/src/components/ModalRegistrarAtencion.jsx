import { useState, useEffect, useMemo } from 'react';
import { getPracticas } from '../services/practicas.service';
import { registrarAtencionTurno, calcularBloquesTurno } from '../services/turnos.service';
import { obtenerNombreCobertura, obtenerCredencialCobertura } from '../utils/paciente.utils';
import './ModalRegistrarAtencion.css';

/**
 * ModalRegistrarAtencion - Historia de Usuario 2
 * Registro de prácticas odontológicas realizadas y observaciones clínicas en la Agenda Diaria.
 * Sincronizado con el modelo relacional:
 * TURNO: id_turno, id_paciente, id_estado (4: 'Atendido'), notas_consulta, precio_final
 * TURNO_PRACTICA: id_turno, id_practica
 * PACIENTE: historial clínico
 *
 * @param {boolean} isOpen - Estado de visibilidad del modal
 * @param {function} onClose - Callback para cerrar el modal
 * @param {Object} turno - Datos del turno seleccionado
 * @param {function} [onAtencionRegistrada] - Callback tras registrar la atención exitosamente
 * @param {function} [onConfirmar] - Callback tras registrar la atención exitosamente
 */
const obtenerPracticasIniciales = (turno) => {
  if (!turno) return [];
  if (Array.isArray(turno.practicas_realizadas) && turno.practicas_realizadas.length > 0) {
    return turno.practicas_realizadas;
  }
  if (Array.isArray(turno.practicas) && turno.practicas.length > 0) {
    return turno.practicas;
  }
  if (turno.practica) {
    if (typeof turno.practica === 'object') {
      return [turno.practica];
    }
    if (typeof turno.practica === 'string' && turno.practica.trim() !== '') {
      return [{
        id_practica: turno.id_practica || 9999,
        codigo_nomenclador: '01.01',
        nombre_referencia: turno.practica,
        especialidad: 'General'
      }];
    }
  }
  return [];
};

export const ModalRegistrarAtencion = ({
  isOpen,
  onClose,
  turno,
  onAtencionRegistrada,
  onConfirmar,
  onSuccess
}) => {
  const [catalogoPracticas, setCatalogoPracticas] = useState([]);
  const [practicasSeleccionadas, setPracticasSeleccionadas] = useState(() =>
    obtenerPracticasIniciales(turno)
  );
  const [practicaSeleccionadaId, setPracticaSeleccionadaId] = useState('');
  const [observaciones, setObservaciones] = useState(
    turno?.observaciones || turno?.notas_consulta || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoadingPracticas, setIsLoadingPracticas] = useState(false);
  const [showConfirmacion, setShowConfirmacion] = useState(false);

  // Obras sociales activas del paciente
  const coberturasPaciente = useMemo(() => {
    const p = turno?.paciente || turno?.Paciente || {};
    let coberturas = p.ObraSocials || p.obras_sociales || [];
    if ((!Array.isArray(coberturas) || coberturas.length === 0) && p.obra_social && typeof p.obra_social === 'object') {
      coberturas = [p.obra_social];
    }
    return (Array.isArray(coberturas) ? coberturas : []).filter(
      (os) =>
        os &&
        os.PacienteObraSocial?.activo !== false &&
        os.activo !== false &&
        Number(os.id_obra_social) > 1
    );
  }, [turno]);

  // ID de obra social utilizada en la atención (1 a 1 opcional, null para Particular)
  const [obraSocialSeleccionada, setObraSocialSeleccionada] = useState(null);

  // Total de referencia basado en el nomenclador
  const totalReferencia = useMemo(() => {
    return practicasSeleccionadas.reduce(
      (acc, p) => acc + (parseFloat(p.precio_referencia) || 0),
      0
    );
  }, [practicasSeleccionadas]);

  // Precio final a cobrar (editable)
  const [precioFinal, setPrecioFinal] = useState('');
  const [precioModificadoManualmente, setPrecioModificadoManualmente] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const iniciales = obtenerPracticasIniciales(turno);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPracticasSeleccionadas(iniciales);

    // Inicializar obra social seleccionada (1 a 1 opcional)
    const osPrevia = turno?.id_obra_social || turno?.obra_social?.id_obra_social || turno?.ObraSocial?.id_obra_social;
    if (osPrevia && Number(osPrevia) > 1) {
      setObraSocialSeleccionada(Number(osPrevia));
    } else if (Array.isArray(turno?.obras_sociales_utilizadas) && turno.obras_sociales_utilizadas.length > 0) {
      const first = turno.obras_sociales_utilizadas[0];
      const id = Number(typeof first === 'object' ? (first.id_obra_social || first.id) : first);
      setObraSocialSeleccionada(id > 1 ? id : null);
    } else if (coberturasPaciente.length === 1) {
      setObraSocialSeleccionada(Number(coberturasPaciente[0].id_obra_social));
    } else {
      setObraSocialSeleccionada(null);
    }

    // Inicializar precio final
    if (turno?.precio_final !== undefined && turno?.precio_final !== null && Number(turno.precio_final) > 0) {
      setPrecioFinal(String(turno.precio_final));
      setPrecioModificadoManualmente(true);
    } else {
      const totalInit = iniciales.reduce((acc, p) => acc + (parseFloat(p.precio_referencia) || 0), 0);
      setPrecioFinal(String(totalInit));
      setPrecioModificadoManualmente(false);
    }

    const cargarCatalogo = async () => {
      try {
        setIsLoadingPracticas(true);
        const practicas = await getPracticas();
        if (isMounted) {
          setCatalogoPracticas(practicas);

          setPracticasSeleccionadas((prev) => {
            if (prev.length > 0 && prev[0].id_practica && prev[0].id_practica !== 9999) {
              return prev;
            }
            if (turno?.id_practica) {
              const match = practicas.find((p) => Number(p.id_practica) === Number(turno.id_practica));
              if (match) return [match];
            }
            if (typeof turno?.practica === 'string') {
              const match = practicas.find((p) =>
                p.nombre_referencia.toLowerCase() === turno.practica.toLowerCase() ||
                p.nombre_nomenclador?.toLowerCase() === turno.practica.toLowerCase()
              );
              if (match) return [match];
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Error al cargar catálogo de prácticas en modal:', err);
      } finally {
        if (isMounted) setIsLoadingPracticas(false);
      }
    };

    cargarCatalogo();
    setObservaciones(turno?.observaciones || turno?.notas_consulta || '');
    setPracticaSeleccionadaId('');
    setErrorMsg('');
    setIsSubmitting(false);
    setShowConfirmacion(false);

    return () => {
      isMounted = false;
    };
  }, [isOpen, turno, coberturasPaciente]);

  // Si no se modificó manualmente, mantener sincronizado el precio final con el total de referencia
  useEffect(() => {
    if (!precioModificadoManualmente) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrecioFinal(String(totalReferencia));
    }
  }, [totalReferencia, precioModificadoManualmente]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        if (showConfirmacion) {
          setShowConfirmacion(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, showConfirmacion, onClose]);

  if (!isOpen || !turno) return null;

  const paciente = turno.paciente || turno.Paciente || {};
  const nombreCompleto = paciente.nombre && paciente.apellido
    ? `${paciente.nombre} ${paciente.apellido}`
    : (paciente.nombre || paciente.apellido || 'Paciente sin registrar');

  const dni = paciente.dni || '-';

  const bloquesInfo = calcularBloquesTurno(turno);
  const horarioStr = bloquesInfo.horaInicio && bloquesInfo.horaFin
    ? `${bloquesInfo.horaInicio} a ${bloquesInfo.horaFin} hs`
    : (turno.hora ? `${turno.hora} hs` : 'Horario asignado');

  const handleToggleObraSocial = (idOS) => {
    const idNum = Number(idOS);
    setObraSocialSeleccionada((prev) => (prev === idNum ? null : idNum));
  };

  const handleRestablecerPrecioReferencia = () => {
    setPrecioFinal(String(totalReferencia));
    setPrecioModificadoManualmente(false);
  };

  const handleAgregarPractica = () => {
    if (!practicaSeleccionadaId) return;

    const idNum = Number(practicaSeleccionadaId);
    const practica = catalogoPracticas.find((p) => Number(p.id_practica) === idNum);
    if (!practica) return;

    const yaExiste = practicasSeleccionadas.some((p) => Number(p.id_practica) === idNum);
    if (yaExiste) {
      setErrorMsg('La práctica ya ha sido agregada a la lista.');
      return;
    }

    setPracticasSeleccionadas((prev) => [...prev, practica]);
    setPracticaSeleccionadaId('');
    setErrorMsg('');
  };

  const handleQuitarPractica = (id_practica) => {
    setPracticasSeleccionadas((prev) => prev.filter((p) => Number(p.id_practica) !== Number(id_practica)));
  };

  const handleSolicitarConfirmacion = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;

    if (practicasSeleccionadas.length === 0) {
      setErrorMsg('Debe seleccionar al menos 1 práctica odontológica para registrar la atención.');
      return;
    }

    if (precioFinal !== '' && (isNaN(Number(precioFinal)) || Number(precioFinal) < 0)) {
      setErrorMsg('El precio final a cobrar no puede ser negativo o inválido.');
      return;
    }

    setErrorMsg('');
    setShowConfirmacion(true);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (practicasSeleccionadas.length === 0) {
      setErrorMsg('Debe seleccionar al menos 1 práctica odontológica para registrar la atención.');
      setShowConfirmacion(false);
      return;
    }

    const precioCobro =
      precioFinal !== '' && !isNaN(Number(precioFinal)) && Number(precioFinal) >= 0
        ? Number(precioFinal)
        : totalReferencia;

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const obraSocialObj = obraSocialSeleccionada
        ? coberturasPaciente.find((os) => Number(os.id_obra_social) === obraSocialSeleccionada) || null
        : null;

      const idsPracticas = practicasSeleccionadas.map((p) => p.id_practica);
      const turnoActualizado = await registrarAtencionTurno(
        turno.id_turno,
        {
          id_practicas: idsPracticas,
          practicas_realizadas: practicasSeleccionadas,
          total: precioCobro,
          precio_final: precioCobro,
          id_obra_social: obraSocialSeleccionada || null,
          obras_sociales_utilizadas: obraSocialSeleccionada ? [obraSocialSeleccionada] : [],
          observaciones
        },
        turno.fecha
      );

      const payloadTurno = {
        ...(turnoActualizado || {}),
        id_turno: turno.id_turno,
        estado: 'ATENDIDO',
        id_estado: 3,
        estado_nombre: 'Atendido',
        practicas_realizadas: practicasSeleccionadas,
        total: precioCobro,
        precio_final: precioCobro,
        id_obra_social: obraSocialSeleccionada || null,
        obra_social: obraSocialObj,
        obras_sociales_utilizadas: obraSocialObj ? [obraSocialObj] : [],
        observaciones,
        notas_consulta: observaciones
      };

      // 2. Cerrar diálogo de confirmación
      setShowConfirmacion(false);

      // 3. Notificar éxito y refrescar la agenda del padre
      const onCallback = onSuccess || onAtencionRegistrada || onConfirmar;
      if (onCallback) {
        await onCallback(payloadTurno, {
          practicasSeleccionadas,
          total: precioCobro,
          precio_final: precioCobro,
          id_obra_social: obraSocialSeleccionada || null,
          obra_social: obraSocialObj,
          obras_sociales_utilizadas: obraSocialObj ? [obraSocialObj] : [],
          observaciones
        });
      }

      // 4. Cerrar el modal principal de atención
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Error al registrar atención:', err);
      const msg = err.userMessage || err.response?.data?.error || err.response?.data?.message || err.message || 'Error al registrar la atención.';
      setErrorMsg(msg);
      alert(msg);
      setShowConfirmacion(false); // Cierra la confirmación para que el usuario pueda ver el formulario y corregir
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="modal-registrar-overlay min-h-screen w-full flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-registrar-title"
        onClick={isSubmitting ? undefined : onClose}
      >
        <div
          className="modal-registrar-card bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="modal-registrar-header">
          <div className="modal-registrar-title-group">
            <div className="modal-registrar-icon-badge" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2eb086"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
            </div>
            <div>
              <h2 id="modal-registrar-title" className="modal-registrar-title">
                Registrar Atención Clínica
              </h2>
              <p className="modal-registrar-subtitle">
                {turno.fecha ? `Turno: ${turno.fecha}` : 'Atención del día'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-registrar-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar modal de registro de atención"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSolicitarConfirmacion} className="modal-registrar-form">
          <div className="modal-registrar-body">
            {errorMsg && (
              <div className="modal-registrar-alert-error" role="alert">
                <span className="error-icon" aria-hidden="true">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="modal-registrar-resumen-card">
              <h3 className="resumen-card-title">Datos del Turno</h3>
              <div className="resumen-grid">
                <div className="resumen-item">
                  <span className="resumen-label">Paciente</span>
                  <strong className="resumen-value">{nombreCompleto}</strong>
                  <span className="resumen-sub">DNI: {dni}</span>
                </div>

                <div className="resumen-item">
                  <span className="resumen-label">Obra Social / Cobertura</span>
                  <strong className="resumen-value">{obtenerNombreCobertura(paciente)}</strong>
                  <span className="resumen-sub">{obtenerCredencialCobertura(paciente)}</span>
                </div>

                <div className="resumen-item">
                  <span className="resumen-label">Horario Asignado</span>
                  <strong className="resumen-value">{horarioStr}</strong>
                  <span className="resumen-sub">Duración: {bloquesInfo.duracionMinutos} min</span>
                </div>
              </div>
            </div>

            {/* Sección de Selección de Coberturas Utilizadas en la Atención */}
            <div className="modal-registrar-section">
              <div className="section-header-row">
                <label className="modal-registrar-label">
                  Cobertura Utilizada en la Atención
                </label>
                <span className="helper-label-coberturas">
                  {coberturasPaciente.length > 0
                    ? 'Seleccione la obra social aplicada o ninguna para Particular'
                    : 'Sin obras sociales activas'}
                </span>
              </div>

              {coberturasPaciente.length === 0 ? (
                <div className="badge-particular-box">
                  <span className="badge-particular-tag">Particular</span>
                  <span className="badge-particular-desc">
                    El paciente no posee obras sociales activas. La atención se registrará 100% particular.
                  </span>
                </div>
              ) : (
                <div className="coberturas-selector-container">
                  <div className="coberturas-chips-group">
                    {coberturasPaciente.map((os) => {
                      const idOSNum = Number(os.id_obra_social);
                      const isSelected = obraSocialSeleccionada === idOSNum;
                      const credencial = os.PacienteObraSocial?.nro_afiliado || os.nro_afiliado;
                      return (
                        <button
                          key={idOSNum}
                          type="button"
                          className={`chip-cobertura-toggle ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleObraSocial(idOSNum)}
                          disabled={isSubmitting}
                          title={isSelected ? `Quitar cobertura ${os.nombre || os.nombre_obra_social} (marcar Particular)` : `Aplicar cobertura ${os.nombre || os.nombre_obra_social}`}
                        >
                          <span className={`chip-cobertura-check ${isSelected ? 'checked' : ''}`}>
                            {isSelected ? '✓' : ''}
                          </span>
                          <span className="chip-cobertura-nombre">
                            {os.nombre || os.nombre_obra_social}
                          </span>
                          {credencial && (
                            <span className="chip-cobertura-credencial">
                              (N° {credencial})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {!obraSocialSeleccionada && (
                    <p className="nota-atencion-particular">
                      ℹ️ <strong>Atención 100% Particular:</strong> Sin cobertura de obra social aplicada para este turno.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="modal-registrar-section">
              <label htmlFor="selector-practicas" className="modal-registrar-label">
                Prácticas Odontológicas Realizadas <span className="label-required">* (mínimo 1)</span>
              </label>

              <div className="selector-practicas-row">
                <select
                  id="selector-practicas"
                  className="select-practica-catalogo"
                  value={practicaSeleccionadaId}
                  onChange={(e) => {
                    setPracticaSeleccionadaId(e.target.value);
                    setErrorMsg('');
                  }}
                  disabled={isLoadingPracticas || isSubmitting}
                >
                  <option value="">Seleccionar práctica para agregar...</option>
                  {catalogoPracticas.map((p) => (
                    <option key={p.id_practica} value={p.id_practica}>
                      [{p.codigo_nomenclador}] {p.nombre_referencia} ({p.especialidad})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="btn-agregar-practica"
                  onClick={handleAgregarPractica}
                  disabled={!practicaSeleccionadaId || isSubmitting}
                >
                  + Agregar
                </button>
              </div>

              <div className="lista-practicas-añadidas">
                {practicasSeleccionadas.length === 0 ? (
                  <p className="practicas-vacio-texto">
                    Ninguna práctica añadida aún. Selecciona una práctica del catálogo y pulsa <strong>+ Agregar</strong>.
                  </p>
                ) : (
                  practicasSeleccionadas.map((p) => (
                    <div key={p.id_practica} className="chip-practica-card">
                      <div className="chip-practica-info">
                        <span className="chip-practica-codigo">{p.codigo_nomenclador}</span>
                        <strong className="chip-practica-nombre">{p.nombre_referencia}</strong>
                        {p.especialidad && (
                          <span className="chip-practica-especialidad">{p.especialidad}</span>
                        )}
                        {p.precio_referencia && (
                          <span className="chip-practica-arancel">
                            $ {Number(p.precio_referencia).toLocaleString('es-AR')}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-quitar-practica"
                        onClick={() => handleQuitarPractica(p.id_practica)}
                        disabled={isSubmitting}
                        title={`Quitar ${p.nombre_referencia}`}
                        aria-label={`Quitar ${p.nombre_referencia}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Desglose de Costos: Total de Referencia y Precio Final Editable */}
              <div className="resumen-cobro-container">
                <div className="fila-total-referencia">
                  <div className="info-referencia-text">
                    <span className="label-referencia">Total de Referencia (Nomenclador):</span>
                    <span className="sub-referencia">Suma sugerida según prácticas seleccionadas</span>
                  </div>
                  <div className="badge-monto-referencia">
                    $ {totalReferencia.toLocaleString('es-AR')}
                  </div>
                </div>

                <div className="fila-precio-final-cobro">
                  <div className="label-precio-final-group">
                    <label htmlFor="input-precio-final" className="label-precio-final">
                      Precio Final a Cobrar ($) <span className="label-required">*</span>
                    </label>
                    {precioModificadoManualmente && (
                      <button
                        type="button"
                        className="btn-restablecer-precio"
                        onClick={handleRestablecerPrecioReferencia}
                        title="Restablecer al total de referencia"
                      >
                        ↺ Restablecer a referencia (${totalReferencia.toLocaleString('es-AR')})
                      </button>
                    )}
                  </div>
                  <div className="input-precio-wrapper">
                    <span className="input-precio-prefix">$</span>
                    <input
                      id="input-precio-final"
                      type="number"
                      min="0"
                      step="any"
                      className="input-precio-final"
                      value={precioFinal}
                      onChange={(e) => {
                        setPrecioFinal(e.target.value);
                        setPrecioModificadoManualmente(true);
                      }}
                      placeholder="0.00"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-registrar-section">
              <label htmlFor="observaciones-clinicas-textarea" className="modal-registrar-label">
                Observaciones y notas clínicas
              </label>
              <textarea
                id="observaciones-clinicas-textarea"
                className="textarea-observaciones-clinicas"
                rows={4}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Detalle del procedimiento, piezas dentarias tratadas, medicación o indicaciones..."
                disabled={isSubmitting}
              />
              <span className="helper-text-observaciones">
                Quedarán registradas en la evolución clínica del paciente y en la ficha del turno atendido.
              </span>
            </div>
          </div>

          <div className="modal-registrar-footer">
            <button
              type="button"
              className="btn-modal-reg-cancelar bg-[#f87171] hover:bg-[#ef4444] text-white font-medium rounded-xl transition-all shadow-sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-modal-reg-confirmar"
              onClick={handleSolicitarConfirmacion}
              disabled={isSubmitting || practicasSeleccionadas.length === 0}
            >
              Confirmar y Marcar Atendido
            </button>
          </div>
        </form>
      </div>
    </div>

    {showConfirmacion && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
          
          {/* Encabezado */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                ✓
              </div>
              <h3 className="text-lg font-bold">Confirmar Atención Clínica</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmacion(false)}
              className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Mensaje descriptivo */}
          <p className="text-slate-600 text-sm leading-relaxed">
            ¿Estás seguro de registrar y finalizar la atención de este turno? El turno pasará a estado <strong>Atendido</strong> y se guardarán las prácticas, montos y observaciones ingresadas.
          </p>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowConfirmacion(false)}
              className="px-4 py-2.5 rounded-xl text-white font-medium bg-[#f87171] hover:bg-[#ef4444] transition-all shadow-sm cursor-pointer text-sm"
            >
              Volver / Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-white font-medium bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Guardando..." : "Confirmar Registro"}
            </button>
          </div>

        </div>
      </div>
    )}
  </>
  );
};

export default ModalRegistrarAtencion;
