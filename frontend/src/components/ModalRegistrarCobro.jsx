import { useState, useEffect, useMemo } from 'react';
import ToothLogo from './ToothLogo';
import { getPacientes } from '../services/pacientes.service';
import { getTurnosPorPaciente } from '../services/turnos.service';
import { registrarCobro, crearAcuerdo, normalizarMetodoPago } from '../services/cobros.service';
import {
  X,
  DollarSign,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  User,
  Clock,
  Layers,
  Wallet,
  ArrowRightLeft,
  Banknote,
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
 * Opciones de formas de pago
 */
const FORMAS_PAGO = [
  { id: 'Efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'Transferencia', label: 'Transferencia', icon: ArrowRightLeft },
  { id: 'Tarjeta Débito', label: 'Tarjeta Débito', icon: CreditCard },
  { id: 'Tarjeta Crédito', label: 'Tarjeta Crédito', icon: CreditCard },
];

/**
 * ModalRegistrarCobro - Modal Polimórfico Unificado
 * Permite registrar cobros en 3 modalidades:
 * 1. Pago Total (Inmediato)
 * 2. Plan de Cuotas Fijas
 * 3. Acuerdo Informal / Saldo Libre
 */
export const ModalRegistrarCobro = ({ isOpen, onClose, onCobroRegistrado }) => {
  // --- Estados de Catálogos ---
  const [pacientes, setPacientes] = useState([]);
  const [cargandoPacientes, setCargandoPacientes] = useState(false);

  const [turnosPaciente, setTurnosPaciente] = useState([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);

  // --- Datos Comunes ---
  const [idPaciente, setIdPaciente] = useState('');
  const [concepto, setConcepto] = useState('Consulta Odontológica');
  const [idTurno, setIdTurno] = useState('');

  // --- Modalidad Seleccionada ---
  // 'PAGO_TOTAL' | 'PLAN_CUOTAS' | 'ACUERDO_INFORMAL'
  const [modalidad, setModalidad] = useState('PAGO_TOTAL');

  // --- Campos Modalidad A: Pago Total ---
  const [montoPagoTotal, setMontoPagoTotal] = useState('');
  const [metodoPagoTotal, setMetodoPagoTotal] = useState('Efectivo');
  const [fechaPagoTotal, setFechaPagoTotal] = useState(getFechaHoyISO());

  // --- Campos Modalidad B: Plan de Cuotas Fijas ---
  const [montoPlanCuotas, setMontoPlanCuotas] = useState('');
  const [cantCuotas, setCantCuotas] = useState(3);
  const [primerVencimiento, setPrimerVencimiento] = useState(sumarDiasISO(getFechaHoyISO(), 30));
  const [cobrarPrimeraCuota, setCobrarPrimeraCuota] = useState(true);
  const [metodoPrimeraCuota, setMetodoPrimeraCuota] = useState('Efectivo');

  // --- Campos Modalidad C: Acuerdo Informal / Saldo Libre ---
  const [costoAcordado, setCostoAcordado] = useState('');
  const [entregaInicial, setEntregaInicial] = useState('');
  const [metodoEntregaInicial, setMetodoEntregaInicial] = useState('Efectivo');
  const [fechaEntregaInicial, setFechaEntregaInicial] = useState(getFechaHoyISO());

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

  // Cargar lista de pacientes al abrir
  useEffect(() => {
    if (!isOpen) return;

    let montado = true;
    const cargar = async () => {
      try {
        setCargandoPacientes(true);
        const data = await getPacientes();
        if (!montado) return;
        const activos = (Array.isArray(data) ? data : []).filter(
          (p) => p.activo !== false && p.activo !== 0
        );
        activos.sort((a, b) =>
          `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`)
        );
        setPacientes(activos);
      } catch (err) {
        if (!montado) return;
        console.error('Error al cargar pacientes:', err);
      } finally {
        if (montado) setCargandoPacientes(false);
      }
    };

    cargar();

    // Resetear formulario
    setIdPaciente('');
    setConcepto('Consulta Odontológica');
    setIdTurno('');
    setModalidad('PAGO_TOTAL');
    setMontoPagoTotal('');
    setMetodoPagoTotal('Efectivo');
    setFechaPagoTotal(getFechaHoyISO());
    setMontoPlanCuotas('');
    setCantCuotas(3);
    setPrimerVencimiento(sumarDiasISO(getFechaHoyISO(), 30));
    setCobrarPrimeraCuota(true);
    setMetodoPrimeraCuota('Efectivo');
    setCostoAcordado('');
    setEntregaInicial('');
    setMetodoEntregaInicial('Efectivo');
    setFechaEntregaInicial(getFechaHoyISO());
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
        console.error('Error al obtener turnos:', err);
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

  // Manejo de selección de turno opcional
  const handleSelectTurno = (e) => {
    const val = e.target.value;
    setIdTurno(val);
    if (val) {
      const turnoObj = turnosPaciente.find((t) => String(t.id_turno) === String(val));
      if (turnoObj) {
        if (turnoObj.notas_consulta) {
          setConcepto(turnoObj.notas_consulta);
        } else if (turnoObj.Practicas && turnoObj.Practicas.length > 0) {
          const nombres = turnoObj.Practicas.map((p) => p.nombre_referencia || p.nombre_nomenclador).filter(Boolean).join(', ');
          if (nombres) setConcepto(nombres);
        }
        const precio = Number(turnoObj.total || turnoObj.precio_final || 0);
        if (precio > 0) {
          const precioStr = precio.toFixed(2);
          setMontoPagoTotal(precioStr);
          setMontoPlanCuotas(precioStr);
          setCostoAcordado(precioStr);
        }
      }
    }
  };

  // Paciente seleccionado objeto
  const pacienteSeleccionadoObj = useMemo(() => {
    return pacientes.find((p) => String(p.id_paciente || p.id) === String(idPaciente));
  }, [pacientes, idPaciente]);

  // Previsualización dinámica de cuotas fijas
  const cuotasCalculadas = useMemo(() => {
    const total = Math.max(0, parseFloat(montoPlanCuotas) || 0);
    const cant = Math.max(1, parseInt(cantCuotas, 10) || 1);
    const base = Math.floor((total / cant) * 100) / 100;
    const sumaBase = Math.round(base * cant * 100) / 100;
    const diferencia = Math.round((total - sumaBase) * 100) / 100;

    const list = [];
    for (let i = 0; i < cant; i++) {
      const esUltima = i === cant - 1;
      const montoCuota = esUltima ? Math.round((base + diferencia) * 100) / 100 : base;
      const fechaVenc = sumarDiasISO(primerVencimiento || getFechaHoyISO(), i * 30);
      const pagada = i === 0 && cobrarPrimeraCuota;

      list.push({
        nro_cuota: i + 1,
        monto_cuota: montoCuota,
        fecha_vencimiento: fechaVenc,
        estado: pagada ? 'Pagada' : 'Pendiente',
        metodo_pago: pagada ? metodoPrimeraCuota : null,
      });
    }
    return list;
  }, [montoPlanCuotas, cantCuotas, primerVencimiento, cobrarPrimeraCuota, metodoPrimeraCuota]);

  // Cálculos reactivos para modalidad Acuerdo Informal
  const costoAcordadoNum = parseFloat(costoAcordado) || 0;
  const entregaInicialNum = parseFloat(entregaInicial) || 0;
  const saldoPendienteInformal = Math.max(0, Math.round((costoAcordadoNum - entregaInicialNum) * 100) / 100);

  // --- Manejo de Envío del Formulario Unificado ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setExitoMsg('');

    if (!idPaciente) {
      setErrorMsg('Debe seleccionar un paciente para registrar el cobro.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (modalidad === 'PAGO_TOTAL') {
        // ==========================================
        // Modalidad A: Pago Total Inmediato
        // ==========================================
        const montoNum = parseFloat(montoPagoTotal);
        if (isNaN(montoNum) || montoNum <= 0) {
          setErrorMsg('El monto a cobrar debe ser mayor a $0.');
          setIsSubmitting(false);
          return;
        }

        await registrarCobro({
          id_paciente: Number(idPaciente),
          id_turno: idTurno ? Number(idTurno) : null,
          monto_total: montoNum,
          cant_cuotas: 1,
          primer_vencimiento: fechaPagoTotal,
          pago_inmediato: true,
          metodo_pago: normalizarMetodoPago(metodoPagoTotal),
        });

        setExitoMsg('¡Pago total registrado con éxito! El paciente queda al día.');
      } else if (modalidad === 'PLAN_CUOTAS') {
        // ==========================================
        // Modalidad B: Plan de Cuotas Fijas
        // ==========================================
        const montoNum = parseFloat(montoPlanCuotas);
        if (isNaN(montoNum) || montoNum <= 0) {
          setErrorMsg('El monto a financiar debe ser mayor a $0.');
          setIsSubmitting(false);
          return;
        }

        const cantNum = parseInt(cantCuotas, 10) || 1;
        if (cantNum < 2) {
          setErrorMsg('El plan de cuotas debe tener al menos 2 cuotas.');
          setIsSubmitting(false);
          return;
        }

        await registrarCobro({
          id_paciente: Number(idPaciente),
          id_turno: idTurno ? Number(idTurno) : null,
          monto_total: montoNum,
          cant_cuotas: cantNum,
          primer_vencimiento: primerVencimiento,
          intervalo_dias: 30,
          pago_inmediato: Boolean(cobrarPrimeraCuota),
          metodo_pago: cobrarPrimeraCuota ? normalizarMetodoPago(metodoPrimeraCuota) : null,
        });

        setExitoMsg(`¡Plan de ${cantNum} cuotas registrado exitosamente!`);
      } else if (modalidad === 'ACUERDO_INFORMAL') {
        // ==========================================
        // Modalidad C: Acuerdo Informal / Saldo Libre
        // ==========================================
        if (isNaN(costoAcordadoNum) || costoAcordadoNum <= 0) {
          setErrorMsg('El costo total acordado debe ser mayor a $0.');
          setIsSubmitting(false);
          return;
        }

        if (entregaInicialNum > costoAcordadoNum) {
          setErrorMsg(`La entrega inicial (${formatearMoneda(entregaInicialNum)}) no puede superar el costo acordado (${formatearMoneda(costoAcordadoNum)}).`);
          setIsSubmitting(false);
          return;
        }

        await crearAcuerdo({
          id_paciente: Number(idPaciente),
          id_turno: idTurno ? Number(idTurno) : null,
          monto_a_cobrar: costoAcordadoNum,
          tipo_acuerdo: 'INFORMAL',
          cant_cuotas: 0,
          entrega_inicial: entregaInicialNum,
          metodo_pago: entregaInicialNum > 0 ? normalizarMetodoPago(metodoEntregaInicial) : null,
          fecha_cobro: entregaInicialNum > 0 ? `${fechaEntregaInicial}T12:00:00Z` : null,
        });

        setExitoMsg('¡Acuerdo de tratamiento registrado con éxito!');
      }

      // Notificar al componente padre para que refresque los saldos y estados
      if (typeof onCobroRegistrado === 'function') {
        onCobroRegistrado();
      }

      // Cerrar modal
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error al registrar cobro:', err);
      setErrorMsg(err.message || 'Error al conectar con el servidor.');
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
      <div className="modal-reg-card" onClick={(e) => e.stopPropagation()}>
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
                Registrar Cobro
              </h2>
              <p className="modal-reg-subtitulo">
                Módulo administrativo y contable de cobros
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-reg-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* ==========================================================
            2. Formulario Unificado
            ========================================================== */}
        <form onSubmit={handleSubmit} className="modal-reg-form">
          <div className="modal-reg-body">
            {/* Mensajes de Feedback */}
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

            {/* ==========================================================
                SECCIÓN 1: DATOS COMUNES (Paciente y Concepto)
                ========================================================== */}
            <div className="modal-reg-seccion">
              <h3 className="modal-reg-seccion-titulo">
                <User size={16} />
                <span>1. Datos del Paciente y Tratamiento</span>
              </h3>

              <div className="modal-reg-grid-2">
                {/* Selector de Paciente */}
                <div className="modal-reg-campo">
                  <label htmlFor="reg-paciente-select" className="modal-reg-label">
                    <span>Paciente</span>
                    <span className="campo-requerido">*</span>
                  </label>
                  <select
                    id="reg-paciente-select"
                    className="modal-reg-select"
                    value={idPaciente}
                    onChange={(e) => setIdPaciente(e.target.value)}
                    required
                  >
                    <option value="">
                      {cargandoPacientes ? 'Cargando pacientes...' : '-- Seleccionar Paciente --'}
                    </option>
                    {pacientes.map((p) => {
                      const id = p.id_paciente || p.id;
                      const apellido = p.apellido || '';
                      const nombre = p.nombre || '';
                      const dni = p.dni ? ` - DNI: ${p.dni}` : '';
                      return (
                        <option key={id} value={id}>
                          {apellido}, {nombre}{dni}
                        </option>
                      );
                    })}
                  </select>

                  {pacienteSeleccionadoObj && (
                    <div className="paciente-seleccionado-info">
                      <span>DNI: <strong>{pacienteSeleccionadoObj.dni || 'S/D'}</strong></span>
                      {pacienteSeleccionadoObj.telefono && (
                        <span>Tel: <strong>{pacienteSeleccionadoObj.telefono}</strong></span>
                      )}
                    </div>
                  )}
                </div>

                {/* Concepto / Tratamiento */}
                <div className="modal-reg-campo">
                  <label htmlFor="reg-concepto-input" className="modal-reg-label">
                    <span>Concepto / Tratamiento</span>
                    <span className="campo-requerido">*</span>
                  </label>
                  <input
                    id="reg-concepto-input"
                    type="text"
                    className="modal-reg-input"
                    placeholder="Ej: Tratamiento de Ortodoncia, Consulta Diagnóstico"
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Vincular a Turno (Opcional, si el paciente tiene turnos) */}
              {turnosPaciente.length > 0 && (
                <div className="modal-reg-campo">
                  <label htmlFor="reg-turno-select" className="modal-reg-label">
                    <Clock size={13} />
                    <span>Vincular a Turno</span>
                    <span className="campo-opcional">(Opcional)</span>
                  </label>
                  <select
                    id="reg-turno-select"
                    className="modal-reg-select"
                    value={idTurno}
                    onChange={handleSelectTurno}
                  >
                    <option value="">-- Sin vincular a turno específico --</option>
                    {turnosPaciente.map((t) => {
                      const fechaStr = t.fecha_hora_inicio ? formatearFechaVisual(t.fecha_hora_inicio.slice(0, 10)) : 'Fecha s/d';
                      const desc = t.notas_consulta || t.estado_nombre || 'Turno';
                      const precio = t.total || t.precio_final ? ` ($ ${Number(t.total || t.precio_final).toLocaleString('es-AR')})` : '';
                      return (
                        <option key={t.id_turno} value={t.id_turno}>
                          {fechaStr} — {desc}{precio}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            {/* ==========================================================
                SECCIÓN 2: SELECTOR DE MODALIDAD DE COBRO
                ========================================================== */}
            <div className="modal-reg-seccion">
              <h3 className="modal-reg-seccion-titulo">
                <DollarSign size={16} />
                <span>2. Modalidad de Cobro</span>
              </h3>

              <div className="modal-reg-modalidades-nav">
                {/* Modalidad 1: Pago Total */}
                <button
                  type="button"
                  className={`modal-reg-modalidad-btn tab-pago-total ${modalidad === 'PAGO_TOTAL' ? 'activa' : ''}`}
                  onClick={() => setModalidad('PAGO_TOTAL')}
                >
                  <div className="modalidad-header-badge">
                    <CheckCircle2 size={16} />
                    <span>Pago Total (Inmediato)</span>
                  </div>
                  <span className="modalidad-desc-text">
                    Cobro inmediato en 1 pago. El paciente queda al día.
                  </span>
                </button>

                {/* Modalidad 2: Plan de Cuotas Fijas */}
                <button
                  type="button"
                  className={`modal-reg-modalidad-btn tab-cuotas ${modalidad === 'PLAN_CUOTAS' ? 'activa' : ''}`}
                  onClick={() => setModalidad('PLAN_CUOTAS')}
                >
                  <div className="modalidad-header-badge">
                    <Layers size={16} />
                    <span>Plan de Cuotas Fijas</span>
                  </div>
                  <span className="modalidad-desc-text">
                    Cuotas mensuales fijas con fechas de vencimiento.
                  </span>
                </button>

                {/* Modalidad 3: Acuerdo Informal */}
                <button
                  type="button"
                  className={`modal-reg-modalidad-btn tab-acuerdo ${modalidad === 'ACUERDO_INFORMAL' ? 'activa' : ''}`}
                  onClick={() => setModalidad('ACUERDO_INFORMAL')}
                >
                  <div className="modalidad-header-badge">
                    <Wallet size={16} />
                    <span>Acuerdo Informal / Libre</span>
                  </div>
                  <span className="modalidad-desc-text">
                    Costo pactado total y pagos parciales a cuenta sin vencimiento.
                  </span>
                </button>
              </div>
            </div>

            {/* ==========================================================
                SECCIÓN 3: FORMULARIOS CONDICIONALES
                ========================================================== */}

            {/* 🟢 OPCIÓN A: PAGO TOTAL */}
            {modalidad === 'PAGO_TOTAL' && (
              <div className="modal-reg-seccion">
                <div className="modal-reg-seccion-header-row">
                  <h3 className="modal-reg-seccion-titulo">
                    <CreditCard size={16} />
                    <span>3. Detalle del Pago Inmediato</span>
                  </h3>
                  <div className="resumen-total-badge">
                    <span>Monto a cancelar: </span>
                    <strong>{formatearMoneda(montoPagoTotal)}</strong>
                  </div>
                </div>

                <div className="modal-reg-grid-2">
                  {/* Monto a Cobrar */}
                  <div className="flex-1 flex flex-col modal-reg-campo">
                    <label htmlFor="reg-monto-total-input" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1 modal-reg-label">
                      <span>Monto a Cobrar</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center w-full">
                      <span className="absolute left-3 text-slate-400 font-semibold select-none pointer-events-none text-sm z-10">
                        $
                      </span>
                      <input
                        id="reg-monto-total-input"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        className="w-full h-[42px] pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-left modal-reg-input"
                        value={montoPagoTotal}
                        onChange={(e) => setMontoPagoTotal(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Fecha de Cobro */}
                  <div className="flex-1 flex flex-col modal-reg-campo">
                    <label htmlFor="reg-fecha-cobro-input" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1 modal-reg-label">
                      <Calendar size={13} className="text-slate-500" />
                      <span>Fecha de Cobro</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="reg-fecha-cobro-input"
                      type="date"
                      className="w-full h-[42px] px-3 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all modal-reg-input"
                      value={fechaPagoTotal}
                      onChange={(e) => setFechaPagoTotal(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Forma de Pago */}
                <div className="modal-reg-campo">
                  <label className="modal-reg-label">
                    <span>Forma de Pago</span>
                    <span className="campo-requerido">*</span>
                  </label>
                  <div className="metodos-pago-grid-4">
                    {FORMAS_PAGO.map((fp) => {
                      const Icon = fp.icon;
                      const activo = metodoPagoTotal === fp.id;
                      return (
                        <button
                          key={fp.id}
                          type="button"
                          className={`btn-metodo-tarjeta ${activo ? 'activo' : ''}`}
                          onClick={() => setMetodoPagoTotal(fp.id)}
                        >
                          <Icon size={18} />
                          <span>{fp.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="info-banner-modalidad verde">
                  ✓ El cobro se asentará en una única cuota cancelada en el acto. El paciente quedará <strong>Al Día</strong> con saldo pendiente de $0.
                </div>
              </div>
            )}

            {/* 🔵 OPCIÓN B: PLAN DE CUOTAS FIJAS */}
            {modalidad === 'PLAN_CUOTAS' && (
              <div className="modal-reg-seccion">
                <div className="modal-reg-seccion-header-row">
                  <h3 className="modal-reg-seccion-titulo">
                    <Layers size={16} />
                    <span>3. Configuración de Cuotas Fijas</span>
                  </h3>
                  <div className="resumen-total-badge">
                    <span>Total a financiar: </span>
                    <strong>{formatearMoneda(montoPlanCuotas)}</strong>
                  </div>
                </div>

                <div className="modal-reg-grid-3">
                  {/* Monto Total */}
                  <div className="flex-1 flex flex-col modal-reg-campo">
                    <label htmlFor="reg-monto-plan-input" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1 modal-reg-label">
                      <span>Monto Total</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center w-full">
                      <span className="absolute left-3 text-slate-400 font-semibold select-none pointer-events-none text-sm z-10">
                        $
                      </span>
                      <input
                        id="reg-monto-plan-input"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        className="w-full h-[42px] pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-left modal-reg-input"
                        value={montoPlanCuotas}
                        onChange={(e) => setMontoPlanCuotas(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Cantidad de Cuotas */}
                  <div className="flex-1 flex flex-col modal-reg-campo">
                    <label htmlFor="reg-cant-cuotas-select" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1 modal-reg-label">
                      <span>Cantidad de Cuotas</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="reg-cant-cuotas-select"
                      className="w-full h-[42px] px-3 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all modal-reg-select"
                      value={cantCuotas}
                      onChange={(e) => setCantCuotas(Number(e.target.value))}
                    >
                      <option value={2}>2 cuotas fijas</option>
                      <option value={3}>3 cuotas fijas</option>
                      <option value={4}>4 cuotas fijas</option>
                      <option value={6}>6 cuotas fijas</option>
                      <option value={12}>12 cuotas fijas</option>
                    </select>
                  </div>

                  {/* Primer Vencimiento */}
                  <div className="flex-1 flex flex-col modal-reg-campo">
                    <label htmlFor="reg-vencimiento-input" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1 modal-reg-label">
                      <Calendar size={13} className="text-slate-500" />
                      <span>1° Vencimiento</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="reg-vencimiento-input"
                      type="date"
                      className="w-full h-[42px] px-3 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all modal-reg-input"
                      value={primerVencimiento}
                      onChange={(e) => setPrimerVencimiento(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Anticipo / Cobro de 1° Cuota en el acto */}
                <div className="pago-inmediato-card">
                  <div className="pago-inmediato-toggle-row">
                    <label className="toggle-switch-label">
                      <input
                        type="checkbox"
                        className="toggle-checkbox"
                        checked={cobrarPrimeraCuota}
                        onChange={(e) => setCobrarPrimeraCuota(e.target.checked)}
                      />
                      <span className="toggle-slider" aria-hidden="true"></span>
                      <span className="toggle-text">
                        Cobrar 1° cuota en el momento (Anticipo / Seña)
                      </span>
                    </label>
                  </div>

                  {cobrarPrimeraCuota && (
                    <div className="modal-reg-campo" style={{ marginTop: '8px' }}>
                      <label className="modal-reg-label">Forma de Pago de la 1° Cuota</label>
                      <div className="metodos-pago-grid-4">
                        {FORMAS_PAGO.map((fp) => {
                          const Icon = fp.icon;
                          const activo = metodoPrimeraCuota === fp.id;
                          return (
                            <button
                              key={fp.id}
                              type="button"
                              className={`btn-metodo-tarjeta ${activo ? 'activo' : ''}`}
                              onClick={() => setMetodoPrimeraCuota(fp.id)}
                            >
                              <Icon size={16} />
                              <span>{fp.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Grilla de Previsualización */}
                <div className="tabla-cuotas-wrapper">
                  <table className="tabla-cuotas-preview">
                    <thead>
                      <tr>
                        <th style={{ width: '15%' }}>Cuota</th>
                        <th style={{ width: '30%' }}>Vencimiento</th>
                        <th style={{ width: '25%' }}>Monto</th>
                        <th style={{ width: '30%' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cuotasCalculadas.map((c) => (
                        <tr key={c.nro_cuota} className={c.estado === 'Pagada' ? 'fila-cuota-pagada' : ''}>
                          <td>
                            <span className="badge-nro-cuota">Cuota {c.nro_cuota}</span>
                          </td>
                          <td>{formatearFechaVisual(c.fecha_vencimiento)}</td>
                          <td className="td-monto-cuota">
                            <strong>{formatearMoneda(c.monto_cuota)}</strong>
                          </td>
                          <td>
                            <span className={`badge-estado-preview ${c.estado === 'Pagada' ? 'badge-preview-pagada' : 'badge-preview-pendiente'}`}>
                              {c.estado} {c.metodo_pago ? `(${c.metodo_pago})` : ''}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 🟠 OPCIÓN C: ACUERDO INFORMAL / SALDO LIBRE */}
            {modalidad === 'ACUERDO_INFORMAL' && (
              <div className="modal-reg-seccion">
                <div className="modal-reg-seccion-header-row">
                  <h3 className="modal-reg-seccion-titulo">
                    <Wallet size={16} />
                    <span>3. Costo Acordado y Entrega Inicial</span>
                  </h3>
                </div>

                <div className="modal-reg-grid-2">
                  {/* Costo Acordado Total */}
                  <div className="flex-1 flex flex-col modal-reg-campo">
                    <label htmlFor="reg-costo-acordado-input" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1 modal-reg-label">
                      <span>Costo Acordado Total</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center w-full">
                      <span className="absolute left-3 text-slate-400 font-semibold select-none pointer-events-none text-sm z-10">
                        $
                      </span>
                      <input
                        id="reg-costo-acordado-input"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        className="w-full h-[42px] pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-left modal-reg-input"
                        value={costoAcordado}
                        onChange={(e) => setCostoAcordado(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Entrega Inicial / Seña (Opcional) */}
                  <div className="flex-1 flex flex-col modal-reg-campo">
                    <label htmlFor="reg-entrega-inicial-input" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1 modal-reg-label">
                      <span>Entrega Inicial / Seña</span>
                      <span className="text-slate-400 text-[11px] font-normal">(Opcional)</span>
                    </label>
                    <div className="relative flex items-center w-full">
                      <span className="absolute left-3 text-slate-400 font-semibold select-none pointer-events-none text-sm z-10">
                        $
                      </span>
                      <input
                        id="reg-entrega-inicial-input"
                        type="number"
                        step="0.01"
                        min="0"
                        max={costoAcordadoNum || undefined}
                        placeholder="0.00"
                        className="w-full h-[42px] pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-left modal-reg-input"
                        value={entregaInicial}
                        onChange={(e) => setEntregaInicial(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Si ingresó entrega inicial > 0, pedir forma de pago y fecha */}
                {entregaInicialNum > 0 && (
                  <div className="pago-inmediato-card">
                    <div className="modal-reg-grid-2">
                      <div className="modal-reg-campo">
                        <label className="modal-reg-label">Forma de Pago de la Entrega</label>
                        <div className="metodos-pago-grid-4">
                          {FORMAS_PAGO.map((fp) => {
                            const Icon = fp.icon;
                            const activo = metodoEntregaInicial === fp.id;
                            return (
                              <button
                                key={fp.id}
                                type="button"
                                className={`btn-metodo-tarjeta ${activo ? 'activo' : ''}`}
                                onClick={() => setMetodoEntregaInicial(fp.id)}
                              >
                                <Icon size={16} />
                                <span>{fp.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col modal-reg-campo">
                        <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1 modal-reg-label">
                          <Calendar size={13} className="text-slate-500" />
                          <span>Fecha de la Entrega</span>
                        </label>
                        <input
                          type="date"
                          className="w-full h-[42px] px-3 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all modal-reg-input"
                          value={fechaEntregaInicial}
                          onChange={(e) => setFechaEntregaInicial(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Balance Summary Box */}
                <div className="acuerdo-resumen-box">
                  <div className="acuerdo-resumen-item">
                    <span className="acuerdo-resumen-label">Costo Total Pactado</span>
                    <span className="acuerdo-resumen-valor">{formatearMoneda(costoAcordadoNum)}</span>
                  </div>

                  <div className="acuerdo-resumen-item">
                    <span className="acuerdo-resumen-label">Entrega Inicial</span>
                    <span className="acuerdo-resumen-valor verde">
                      {entregaInicialNum > 0 ? formatearMoneda(entregaInicialNum) : '$ 0,00'}
                    </span>
                  </div>

                  <div className="acuerdo-resumen-item" style={{ textAlign: 'right' }}>
                    <span className="acuerdo-resumen-label">Saldo Pendiente Inicial</span>
                    <span className={`acuerdo-resumen-valor ${saldoPendienteInformal > 0 ? 'coral' : 'verde'}`}>
                      {formatearMoneda(saldoPendienteInformal)}
                    </span>
                  </div>
                </div>

                <div className="info-banner-modalidad naranja">
                  ℹ Se registrará el costo total acordado. El paciente abonará entregas o pagos parciales según sus posibilidades sin vencimientos preestablecidos hasta llegar a $0.
                </div>
              </div>
            )}
          </div>

          {/* ==========================================================
              Pie de Modal (Acciones)
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
              disabled={
                isSubmitting ||
                !idPaciente ||
                (modalidad === 'PAGO_TOTAL' && (!montoPagoTotal || parseFloat(montoPagoTotal) <= 0)) ||
                (modalidad === 'PLAN_CUOTAS' && (!montoPlanCuotas || parseFloat(montoPlanCuotas) <= 0)) ||
                (modalidad === 'ACUERDO_INFORMAL' && (!costoAcordado || parseFloat(costoAcordado) <= 0))
              }
            >
              {isSubmitting ? (
                <span>Registrando...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>
                    {modalidad === 'PAGO_TOTAL' && 'Confirmar Pago Total'}
                    {modalidad === 'PLAN_CUOTAS' && 'Confirmar Plan de Cuotas'}
                    {modalidad === 'ACUERDO_INFORMAL' && 'Crear Acuerdo de Tratamiento'}
                  </span>
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
