/** @format */
import { useState, useEffect } from "react";
import api from "../../../services/api";

export function useCajaSearchPagination(limitPorDefecto = 9) {
  // * DEFINICIÓN DE ESTADOS GENERALES
  const [cargando, setCargando] = useState(false);
  const [search, setSearchState] = useState("");
  const [order, setOrder] = useState({ column: "", direction: "ASC" });

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

  //* DATOS TURNO
  const [turnosPendientes, setTurnosPendientes] = useState([]);

  // * BUSCAR DATOS UTILIZANDO LA RUTA UNIFICADA DE CAJA
  const fetchData = async () => {
    setCargando(true);
    try {
      // 1. Llamada unificada a /caja pasando los parámetros de paginación y búsqueda
      const respuesta = await api.get("/caja", {
        params: {
          pageCobro,
          limitCobro: limitPorDefecto,
          pageGasto,
          limitGasto: limitPorDefecto,
          searchCobro: search,
          searchGasto: search,
        },
      });

      const { data, meta } = respuesta.data;

      // 2. Asignación limpia de cobros y su metadatos
      setCobros(data.cobros || []);
      setPageCobro(meta.cobros.page || pageCobro);
      setTotalPagesCobro(meta.cobros.totalPages || 1);
      setTotalCobro(meta.cobros.total || 0);

      // 3. Asignación limpia de gastos y su metadatos
      setGastos(data.gastos || []);
      setPageGasto(meta.gastos.page || pageGasto);
      setTotalPagesGasto(meta.gastos.totalPages || 1);
      setTotalGasto(meta.gastos.total || 0);

      // 4. Obtener turnos atendidos pendientes de cobro
      const resTurnos = await api.get("/turnos/atendidos");
      setTurnosPendientes(resTurnos.data.data || []);
    } catch (error) {
      console.error("Error al cargar los datos consolidados de caja:", error);
    } finally {
      setCargando(false);
    }
  };

  // * RECARGAR DATOS CUANDO CAMBIA DE PÁGINA O BÚSQUEDA
  useEffect(() => {
    fetchData();
  }, [pageCobro, pageGasto, search]);

  // * SETEA LA BÚSQUEDA
  const setSearch = (nuevoTermino) => {
    setSearchState(nuevoTermino);
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

    inicioRegistroCobro,
    finRegistroCobro,
    inicioRegistroGasto,
    finRegistroGasto,
    recargar: fetchData,
  };
}
