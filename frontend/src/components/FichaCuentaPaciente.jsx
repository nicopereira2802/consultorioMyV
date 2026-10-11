import { useState, useEffect, useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import { getCuentaPaciente } from '../services/cobros.service';
import ModalRegistrarEntrega from './ModalRegistrarEntrega';
import './FichaCuentaPaciente.css';

/**
 * Formatea un valor numérico a moneda argentina ($ XX.XXX,XX)
 */
const formatearMoneda = (valor) => {
  const num = Number(valor) || 0;
  return `$ ${num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Formatea una fecha ISO a DD/MM/YYYY HH:mm hs
 */
const formatearFechaHora = (raw) => {
  if (!raw) return '-';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hora}:${min} hs`;
  } catch {
    return String(raw);
  }
};

/**
 * Obtiene la clase CSS para el badge de método de pago (consistente con GestionCobros)
 */
const getClaseMetodo = (metodo) => {
  const m = String(metodo || '').toLowerCase();
  if (m.includes('transferencia')) return 'transferencia';
  if (m.includes('efectivo')) return 'efectivo';
  if (m.includes('tarjeta') || m.includes('débito') || m.includes('debito') || m.includes('crédito') || m.includes('credito')) return 'tarjeta';
  return 'default';
};

/**
 * FichaCuentaPaciente - Modal Institucional con la Cuenta de Paciente
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {number|string} idPaciente
 * @param {function} onActualizar - callback al padre para refrescar listas
 */
