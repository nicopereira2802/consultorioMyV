import { useState, useEffect } from 'react';
import { useScrollLock } from '../hooks/useScrollLock';
import { getCobroById } from '../services/cobros.service';
import './ModalDetalleCobro.css';

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
 * Formatea una fecha a formato DD/MM/YYYY
 */
const formatearSoloFecha = (raw) => {
  if (!raw) return '-';
  try {
    if (typeof raw === 'string' && /^\d{2}\/\d{2}\/\d{4}/.test(raw)) {
      return raw.slice(0, 10);
    }
    const cleaned = typeof raw === 'string' ? raw.replace(' ', 'T') : raw;
    const d = new Date(cleaned);
    if (isNaN(d.getTime())) return String(raw);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
  } catch {
    return String(raw);
  }
};

/**
 * Obtiene la clase CSS para el badge de método de pago
 */
const getBadgeClaseMetodo = (metodo) => {
  const m = String(metodo || '').toLowerCase();
  if (m.includes('transferencia')) return 'badge-transferencia';
  if (m.includes('efectivo')) return 'badge-efectivo';
  if (m.includes('crédito') || m.includes('credito')) return 'badge-credito';
  if (m.includes('débito') || m.includes('debito') || m.includes('tarjeta')) return 'badge-debito';
  return 'badge-default';
};

/**
 * Obtiene la clase CSS para el badge de estado de la cuota
 */
const getBadgeClaseEstado = (estado) => {
  const e = String(estado || '').toLowerCase();
  if (e.includes('pagad')) return 'badge-estado-pagada';
  if (e.includes('parcial')) return 'badge-estado-parcial';
  return 'badge-estado-pendiente';
};

/**
 * ModalDetalleCobro - Desglose de cuotas y formas de pago
 *
 * @param {boolean} isOpen - Control de visibilidad
 * @param {function} onClose - Callback al cerrar
 * @param {Object} cobro - Objeto del cobro seleccionado
 */
