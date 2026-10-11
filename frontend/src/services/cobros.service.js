/**
 * cobros.service.js - Servicio de Cobros y Pagos para M&V Turnos
 * Conexión limpia con los endpoints /api/cobros y /api/cuotas
 */
import api, { extractErrorMessage } from './api';

/**
 * Normaliza el string de método de pago para que coincida exactamente
 * con el ENUM del modelo Cuota ('Efectivo', 'Transferencia', 'Tarjeta', 'Otro')
 * @param {string} metodo
 * @returns {string}
 */
export const normalizarMetodoPago = (metodo) => {
  if (!metodo) return 'Efectivo';
  const m = String(metodo).trim().toLowerCase();
  if (m === 'efectivo') return 'Efectivo';
  if (m === 'transferencia') return 'Transferencia';
  if (m === 'tarjeta') return 'Tarjeta';
  return 'Otro';
};

/**
 * Normaliza el tipo de cobro ('Pago Total', 'Entrega Parcial', 'Seña')
 * @param {string} tipo
 * @returns {string}
 */
export const normalizarTipoCobro = (tipo) => {
  if (!tipo) return 'Pago Total';
  const t = String(tipo).trim().toLowerCase();
  if (t.includes('parcial') || t === 'entrega parcial') return 'Entrega Parcial';
  if (t.includes('seña') || t.includes('sena') || t === 'seña') return 'Seña';
  return 'Pago Total';
};

/**
 * Registra un cobro / ingreso de dinero de un paciente.
 * Utiliza el endpoint atómico /api/cobros/plan-pago o /api/cobros según corresponda.
 *
 * @param {Object} datosCobro
 * @param {number} datosCobro.id_paciente - ID del paciente registrado
 * @param {number} [datosCobro.id_turno] - ID del turno vinculado (opcional)
 * @param {number|string} datosCobro.monto - Monto del cobro (> 0)
 * @param {string} [datosCobro.fecha] - Fecha de cobro en formato YYYY-MM-DD
 * @param {string} datosCobro.metodo_pago - 'Efectivo' | 'Transferencia' | 'Tarjeta'
 * @param {string} [datosCobro.tipo_cobro] - 'Pago total' | 'Entrega parcial' | 'Seña'
 * @param {string} [datosCobro.observaciones] - Notas u observaciones del cobro
 * @returns {Promise<Object>} Resultado del registro
 */
export const registrarCobro = async (datosCobro) => {
  if (!datosCobro) {
    throw new Error('No se proporcionaron datos para registrar el cobro.');
  }

  const rawMonto = datosCobro.monto ?? datosCobro.monto_total ?? datosCobro.monto_a_cobrar;
  const montoNum = parseFloat(rawMonto);
  if (isNaN(montoNum) || montoNum <= 0) {
    throw new Error('El monto a cobrar debe ser un valor numérico mayor a $0.');
  }

  if (!datosCobro.id_paciente) {
    throw new Error('Debe seleccionar un paciente para registrar el cobro.');
  }

  const metodoNormalizado = normalizarMetodoPago(datosCobro.metodo_pago);
  const fechaStr = datosCobro.primer_vencimiento
    ? String(datosCobro.primer_vencimiento).slice(0, 10)
    : datosCobro.fecha
      ? String(datosCobro.fecha).slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  const pagoInmediato = Boolean(
    datosCobro.pago_inmediato !== undefined
      ? datosCobro.pago_inmediato
      : (datosCobro.estado === 'Pagada' || datosCobro.estado === 'PAGADA')
  );

  const payloadPlan = {
    id_paciente: Number(datosCobro.id_paciente),
    id_turno: datosCobro.id_turno ? Number(datosCobro.id_turno) : null,
    monto_total: Math.round(montoNum * 100) / 100,
    cant_cuotas: Math.max(1, parseInt(datosCobro.cant_cuotas, 10) || 1),
    primer_vencimiento: fechaStr,
    intervalo_dias: Number(datosCobro.intervalo_dias || 30),
    pago_inmediato: pagoInmediato,
    metodo_pago: pagoInmediato ? metodoNormalizado : null,
  };

  try {
    const res = await api.post('/cobros/plan-pago', payloadPlan);
    return res?.data || res;
  } catch (err) {
    const msg = extractErrorMessage(
      err,
      'Error al registrar el cobro en el servidor.'
    );
    throw new Error(msg);
  }
};

/**
 * Obtiene los cobros asociados a un turno específico
 * @param {number} turnoId
 * @returns {Promise<Array>}
 */
export const getCobrosByTurnoId = async (turnoId) => {
  try {
    const res = await api.get(`/cobros/${turnoId}/cobros`);
    return Array.isArray(res?.data) ? res.data : [];
  } catch (err) {
    console.warn(`No se pudieron obtener cobros para el turno ${turnoId}:`, extractErrorMessage(err));
    return [];
  }
};

/**
 * Obtiene las cuotas asociadas a un cobro
 * @param {number} cobroId
 * @returns {Promise<Array>}
 */
export const getCuotasByCobroId = async (cobroId) => {
  try {
    const res = await api.get(`/cuotas/${cobroId}/cuotas`);
    return Array.isArray(res?.data) ? res.data : [];
  } catch (err) {
    console.warn(`No se pudieron obtener cuotas para el cobro ${cobroId}:`, extractErrorMessage(err));
    return [];
  }
};

/**
 * Obtiene todos los cobros registrados en el sistema
 * @returns {Promise<Object>}
 */
export const getCobros = async () => {
  const response = await api.get('/cobros');
  return response.data;
};

/**
 * Obtiene un cobro por su ID
 * @param {number|string} idCobro
 * @returns {Promise<Object>}
 */
export const getCobroById = async (idCobro) => {
  const res = await api.get(`/cobros/${idCobro}`);
  return res.data;
};

export default {
  getCobros,
  getCobroById,
  registrarCobro,
  normalizarMetodoPago,
  normalizarTipoCobro,
  getCobrosByTurnoId,
  getCuotasByCobroId,
};
