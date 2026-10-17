/**
 * Calcula el saldo pendiente y el estado contable de un cobro
 */
export const calcularEstadoYSaldo = (cobro) => {
  const total = Number(cobro.monto_a_cobrar) || 0;
  const pagado = (cobro.Cuota || []).reduce((acc, c) => acc + (Number(c.monto_cobrado) || 0), 0);

  const saldo = Math.max(0, total - pagado);

  let estado = "Pendiente";
  if (saldo === 0 && total > 0) {
    estado = "Pagada";
  } else if (pagado > 0) {
    estado = "Parcial";
  }

  return { saldo, estado, pagado };
};
