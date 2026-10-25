/** @format */
import { useMemo } from "react";

export function useMovimientosCaja(cobros, gastos, turnosPendientes, busqueda) {
  // ─── CÁLCULOS FINANCIEROS KPI ───
  const kpis = useMemo(() => {
    let totalIngresos = 0;
    cobros.forEach((c) => {
      const pagado = (c.Cuotas || c.Cuota || []).reduce((acc, q) => acc + (Number(q.monto_cobrado) || 0), 0);
      totalIngresos += pagado;
    });

    const totalEgresos = gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
    const totalPendienteCobro = turnosPendientes.reduce((acc, t) => acc + (Number(t.precio_final) || 0), 0);

    return {
      totalIngresos,
      totalEgresos,
      balanceNeto: totalIngresos - totalEgresos,
      totalPendienteCobro,
    };
  }, [gastos, cobros, turnosPendientes]);

  // ─── UNIFICACIÓN Y FILTRADO DE MOVIMIENTOS ───
  const movimientosUnificados = useMemo(() => {
    const listaIngresos = cobros.map((c) => ({
      id: `ingreso-${c.id_cobro}`,
      tipo: "ingreso",
      concepto: `Cobro a ${c.Paciente ? `${c.Paciente.apellido}, ${c.Paciente.nombre}` : "Paciente"}`,
      categoria: "Cobro de Atención",
      monto: (c.Cuotas || c.Cuota || []).reduce((acc, q) => acc + (Number(q.monto_cobrado) || 0), 0),
      fecha: c.fecha_emision || c.createdAt,
      metodo_pago: c.modalidad || "Efectivo",
      comprobante: `Cobro #${c.id_cobro}`,
    }));

    const listaEgresos = gastos.map((g) => ({
      id: `egreso-${g.id_gasto}`,
      tipo: "egreso",
      concepto: g.concepto,
      categoria: g.CategoriaGasto?.nombre || "Gasto General",
      monto: Number(g.monto) || 0,
      fecha: g.fecha_gasto,
      metodo_pago: g.metodo_pago,
      comprobante: g.comprobante || `Gasto #${g.id_gasto}`,
    }));

    const unificados = [...listaIngresos, ...listaEgresos].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha),
    );

    if (!busqueda || busqueda.trim() === "") return unificados;

    const query = busqueda.toLowerCase();
    return unificados.filter(
      (m) =>
        m.concepto.toLowerCase().includes(query) ||
        m.categoria.toLowerCase().includes(query) ||
        m.comprobante.toLowerCase().includes(query),
    );
  }, [cobros, gastos, busqueda]);

  return { kpis, movimientosUnificados };
}