export const FichaCuentaPaciente = ({ isOpen, onClose, idPaciente, onActualizar }) => {
  const [cuentaData, setCuentaData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estado para el modal de registrar entrega sobre un acuerdo
  const [acuerdoParaEntrega, setAcuerdoParaEntrega] = useState(null);

  const cargarCuenta = useCallback(async () => {
    if (!idPaciente) return;
    try {
      setCargando(true);
      setError(null);
      const data = await getCuentaPaciente(idPaciente);
      setCuentaData(data);
    } catch (err) {
      console.error('Error al cargar cuenta del paciente:', err);
      setError(err.message || 'No se pudo cargar la cuenta del paciente.');
    } finally {
      setCargando(false);
    }
  }, [idPaciente]);

  useEffect(() => {
    if (isOpen && idPaciente) {
      cargarCuenta();
    }
  }, [isOpen, idPaciente, cargarCuenta]);

  // Manejo de tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !acuerdoParaEntrega) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, acuerdoParaEntrega]);

  if (!isOpen) return null;

  const paciente = cuentaData?.paciente || {};
  const metricas = cuentaData?.metricas || {
    costo_acordado: 0,
    total_pagado: 0,
    saldo_pendiente: 0,
    cobros_registrados: 0,
  };
  const acuerdos = cuentaData?.acuerdos || [];
  const turnosAtendidos = cuentaData?.turnos_atendidos || [];

  const handleEntregaSuccess = () => {
    cargarCuenta();
    if (onActualizar) onActualizar();
  };

  return (
    <>
      <div className="ficha-cuenta-overlay" onClick={onClose}>
        <div className="ficha-cuenta-card" onClick={(e) => e.stopPropagation()}>
          {/* ==========================================================
              1. Encabezado del Paciente
              ========================================================== */}
          <header className="ficha-cuenta-header">
            <div className="ficha-cuenta-header-left">
              <span className="ficha-cuenta-badge-sub">CUENTA DE PACIENTE</span>
              <h2 className="ficha-cuenta-titulo">
                {paciente.nombre_completo || 'Paciente'}
              </h2>
              <p className="ficha-cuenta-subtitulo">
                DNI: {paciente.dni || 'Sin DNI'} {paciente.telefono ? `| Tel: ${paciente.telefono}` : ''}
              </p>
            </div>
            <button
              type="button"
              className="ficha-cuenta-close-btn"
              onClick={onClose}
              aria-label="Cerrar cuenta de paciente"
              title="Cerrar"
            >
              <X size={20} />
            </button>
          </header>

          {/* ==========================================================
              2. Cuerpo
              ========================================================== */}
          <div className="ficha-cuenta-body">
            {cargando ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <p>Cargando cuenta corriente del paciente...</p>
              </div>
            ) : error ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#e11d48' }}>
                <p>{error}</p>
              </div>
            ) : (
              <>
                {/* 2.1 Grilla 2x2 de Métricas Principales */}
                <section className="ficha-metricas-grid">
                  <div className="ficha-metrica-card">
                    <span className="ficha-metrica-label">COSTO ACORDADO</span>
                    <span className="ficha-metrica-valor">
                      {formatearMoneda(metricas.costo_acordado)}
                    </span>
                  </div>

                  <div className="ficha-metrica-card">
                    <span className="ficha-metrica-label">TOTAL PAGADO</span>
                    <span className="ficha-metrica-valor verde">
                      {formatearMoneda(metricas.total_pagado)}
                    </span>
                  </div>

                  <div className="ficha-metrica-card">
                    <span className="ficha-metrica-label">SALDO PENDIENTE</span>
                    <span className={`ficha-metrica-valor ${metricas.saldo_pendiente > 0 ? 'coral' : 'verde'}`}>
                      {formatearMoneda(metricas.saldo_pendiente)}
                    </span>
                  </div>

                  <div className="ficha-metrica-card">
                    <span className="ficha-metrica-label">COBROS REGISTRADOS</span>
                    <span className="ficha-metrica-valor azul">
                      <span>{metricas.cobros_registrados}</span>
                      <span className="ficha-metrica-subtext">
                        {metricas.cobros_registrados === 1 ? 'pago asentado' : 'pagos asentados'}
                      </span>
                    </span>
                  </div>
                </section>

                {/* 2.2 Sección: Turnos Atendidos / Prácticas Realizadas (Desde BD) */}
                <section className="ficha-seccion-bloque">
                  <div className="ficha-seccion-header">
                    <div className="ficha-seccion-header-left">
                      <h3 className="ficha-seccion-titulo">Turnos Atendidos / Prácticas Realizadas</h3>
                      <span className="ficha-seccion-sub">
                        Prácticas odontológicas asentadas formalmente en el sistema
                      </span>
                    </div>
                    <span className="ficha-contador-badge">
                      {turnosAtendidos.length} {turnosAtendidos.length === 1 ? 'atención' : 'atenciones'}
                    </span>
                  </div>

                  {turnosAtendidos.length > 0 ? (
                    <div className="ficha-tabla-scroll">
                      <table className="ficha-entregas-tabla">
                        <thead>
                          <tr>
                            <th style={{ width: '28%' }}>FECHA Y HORA</th>
                            <th style={{ width: '42%' }}>PRÁCTICA / NOMENCLADOR</th>
                            <th style={{ width: '18%' }}>COSTO REF.</th>
                            <th style={{ width: '12%', textAlign: 'center' }}>ESTADO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {turnosAtendidos.map((t) => (
                            <tr key={t.id_turno}>
                              <td className="ficha-entrega-fecha">
                                {formatearFechaHora(t.fecha_hora_inicio)}
                              </td>
                              <td>
                                <div className="ficha-practica-nombre">{t.practica}</div>
                                {t.notas_consulta && t.notas_consulta !== t.practica && (
                                  <div className="ficha-practica-nota">{t.notas_consulta}</div>
                                )}
                              </td>
                              <td className="ficha-monto-valor">
                                {formatearMoneda(t.costo)}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span className="ficha-badge-estado-pagada">
                                  Atendido
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="ficha-vacia-box">
                      El paciente aún no posee turnos en estado Atendido.
                    </div>
                  )}
                </section>

                {/* 2.3 Sección: Tratamientos / Acuerdos de Pago */}
                <section className="ficha-seccion-bloque">
                  <div className="ficha-seccion-header">
                    <div className="ficha-seccion-header-left">
                      <h3 className="ficha-seccion-titulo">Tratamientos / Acuerdos de Pago</h3>
                      <span className="ficha-seccion-sub">
                        Planes estructurados y acuerdos de cuotas informales
                      </span>
                    </div>
                    <span className="ficha-contador-badge">
                      {acuerdos.length} {acuerdos.length === 1 ? 'acuerdo' : 'acuerdos'}
                    </span>
                  </div>

                  {acuerdos.length > 0 ? (
                    acuerdos.map((acuerdo) => (
                      <article key={acuerdo.id_cobro} className="ficha-acuerdo-card">
                        {/* Top Info y Acciones */}
                        <div className="ficha-acuerdo-top">
                          <div className="ficha-acuerdo-info">
                            <h4 className="ficha-acuerdo-titulo">{acuerdo.tratamiento}</h4>
                            <div className="ficha-acuerdo-tags">
                              <span className="ficha-tag informal">
                                {acuerdo.es_informal ? 'Acuerdo: cuotas informales' : acuerdo.tipo_acuerdo}
                              </span>
                              {acuerdo.es_informal && (
                                <span className="ficha-tag sin-venc">Sin vencimientos fijos</span>
                              )}
                              <span className={`ficha-tag ${acuerdo.estado === 'Completado' ? 'estado-completado' : 'estado-parcial'}`}>
                                {acuerdo.estado}
                              </span>
                            </div>
                          </div>

                          {acuerdo.saldo_pendiente > 0 && (
                            <button
                              type="button"
                              className="btn-registrar-entrega-trigger"
                              onClick={() =>
                                setAcuerdoParaEntrega({
                                  ...acuerdo,
                                  pacienteNombre: paciente.nombre_completo,
                                })
                              }
                              aria-label={`Registrar entrega para ${acuerdo.tratamiento}`}
                            >
                              <Plus size={16} />
                              <span>Registrar Entrega</span>
                            </button>
                          )}
                        </div>

                        {/* Barra de Progreso de Cobertura */}
                        <div className="ficha-progreso-container">
                          <div className="ficha-progreso-header">
                            <span className="ficha-progreso-label">
                              {acuerdo.porcentaje_cubierto}% del costo cubierto
                            </span>
                            <span className="ficha-progreso-detalle">
                              {formatearMoneda(acuerdo.pagado)} de {formatearMoneda(acuerdo.costo_acordado)}
                            </span>
                          </div>
                          <div className="ficha-barra-fondo">
                            <div
                              className="ficha-barra-relleno"
                              style={{ width: `${Math.min(100, acuerdo.porcentaje_cubierto)}%` }}
                            />
                          </div>
                        </div>

                        {/* Tabla de Entregas Registradas */}
                        <div className="ficha-entregas-section">
                          <h5 className="ficha-entregas-titulo">ENTREGAS REGISTRADAS</h5>
                          {acuerdo.entregas && acuerdo.entregas.length > 0 ? (
                            <div className="ficha-tabla-scroll">
                              <table className="ficha-entregas-tabla">
                                <thead>
                                  <tr>
                                    <th style={{ width: '8%' }}>#</th>
                                    <th style={{ width: '32%' }}>FECHA Y HORA</th>
                                    <th style={{ width: '25%' }}>MÉTODO</th>
                                    <th style={{ width: '20%' }}>MONTO</th>
                                    <th style={{ width: '15%' }}>ESTADO</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {acuerdo.entregas.map((entrega, idx) => (
                                    <tr key={entrega.id_cuota || idx}>
                                      <td className="ficha-entrega-nro">#{entrega.nro_cuota || idx + 1}</td>
                                      <td className="ficha-entrega-fecha">
                                        {formatearFechaHora(entrega.fecha_cobro || entrega.fecha_vencimiento)}
                                      </td>
                                      <td>
                                        <span className={`ficha-badge-metodo ${getClaseMetodo(entrega.metodo_pago)}`}>
                                          {entrega.metodo_pago || 'Efectivo'}
                                        </span>
                                      </td>
                                      <td className="ficha-monto-valor">
                                        {formatearMoneda(entrega.monto_cobrado ?? entrega.monto_cuota)}
                                      </td>
                                      <td>
                                        <span className="ficha-badge-estado-pagada">
                                          {entrega.estado || 'Pagada'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="ficha-entregas-vacia">
                              Aún no se registraron entregas para este acuerdo.
                            </div>
                          )}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="ficha-vacia-box">
                      No hay acuerdos ni cobros registrados para este paciente.
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          {/* ==========================================================
              3. Pie de Modal (Botón Salmón Cerrar)
              ========================================================== */}
          <footer className="ficha-cuenta-footer">
            <button type="button" className="btn-ficha-cerrar" onClick={onClose}>
              Cerrar
            </button>
          </footer>
        </div>
      </div>

      {/* Sub-modal para registrar entrega */}
      {acuerdoParaEntrega && (
        <ModalRegistrarEntrega
          isOpen={Boolean(acuerdoParaEntrega)}
          onClose={() => setAcuerdoParaEntrega(null)}
          acuerdo={acuerdoParaEntrega}
          onSuccess={handleEntregaSuccess}
        />
      )}
    </>
  );
};

export default FichaCuentaPaciente;
