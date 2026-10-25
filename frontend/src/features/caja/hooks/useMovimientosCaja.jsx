/** @format */
import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../../services/api";

export function useMovimientosCaja(cobros, gastos, turnosPendientes, busqueda) {
  const [kpis, setKpis] = useState({
    totalIngresos: 0,
    totalEgresos: 0,
    balanceNeto: 0,
    totalPendienteCobro: 0,
  });
  const [cargandoKpis, setCargandoKpis] = useState(false);


  const cargarKpis = useCallback(async () => {
    setCargandoKpis(true);
    try {
      const res = await api.get("/cobros/kpis");
      if (res.data?.data) {
        setKpis(res.data.data);
      }
    } catch (error) {
      console.error("Error al cargar KPIs de caja:", error);
    } finally {
      setCargandoKpis(false);
    }
  }, []);

  // Se recarga al montar o cuando cambian las colecciones por una operación
  useEffect(() => {
    cargarKpis();
  }, [cargarKpis, cobros.length, gastos.length, turnosPendientes.length]);


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

  return { kpis, movimientosUnificados, cargarKpis, cargandoKpis };
}