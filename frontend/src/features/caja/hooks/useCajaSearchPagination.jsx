/** @format */
import { useState, useEffect, useMemo } from "react";
import api from "../../../services/api";

export function useCajaSearchPagination(limitPorDefecto = 9) {
  // * DEFINICIÓN DE ESTADOS GENERALES
  const [cargando, setCargando] = useState(false);
  const [search, setSearchState] = useState("");
  const [order, setOrder] = useState({ column: "", direction: "ASC" });

  // * ESTADO DE PERÍODO (MES SELECCIONADO)
  const [fechaMes, setFechaMes] = useState(new Date());

  //* DATOS COBRO
  const [cobros, setCobros] = useState([]);
  const [pageCobro, setPageCobro] = useState(1);
  const [totalCobro, setTotalCobro] = useState(0);
  const [totalPagesCobro, setTotalPagesCobro] = useState(1);

  //* DATOS GASTO
  const [gastos, setGastos] = useState([]);
  const [pageGasto, setPageGasto] = useState(1);
  const [totalGasto, setTotalGasto] = useState(0);
  const [totalPagesGasto, setTotalPagesGasto] = useState(1);

  //* RESUMEN FINANCIERO DEL PERÍODO (Calculado por el backend)
  const [resumenPeriodo, setResumenPeriodo] = useState({
    ingresosTotales: 0,
    egresosTotales: 0,
    balancePeriodo: 0,
  });

  //* DATOS TURNO
  const [turnosPendientes, setTurnosPendientes] = useState([]);

  // * CÁLCULO DE FECHA_INICIO Y FECHA_FIN PARA EL QUERY
  const { fecha_inicio, fecha_fin } = useMemo(() => {
    const año = fechaMes.getFullYear();
    const mes = fechaMes.getMonth();
    const inicio = `${año}-${String(mes + 1).padStart(2, "0")}-01`;
    const ultimoDia = new Date(año, mes + 1, 0).getDate();
    const fin = `${año}-${String(mes + 1).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
    return { fecha_inicio: inicio, fecha_fin: fin };
  }, [fechaMes]);

  // * BUSCAR DATOS UTILIZANDO LA RUTA UNIFICADA DE CAJA CON FILTRO DE FECHAS
  const fetchData = async () => {
    setCargando(true);
    try {
      const respuesta = await api.get("/caja", {
        params: {
          pageCobro,
          limitCobro: limitPorDefecto,
          pageGasto,
          limitGasto: limitPorDefecto,
          searchCobro: search,
          searchGasto: search,
          fecha_inicio,
          fecha_fin,
        },
      });

      const { data, meta, resumen } = respuesta.data;

      // 1. Asignación de cobros
      setCobros(data?.cobros || []);
      setPageCobro(meta?.cobros?.page || pageCobro);
      setTotalPagesCobro(meta?.cobros?.totalPages || 1);
      setTotalCobro(meta?.cobros?.total || 0);

      // 2. Asignación de gastos
      setGastos(data?.gastos || []);
      setPageGasto(meta?.gastos?.page || pageGasto);
      setTotalPagesGasto(meta?.gastos?.totalPages || 1);
      setTotalGasto(meta?.gastos?.total || 0);

      // 3. Asignación del resumen del período
      if (resumen) {
        setResumenPeriodo({
          ingresosTotales: Number(resumen.ingresosTotales) || 0,
          egresosTotales: Number(resumen.egresosTotales) || 0,
          balancePeriodo: Number(resumen.balancePeriodo) || 0,
        });
      }

      // 4. Obtener turnos atendidos pendientes de cobro
      const resTurnos = await api.get("/turnos/atendidos");
      setTurnosPendientes(resTurnos.data.data || []);
    } catch (error) {
      console.error("Error al cargar los datos consolidados de caja:", error);
    } finally {
      setCargando(false);
    }
  };

  // * RECARGAR DATOS CUANDO CAMBIA DE PÁGINA, BÚSQUEDA O MES
  useEffect(() => {
    fetchData();
  }, [pageCobro, pageGasto, search, fecha_inicio, fecha_fin]);

  // * SETEA LA BÚSQUEDA Y RESETEA PÁGINAS
  const setSearch = (nuevoTermino) => {
    setSearchState(nuevoTermino);
    setPageCobro(1);
    setPageGasto(1);
  };

  // * SETEA EL MES Y RESETEA PÁGINAS
  const cambiarMes = (nuevaFecha) => {
    setFechaMes(nuevaFecha);
    setPageCobro(1);
    setPageGasto(1);
  };

  // * CÁLCULOS PARA LOS REGISTROS MOSTRADOS EN HEADER
  const inicioRegistroCobro = totalCobro === 0 ? 0 : (pageCobro - 1) * limitPorDefecto + 1;
  const finRegistroCobro =
    totalCobro === 0 ? 0 : pageCobro === totalPagesCobro ? totalCobro : pageCobro * limitPorDefecto;

  const inicioRegistroGasto = totalGasto === 0 ? 0 : (pageGasto - 1) * limitPorDefecto + 1;
  const finRegistroGasto =
    totalGasto === 0 ? 0 : pageGasto === totalPagesGasto ? totalGasto : pageGasto * limitPorDefecto;

  return {
    cobros,
    gastos,
    turnosPendientes,
    cargando,

    pageCobro,
    setPageCobro,
    totalCobro,
    totalPagesCobro,
    pageGasto,
    setPageGasto,
    totalGasto,
    totalPagesGasto,

    search,
    setSearch,
    order,
    setOrder,

    fechaMes,
    setFechaMes: cambiarMes,
    resumenPeriodo,

    inicioRegistroCobro,
    finRegistroCobro,
    inicioRegistroGasto,
    finRegistroGasto,
    recargar: fetchData,
  };
}