/** @format */
import { useMemo } from "react";

export function useMovimientosCaja(cobros = [], gastos = [], turnosPendientes = [], busqueda = "", resumenPeriodo = null) {
  // Filtro defensivo: solo turnos efectivamente atendidos con saldo pendiente
  const turnosFiltrados = useMemo(() => {
    if (!turnosPendientes || !Array.isArray(turnosPendientes)) return [];
    return turnosPendientes.filter((item) => {
      const turno = item.Turno || item;

      const estadoNombre = (
        turno.estado ||
        turno.EstadoTurno?.nombre ||
        turno.EstadoTurno?.estado ||
        turno.estado_turno ||
        ""
      ).toString().toLowerCase().trim();

      const estaAtendido = estadoNombre === "atendido" || Number(turno.id_estado) === 2;

      const saldo = Number(
        item.saldo_pendiente ??
        turno.saldo_pendiente ??
        item.total_deuda ??
        turno.total_deuda ??
        item.precio_final ??
        turno.precio_final ??
        item.precio ??
        turno.precio ??
        0
      );

      return estaAtendido && saldo > 0;
    });
  }, [turnosPendientes]);

  const totalPendienteCobro = useMemo(() => {
    return turnosFiltrados.reduce((acc, item) => {
      const turno = item.Turno || item;
      const saldo = Number(
        item.saldo_pendiente ??
        turno.saldo_pendiente ??
        item.total_deuda ??
        turno.total_deuda ??
        item.precio_final ??
        turno.precio_final ??
        item.precio ??
        turno.precio ??
        0
      );
      return acc + (saldo > 0 ? saldo : 0);
    }, 0);
  }, [turnosFiltrados]);

  const kpis = useMemo(() => {
    if (resumenPeriodo && (resumenPeriodo.ingresosTotales !== undefined || resumenPeriodo.egresosTotales !== undefined)) {
      return {
        totalIngresos: Number(resumenPeriodo.ingresosTotales) || 0,
        totalEgresos: Number(resumenPeriodo.egresosTotales) || 0,
        balanceNeto: Number(resumenPeriodo.balancePeriodo) || 0,
        totalPendienteCobro,
      };
    }

    const totalIngresos = cobros.reduce((acc, c) => {
      const cuotas = c.Cuotas || c.Cuota || [];
      return acc + cuotas.reduce((qAcc, q) => qAcc + (Number(q.monto_cobrado) || 0), 0);
    }, 0);

    const totalEgresos = gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);

    return {
      totalIngresos,
      totalEgresos,
      balanceNeto: totalIngresos - totalEgresos,
      totalPendienteCobro,
    };
  }, [resumenPeriodo, cobros, gastos, totalPendienteCobro]);

  const movimientosUnificados = useMemo(() => {
    const listaIngresos = cobros
      .map((c) => {
        const cuotas = c.Cuotas || c.Cuota || [];
        const totalPagado = cuotas.reduce((acc, q) => acc + (Number(q.monto_cobrado) || 0), 0);
        const metodos = [...new Set(cuotas.filter((q) => Number(q.monto_cobrado) > 0).map((q) => q.metodo_pago).filter(Boolean))];

        return {
          id: `ingreso-${c.id_cobro}`,
          tipo: "ingreso",
          concepto: `Cobro a ${c.Paciente ? `${c.Paciente.apellido}, ${c.Paciente.nombre}` : "Paciente"}`,
          categoria: "Cobro de Atención",
          monto: totalPagado,
          fecha: c.fecha_emision || c.fecha_cobro || c.createdAt,
          metodo_pago: metodos.length > 0 ? metodos.join(", ") : "Efectivo",
          comprobante: `Cobro #${c.id_cobro}`,
          cobroOriginal: c,
        };
      })
      .filter((ingreso) => ingreso.monto > 0); // 👈 Filtra cualquier registro de $0

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

  return {
    kpis,
    movimientosUnificados,
    turnosFiltrados,
    turnosPorCobrarValidos: turnosFiltrados,
  };
}