export const ModalDetalleCobro = ({ isOpen, onClose, cobro }) => {
  useScrollLock(isOpen);

  const [detalleCompleto, setDetalleCompleto] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Si el cobro no tiene cuotas embebidas y tiene un ID numérico, consultar API
  useEffect(() => {
    if (!isOpen || !cobro) {
      setDetalleCompleto(null);
      return;
    }

    const idCobro = cobro.id_cobro || cobro.id;
    const yaTieneCuotas =
      (cobro.Cuota && cobro.Cuota.length > 0) ||
      (cobro.Cuotas && cobro.Cuotas.length > 0) ||
      (cobro.cuotas && cobro.cuotas.length > 0);

    if (yaTieneCuotas) {
      setDetalleCompleto(cobro);
      return;
    }

    if (idCobro && typeof idCobro === 'number') {
      let montado = true;
      const cargarDetalle = async () => {
        try {
          setCargandoDetalle(true);
          const res = await getCobroById(idCobro);
          if (montado && res?.data) {
            setDetalleCompleto(res.data);
          }
        } catch {
          // Detalle no disponible, se mantiene objeto base
        } finally {
          if (montado) setCargandoDetalle(false);
        }
      };
      cargarDetalle();
      return () => {
        montado = false;
      };
    } else {
      setDetalleCompleto(cobro);
    }
  }, [isOpen, cobro]);

  if (!isOpen || !cobro) return null;

  // Extraer información consolidada
  const cobroActual = detalleCompleto || cobro;
  const listaCuotas =
    cobroActual.Cuota ||
    cobroActual.Cuotas ||
    cobroActual.cuotas ||
    [];

  const tieneCuotas = Array.isArray(listaCuotas) && listaCuotas.length > 0;

  return (
    <div
      className="modal-cobro-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cobro-titulo"
    >
      <div
        className="modal-cobro-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==========================================================
            Encabezado
            ========================================================== */}
        <header className="modal-cobro-header">
          <div className="modal-cobro-header-info">
            <h2 id="modal-cobro-titulo" className="modal-cobro-titulo">
              Detalle de Cobro y Cuotas
            </h2>
            <div className="modal-cobro-paciente-meta">
              <span>
                Paciente: <strong>{cobro.nombre}</strong>
              </span>
              <span>•</span>
              <span>
                DNI: <strong>{cobro.dni}</strong>
              </span>
              {cobro.tratamiento && (
                <>
                  <span>•</span>
                  <span>{cobro.tratamiento}</span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            className="modal-cobro-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
            title="Cerrar"
          >
            ✕
          </button>
        </header>

        {/* ==========================================================
            Resumen Superior del Cobro
            ========================================================== */}
        <div className="modal-cobro-resumen">
          <div className="resumen-item">
            <span className="resumen-label">Monto Total</span>
            <span className="resumen-monto">
              {formatearMoneda(cobro.monto || cobro.monto_a_cobrar)}
            </span>
          </div>

          <div className="resumen-item">
            <span className="resumen-label">Fecha de Emisión</span>
            <span className="resumen-valor">{cobro.fecha || '-'}</span>
          </div>

          <div className="resumen-item">
            <span className="resumen-label">Plan / Cuotas</span>
            <span className="resumen-valor">
              {tieneCuotas ? `${listaCuotas.length} cuota(s)` : 'Pago Único'}
            </span>
          </div>
        </div>

        {/* ==========================================================
            Cuerpo (Tabla de Cuotas o Pago Único)
            ========================================================== */}
        <div className="modal-cobro-body">
          {cargandoDetalle ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
              Cargando detalle de cuotas...
            </div>
          ) : tieneCuotas ? (
            <div className="cuotas-table-wrapper">
              <table className="cuotas-table">
                <thead>
                  <tr>
                    <th scope="col">N° Cuota</th>
                    <th scope="col">Monto</th>
                    <th scope="col">Vencimiento</th>
                    <th scope="col">Fecha de Pago</th>
                    <th scope="col">Forma de Pago</th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {listaCuotas.map((cuota, idx) => {
                    const nro = cuota.nro_cuota || cuota.numero_cuota || idx + 1;
                    const montoCuota = cuota.monto_cuota || cuota.monto || cobro.monto;
                    const metodoCuota = cuota.metodo_pago || cobro.forma_pago || 'Efectivo';
                    const estadoCuota = cuota.estado || (cuota.fecha_cobro ? 'Pagada' : 'Pendiente');

                    return (
                      <tr key={cuota.id_cuota || idx}>
                        <td className="td-nro-cuota">Cuota {nro}</td>
                        <td className="td-monto-cuota">{formatearMoneda(montoCuota)}</td>
                        <td>{formatearSoloFecha(cuota.fecha_vencimiento)}</td>
                        <td>
                          {cuota.fecha_cobro ? formatearSoloFecha(cuota.fecha_cobro) : '-'}
                        </td>
                        <td>
                          <span
                            className={`badge-forma-pago ${getBadgeClaseMetodo(metodoCuota)}`}
                          >
                            {metodoCuota}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge-estado ${getBadgeClaseEstado(estadoCuota)}`}
                          >
                            {estadoCuota}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="pago-unico-card">
              <div className="pago-unico-header">
                <span>Información del Pago Asentado</span>
              </div>
              <div className="pago-unico-grid">
                <div className="resumen-item">
                  <span className="resumen-label">Forma de Pago</span>
                  <div>
                    <span
                      className={`badge-forma-pago ${getBadgeClaseMetodo(cobro.forma_pago)}`}
                    >
                      {cobro.forma_pago || 'Efectivo'}
                    </span>
                  </div>
                </div>

                <div className="resumen-item">
                  <span className="resumen-label">Monto Cobrado</span>
                  <span className="resumen-valor" style={{ color: '#059669' }}>
                    {formatearMoneda(cobro.monto)}
                  </span>
                </div>

                <div className="resumen-item">
                  <span className="resumen-label">Fecha de Cobro</span>
                  <span className="resumen-valor">{cobro.fecha || '-'}</span>
                </div>

                <div className="resumen-item">
                  <span className="resumen-label">Estado</span>
                  <div>
                    <span className="badge-estado badge-estado-pagada">Pagada</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ==========================================================
            Pie del Modal
            ========================================================== */}
        <footer className="modal-cobro-footer">
          <button
            type="button"
            className="btn-cerrar-modal"
            onClick={onClose}
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ModalDetalleCobro;
