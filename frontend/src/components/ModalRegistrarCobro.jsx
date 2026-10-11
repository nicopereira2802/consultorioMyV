import { useState, useEffect, useMemo } from 'react';
import ToothLogo from './ToothLogo';
import { getPacientes } from '../services/pacientes.service';
import { getTurnosPorPaciente } from '../services/turnos.service';
import { registrarCobro } from '../services/cobros.service';
import {
  X,
  Search,
  DollarSign,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  User,
  Clock,
} from 'lucide-react';
import './ModalRegistrarCobro.css';

/**
 * Formatea un valor numérico a moneda argentina ($ XX.XXX,XX)
 */
const formatearMoneda = (val) => {
  const num = Number(val) || 0;
  return `$ ${num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD
 */
const getFechaHoyISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Suma una cantidad de días a una fecha YYYY-MM-DD
 */
const sumarDiasISO = (fechaStr, dias) => {
  if (!fechaStr) return getFechaHoyISO();
  try {
    const [y, m, d] = fechaStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + Number(dias));
    return date.toISOString().slice(0, 10);
  } catch {
    return fechaStr;
  }
};

/**
 * Formatea una fecha YYYY-MM-DD a DD/MM/YYYY
 */
const formatearFechaVisual = (fechaISO) => {
  if (!fechaISO) return '-';
  try {
    const [y, m, d] = String(fechaISO).slice(0, 10).split('-');
    if (!y || !m || !d) return String(fechaISO);
    return `${d}/${m}/${y}`;
  } catch {
    return String(fechaISO);
  }
};

/**
 * Mapeo de métodos de pago válidos según ENUM del modelo Cuota
 */
const METODOS_PAGO_OPCIONES = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Transferencia', label: 'Transferencia Bancaria' },
  { value: 'Tarjeta', label: 'Tarjeta de Débito' },
  { value: 'Tarjeta', label: 'Tarjeta de Crédito' },
  { value: 'Otro', label: 'Otro / Cheque' },
];

/**
 * ModalRegistrarCobro
 *
 * Modal interactivo para registrar contablemente un cobro y generar sus cuotas
 * asociadas conforme al esquema de base de datos (`cobro` y `cuota`).
 */
export const ModalRegistrarCobro = ({ isOpen, onClose, onCobroRegistrado }) => {
  // --- Estados de Datos de Catálogos ---
  const [pacientes, setPacientes] = useState([]);
  const [cargandoPacientes, setCargandoPacientes] = useState(false);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');

  const [turnosPaciente, setTurnosPaciente] = useState([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);

  // --- Estados del Formulario (Tabla cobro) ---
  const [idPaciente, setIdPaciente] = useState('');
  const [idTurno, setIdTurno] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [cantCuotas, setCantCuotas] = useState(1);
  const [fechaEmision, setFechaEmision] = useState(getFechaHoyISO());

  // --- Estados de Configuración de Cuotas (Tabla cuota) ---
  const [pagoInmediato, setPagoInmediato] = useState(true);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState('Efectivo');

  // --- Estados de Fechas Editables para el desglose ---
  const [fechasVencimientoPersonalizadas, setFechasVencimientoPersonalizadas] = useState({});

  // --- Estados de Envío y Feedback ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [exitoMsg, setExitoMsg] = useState('');

  // Cerrar con Escape
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

  // Carga inicial de pacientes activos
  useEffect(() => {
    if (!isOpen) return;

    let montado = true;
    const cargarListaPacientes = async () => {
      try {
        setCargandoPacientes(true);
        const data = await getPacientes();
        if (!montado) return;
        const activos = (Array.isArray(data) ? data : []).filter(
          (p) => p.activo !== false && p.activo !== 0
        );
        // Ordenar alfabéticamente por Apellido, Nombre
        activos.sort((a, b) =>
          `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`)
        );
        setPacientes(activos);
      } catch (err) {
        if (!montado) return;
        console.error('Error al cargar catálogo de pacientes:', err);
      } finally {
        if (montado) setCargandoPacientes(false);
      }
    };

    cargarListaPacientes();

    // Resetear formulario al abrir
    setBusquedaPaciente('');
    setIdPaciente('');
    setIdTurno('');
    setMontoTotal('');
    setCantCuotas(1);
    setFechaEmision(getFechaHoyISO());
    setPagoInmediato(true);
    setMetodoPagoSeleccionado('Efectivo');
    setFechasVencimientoPersonalizadas({});
    setErrorMsg('');
    setExitoMsg('');

    return () => {
      montado = false;
    };
  }, [isOpen]);

  // Cargar turnos del paciente seleccionado
  useEffect(() => {
    if (!idPaciente) {
      setTurnosPaciente([]);
      setIdTurno('');
      return;
    }

    let montado = true;
    const cargarTurnos = async () => {
      try {
        setCargandoTurnos(true);
        const list = await getTurnosPorPaciente(idPaciente);
        if (!montado) return;
        const turnosValidos = (Array.isArray(list) ? list : []).filter(
          (t) => Boolean(t.id_turno) && t.estado_nombre !== 'Cancelado'
        );
        setTurnosPaciente(turnosValidos);
      } catch (err) {
        if (!montado) return;
        console.warn('Error al obtener turnos del paciente:', err);
        setTurnosPaciente([]);
      } finally {
        if (montado) setCargandoTurnos(false);
      }
    };

    cargarTurnos();

    return () => {
      montado = false;
    };
  }, [idPaciente]);

  // Si se selecciona un turno, auto-completar el monto si el usuario aún no ingresó ninguno
  const handleSelectTurno = (e) => {
    const val = e.target.value;
    setIdTurno(val);
    if (val && (!montoTotal || Number(montoTotal) === 0)) {
      const turnoObj = turnosPaciente.find((t) => String(t.id_turno) === String(val));
      if (turnoObj && (turnoObj.total || turnoObj.precio_final)) {
        const precio = Number(turnoObj.total || turnoObj.precio_final);
        if (precio > 0) {
          setMontoTotal(precio.toFixed(2));
        }
      }
    }
  };

  // Pacientes filtrados por término de búsqueda en el selector
  const pacientesFiltrados = useMemo(() => {
    if (!busquedaPaciente.trim()) return pacientes;
    const q = busquedaPaciente.toLowerCase().trim();
    return pacientes.filter((p) => {
      const nom = `${p.apellido || ''} ${p.nombre || ''}`.toLowerCase();
      const dni = String(p.dni || '');
      return nom.includes(q) || dni.includes(q);
    });
  }, [pacientes, busquedaPaciente]);

  // Paciente seleccionado objeto
  const pacienteSeleccionadoObj = useMemo(() => {
    return pacientes.find((p) => String(p.id_paciente) === String(idPaciente));
  }, [pacientes, idPaciente]);

  // Generación dinámica de la grilla de cuotas
  const cuotasCalculadas = useMemo(() => {
    const total = Math.max(0, parseFloat(montoTotal) || 0);
    const cant = Math.max(1, parseInt(cantCuotas, 10) || 1);
    const base = Math.floor((total / cant) * 100) / 100;
    const sumaBase = Math.round(base * cant * 100) / 100;
    const diferencia = Math.round((total - sumaBase) * 100) / 100;

    const list = [];
    for (let i = 0; i < cant; i++) {
      const esUltima = i === cant - 1;
      const montoCuota = esUltima
        ? Math.round((base + diferencia) * 100) / 100
        : base;

      const fechaCalculada = sumarDiasISO(fechaEmision, i * 30);
      const fechaFinal = fechasVencimientoPersonalizadas[i + 1] || fechaCalculada;
      const esCuotaPagada = i === 0 && Boolean(pagoInmediato);

      list.push({
        nro_cuota: i + 1,
        monto_cuota: montoCuota,
        fecha_vencimiento: fechaFinal,
        estado: esCuotaPagada ? 'Pagada' : 'Pendiente',
        metodo_pago: esCuotaPagada ? metodoPagoSeleccionado : null,
      });
    }

    return list;
  }, [montoTotal, cantCuotas, fechaEmision, pagoInmediato, metodoPagoSeleccionado, fechasVencimientoPersonalizadas]);

  // Modificar fecha de vencimiento individual de una cuota
  const handleCambiarFechaCuota = (nroCuota, nuevaFecha) => {
    setFechasVencimientoPersonalizadas((prev) => ({
      ...prev,
      [nroCuota]: nuevaFecha,
    }));
  };

  // Envío del Formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setExitoMsg('');

    // Validaciones estrictas
    if (!idPaciente) {
      setErrorMsg('Por favor selecciona un paciente para registrar el cobro.');
      return;
    }

    const montoNum = parseFloat(montoTotal);
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorMsg('El monto total a cobrar debe ser un valor numérico mayor a $0.');
      return;
    }

    const cantNum = parseInt(cantCuotas, 10) || 1;
    if (cantNum < 1) {
      setErrorMsg('La cantidad de cuotas debe ser al menos 1.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        id_paciente: Number(idPaciente),
        id_turno: idTurno ? Number(idTurno) : null,
        monto_total: Math.round(montoNum * 100) / 100,
        cant_cuotas: cantNum,
        primer_vencimiento: fechaEmision,
        intervalo_dias: 30,
        pago_inmediato: Boolean(pagoInmediato),
        metodo_pago: pagoInmediato ? metodoPagoSeleccionado : null,
      };

      await registrarCobro(payload);

      setExitoMsg('Cobro y plan de cuotas registrados con éxito.');

      // Notificar al componente padre para que refresque la tabla
      if (typeof onCobroRegistrado === 'function') {
        onCobroRegistrado();
      }

      // Cerrar modal tras breve feedback visual
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error al registrar el cobro:', err);
      setErrorMsg(err.message || 'Error al conectar con el servidor para registrar el cobro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-reg-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reg-titulo"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="modal-reg-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==========================================================
            1. Cabecera del Modal
            ========================================================== */}
        <div className="modal-reg-header">
          <div className="modal-reg-header-brand">
            <div className="modal-reg-logo-circle" aria-hidden="true">
              <ToothLogo size={32} />
            </div>
            <div>
              <h2 id="modal-reg-titulo" className="modal-reg-titulo">
                Registrar Nuevo Cobro
              </h2>
              <p className="modal-reg-subtitulo">
                Asentamiento contable administrativo y desglose de cuotas
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-reg-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar modal"
            title="Cerrar (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* ==========================================================
            2. Formulario de Datos
            ========================================================== */}
        <form onSubmit={handleSubmit} className="modal-reg-form">
          <div className="modal-reg-body">
            {/* Alertas de Feedback */}
            {errorMsg && (
              <div className="modal-reg-alert modal-reg-alert-error" role="alert">
                <AlertCircle size={18} className="alert-icon-svg" />
                <span>{errorMsg}</span>
              </div>
            )}

            {exitoMsg && (
              <div className="modal-reg-alert modal-reg-alert-success" role="alert">
                <CheckCircle2 size={18} className="alert-icon-svg" />
                <span>{exitoMsg}</span>
              </div>
            )}

            {/* SECCIÓN 1: PACIENTE Y TURNO */}
            <div className="modal-reg-seccion">
              <h3 className="modal-reg-seccion-titulo">
                <User size={16} /> Datos del Paciente y Consulta
              </h3>

              <div className="modal-reg-grid-2">
                {/* Selector de Paciente */}
                <div className="modal-reg-campo">
                  <label htmlFor="modal-reg-paciente" className="modal-reg-label">
                    Paciente <span className="campo-requerido">*</span>
                  </label>

                  {/* Input de filtro rápido */}
                  <div className="modal-reg-search-box">
                    <Search size={15} className="modal-reg-search-icon" />
                    <input
                      type="text"
                      className="modal-reg-search-input"
                      placeholder="Filtrar por nombre o DNI..."
                      value={busquedaPaciente}
                      onChange={(e) => setBusquedaPaciente(e.target.value)}
                      disabled={isSubmitting || cargandoPacientes}
                    />
                  </div>

                  <select
                    id="modal-reg-paciente"
                    className="modal-reg-select"
                    value={idPaciente}
                    onChange={(e) => {
                      setIdPaciente(e.target.value);
                      setIdTurno('');
                    }}
                    required
                    disabled={isSubmitting || cargandoPacientes}
                  >
                    <option value="">
                      {cargandoPacientes
                        ? 'Cargando pacientes...'
                        : '-- Seleccionar Paciente --'}
                    </option>
                    {pacientesFiltrados.map((p) => (
                      <option key={p.id_paciente} value={p.id_paciente}>
                        {p.apellido}, {p.nombre} (DNI: {p.dni || 'S/DNI'})
                      </option>
                    ))}
                  </select>

                  {pacienteSeleccionadoObj && (
                    <div className="paciente-seleccionado-info">
                      <span>
                        DNI: <strong>{pacienteSeleccionadoObj.dni || '-'}</strong>
                      </span>
                      <span>
                        Tel: <strong>{pacienteSeleccionadoObj.telefono || '-'}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Turno Asociado (Opcional) */}
                <div className="modal-reg-campo">
                  <label htmlFor="modal-reg-turno" className="modal-reg-label">
                    Turno Asociado <span className="campo-opcional">(Opcional)</span>
                  </label>
                  <select
                    id="modal-reg-turno"
                    className="modal-reg-select"
                    value={idTurno}
                    onChange={handleSelectTurno}
                    disabled={isSubmitting || !idPaciente || cargandoTurnos}
                  >
                    <option value="">
                      {!idPaciente
                        ? 'Primero selecciona un paciente'
                        : cargandoTurnos
                          ? 'Cargando turnos...'
                          : 'Pago libre / A cuenta (Sin turno específico)'}
                    </option>
                    {turnosPaciente.map((t) => {
                      const practicaNombre =
                        t.practica?.nombre_referencia ||
                        t.practicas?.[0]?.nombre_referencia ||
                        t.notas_consulta ||
                        'Consulta odontológica';
                      const fechaStr = t.fecha || t.fecha_hora_inicio?.slice(0, 10) || '';
                      const horaStr = t.hora || t.fecha_hora_inicio?.slice(11, 16) || '';
                      return (
                        <option key={t.id_turno} value={t.id_turno}>
                          Turno #{t.id_turno} - {formatearFechaVisual(fechaStr)} {horaStr && `${horaStr} hs`} ({practicaNombre})
                        </option>
                      );
                    })}
                  </select>
                  <span className="modal-reg-hint">
                    Vincula el cobro al tratamiento de un turno o déjalo libre como entrega a cuenta.
                  </span>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: CONDICIONES DE COBRO */}
            <div className="modal-reg-seccion">
              <h3 className="modal-reg-seccion-titulo">
                <DollarSign size={16} /> Importe y Plan de Financiación
              </h3>

              <div className="modal-reg-grid-3">
                {/* Monto Total a Cobrar */}
                <div className="modal-reg-campo">
                  <label htmlFor="modal-reg-monto" className="modal-reg-label">
                    Monto Total a Cobrar <span className="campo-requerido">*</span>
                  </label>
                  <div className="modal-reg-input-prefix-container">
                    <span className="input-prefix-symbol">$</span>
                    <input
                      id="modal-reg-monto"
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="modal-reg-input input-con-prefix"
                      placeholder="0.00"
                      value={montoTotal}
                      onChange={(e) => setMontoTotal(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Cantidad de Cuotas */}
                <div className="modal-reg-campo">
                  <label htmlFor="modal-reg-cuotas" className="modal-reg-label">
                    Cantidad de Cuotas <span className="campo-requerido">*</span>
                  </label>
                  <select
                    id="modal-reg-cuotas"
                    className="modal-reg-select"
                    value={cantCuotas}
                    onChange={(e) => setCantCuotas(parseInt(e.target.value, 10))}
                    disabled={isSubmitting}
                  >
                    <option value={1}>1 cuota (Pago Único)</option>
                    <option value={2}>2 cuotas</option>
                    <option value={3}>3 cuotas</option>
                    <option value={4}>4 cuotas</option>
                    <option value={6}>6 cuotas</option>
                    <option value={12}>12 cuotas</option>
                  </select>
                </div>

                {/* Fecha de Emisión */}
                <div className="modal-reg-campo">
                  <label htmlFor="modal-reg-fecha" className="modal-reg-label">
                    Fecha de Emisión <span className="campo-requerido">*</span>
                  </label>
                  <input
                    id="modal-reg-fecha"
                    type="date"
                    className="modal-reg-input"
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: PREVISUALIZACIÓN Y DESGLOSE DE CUOTAS */}
            <div className="modal-reg-seccion">
              <div className="modal-reg-seccion-header-row">
                <h3 className="modal-reg-seccion-titulo">
                  <Calendar size={16} /> Desglose y Liquidación de Cuotas
                </h3>

                {/* Resumen Total */}
                <div className="resumen-total-badge">
                  <span>Total: </span>
                  <strong>{formatearMoneda(montoTotal)}</strong>
                </div>
              </div>

              {/* Configuración de Pago Inmediato / Anticipo */}
              <div className="pago-inmediato-card">
                <div className="pago-inmediato-toggle-row">
                  <label className="toggle-switch-label">
                    <input
                      type="checkbox"
                      className="toggle-checkbox"
                      checked={pagoInmediato}
                      onChange={(e) => setPagoInmediato(e.target.checked)}
                      disabled={isSubmitting}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">
                      {cantCuotas === 1
                        ? 'Asentar como cobrado en el momento (Pago Inmediato)'
                        : 'Cobrar Cuota 1 en el momento como anticipo / seña'}
                    </span>
                  </label>
                </div>

                {pagoInmediato && (
                  <div className="metodo-pago-selector-box">
                    <label htmlFor="modal-reg-metodo" className="metodo-pago-label">
                      <CreditCard size={15} /> Forma de Pago de la Liquidación:
                    </label>
                    <select
                      id="modal-reg-metodo"
                      className="modal-reg-select select-metodo-inline"
                      value={metodoPagoSeleccionado}
                      onChange={(e) => setMetodoPagoSeleccionado(e.target.value)}
                      disabled={isSubmitting}
                    >
                      {METODOS_PAGO_OPCIONES.map((op, idx) => (
                        <option key={`${op.value}-${idx}`} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Tabla de Desglose de Cuotas */}
              <div className="tabla-cuotas-wrapper">
                <table className="tabla-cuotas-preview">
                  <thead>
                    <tr>
                      <th style={{ width: '16%' }}>N° Cuota</th>
                      <th style={{ width: '24%' }}>Monto</th>
                      <th style={{ width: '28%' }}>Fecha Vencimiento</th>
                      <th style={{ width: '18%' }}>Forma de Pago</th>
                      <th style={{ width: '14%' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuotasCalculadas.map((c) => (
                      <tr key={c.nro_cuota} className={c.estado === 'Pagada' ? 'fila-cuota-pagada' : ''}>
                        <td className="td-nro-cuota">
                          <span className="badge-nro-cuota">Cuota {c.nro_cuota}</span>
                        </td>
                        <td className="td-monto-cuota">
                          <strong>{formatearMoneda(c.monto_cuota)}</strong>
                        </td>
                        <td>
                          <input
                            type="date"
                            className="input-fecha-cuota-inline"
                            value={c.fecha_vencimiento}
                            onChange={(e) =>
                              handleCambiarFechaCuota(c.nro_cuota, e.target.value)
                            }
                            disabled={isSubmitting}
                          />
                        </td>
                        <td>
                          {c.metodo_pago ? (
                            <span className="badge-metodo-preview">
                              {c.metodo_pago}
                            </span>
                          ) : (
                            <span className="badge-metodo-pendiente">-</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge-estado-preview ${
                              c.estado === 'Pagada'
                                ? 'badge-preview-pagada'
                                : 'badge-preview-pendiente'
                            }`}
                          >
                            {c.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ==========================================================
              3. Pie del Modal con Acciones
              ========================================================== */}
          <div className="modal-reg-footer">
            <button
              type="button"
              className="btn-modal-cancelar"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-modal-confirmar"
              disabled={isSubmitting || !idPaciente || !montoTotal || Number(montoTotal) <= 0}
            >
              {isSubmitting ? (
                <>
                  <Clock size={16} className="icono-spinner" />
                  <span>Registrando Cobro...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirmar y Guardar Cobro</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalRegistrarCobro;
