import { useState, useEffect } from 'react';
import { DollarSign, CreditCard, ArrowRightLeft, X } from 'lucide-react';
import { registrarEntrega } from '../services/cobros.service';
import { useScrollLock } from '../hooks/useScrollLock';
import './ModalRegistrarEntrega.css';

/**
 * Formatea a moneda argentina
 */
const formatearMoneda = (val) => {
  const num = Number(val) || 0;
  return `$ ${num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * ModalRegistrarEntrega - Registra una entrega parcial o pago a cuenta sobre un acuerdo
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {Object} acuerdo - { id_cobro, tratamiento, costo_acordado, saldo_pendiente, pacienteNombre }
 * @param {function} onSuccess - callback al guardar
 */
export const ModalRegistrarEntrega = ({ isOpen, onClose, acuerdo, onSuccess }) => {
  useScrollLock(isOpen);

  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [fechaCobro, setFechaCobro] = useState(new Date().toISOString().slice(0, 10));
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Reiniciar estado al abrir
  useEffect(() => {
    if (isOpen && acuerdo) {
      setMonto('');
      setMetodoPago('Efectivo');
      setFechaCobro(new Date().toISOString().slice(0, 10));
      setError(null);
    }
  }, [isOpen, acuerdo]);

  // Manejo de Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !acuerdo) return null;

  const saldoRestante = Number(acuerdo.saldo_pendiente) || 0;
  const montoNum = parseFloat(monto) || 0;
  const excedeSaldo = montoNum > saldoRestante;

  const handlePagarTotal = () => {
    setMonto(String(saldoRestante));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isNaN(montoNum) || montoNum <= 0) {
      setError('Ingrese un monto válido mayor a $0.');
      return;
    }

    if (excedeSaldo) {
      setError(`El monto ingresado (${formatearMoneda(montoNum)}) supera el saldo restante (${formatearMoneda(saldoRestante)}).`);
      return;
    }

    try {
      setCargando(true);
      await registrarEntrega(acuerdo.id_cobro, {
        monto: montoNum,
        metodo_pago: metodoPago,
        fecha_cobro: `${fechaCobro}T12:00:00Z`,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al registrar entrega:', err);
      setError(err.message || 'No se pudo asentar la entrega.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-entrega-overlay" onClick={onClose}>
      <div className="modal-entrega-card" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <header className="modal-entrega-header">
          <div>
            <h2 className="modal-entrega-titulo">Registrar Pago / Entrega</h2>
            <p className="modal-entrega-subtitulo">
              {acuerdo.pacienteNombre ? `${acuerdo.pacienteNombre} — ` : ''}
              {acuerdo.tratamiento || 'Tratamiento'}
            </p>
          </div>
          <button
            type="button"
            className="modal-entrega-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </header>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="modal-entrega-body">
            {/* Resumen de saldo */}
            <div className="modal-entrega-resumen">
              <div className="modal-entrega-resumen-item">
                <span className="modal-entrega-resumen-label">Costo Total</span>
                <span className="modal-entrega-resumen-val">{formatearMoneda(acuerdo.costo_acordado)}</span>
              </div>
              <div className="modal-entrega-resumen-item" style={{ textAlign: 'right' }}>
                <span className="modal-entrega-resumen-label">Saldo Pendiente</span>
                <span className="modal-entrega-resumen-val saldo">{formatearMoneda(saldoRestante)}</span>
              </div>
            </div>

            {error && <div className="modal-entrega-error">{error}</div>}

            {/* Input de monto */}
            <div className="modal-entrega-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="modal-entrega-label">Monto a Entregar</label>
                {saldoRestante > 0 && (
                  <button
                    type="button"
                    className="modal-entrega-quick-btn"
                    onClick={handlePagarTotal}
                  >
                    Pagar saldo restante ({formatearMoneda(saldoRestante)})
                  </button>
                )}
              </div>
              <div className="modal-entrega-input-wrapper">
                <span className="modal-entrega-input-prefix">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={saldoRestante}
                  className="modal-entrega-input"
                  placeholder="0,00"
                  value={monto}
                  onChange={(e) => {
                    setMonto(e.target.value);
                    setError(null);
                  }}
                  autoFocus
                  required
                />
              </div>
              {excedeSaldo && (
                <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                  ⚠️ El monto supera el saldo restante de {formatearMoneda(saldoRestante)}
                </span>
              )}
            </div>

            {/* Selector de Método de Pago */}
            <div className="modal-entrega-group">
              <label className="modal-entrega-label">Método de Pago</label>
              <div className="modal-entrega-metodos-grid">
                <button
                  type="button"
                  className={`modal-entrega-metodo-btn ${metodoPago === 'Efectivo' ? 'activo' : ''}`}
                  onClick={() => setMetodoPago('Efectivo')}
                >
                  <DollarSign size={20} />
                  <span>Efectivo</span>
                </button>

                <button
                  type="button"
                  className={`modal-entrega-metodo-btn ${metodoPago === 'Transferencia' ? 'activo' : ''}`}
                  onClick={() => setMetodoPago('Transferencia')}
                >
                  <ArrowRightLeft size={20} />
                  <span>Transferencia</span>
                </button>

                <button
                  type="button"
                  className={`modal-entrega-metodo-btn ${metodoPago === 'Tarjeta' ? 'activo' : ''}`}
                  onClick={() => setMetodoPago('Tarjeta')}
                >
                  <CreditCard size={20} />
                  <span>Tarjeta</span>
                </button>
              </div>
            </div>

            {/* Fecha del pago */}
            <div className="modal-entrega-group">
              <label className="modal-entrega-label">Fecha del Pago</label>
              <input
                type="date"
                className="modal-entrega-input"
                style={{ paddingLeft: '14px', fontSize: '14px', fontWeight: 500 }}
                value={fechaCobro}
                onChange={(e) => setFechaCobro(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Footer */}
          <footer className="modal-entrega-footer">
            <button
              type="button"
              className="btn-entrega-cancelar"
              onClick={onClose}
              disabled={cargando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-entrega-confirmar"
              disabled={cargando || !montoNum || excedeSaldo}
            >
              {cargando ? 'Registrando...' : 'Confirmar Entrega'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default ModalRegistrarEntrega;
