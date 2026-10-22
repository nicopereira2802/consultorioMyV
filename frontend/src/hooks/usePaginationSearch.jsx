/** @format */
import { useState, useEffect } from "react";
import api from "../services/api";
import { manejarErrorApi } from "../utils/errorHandler";

export function usePaginationSearch(endpoint, limitPorDefecto = 9) {
  // * DEFINICION DE ESTADOS GENERALES
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearchState] = useState("");
  const [order, setOrder] = useState({ column: "", direction: "ASC" });

  // * BUSCAR DATOS PARA LA TABLA Y PAGINACION
  const fetchData = async (parametrosExtra = {}) => {
    setCargando(true);
    try {
      const respuesta = await api.get(endpoint, {
        params: {
          page,
          search,
          limit: limitPorDefecto,
          sortField: order.column || undefined,
          sortOrder: order.direction,
          ...parametrosExtra,
        },
      });
      setDatos(respuesta.data.data || []);
      setPage(respuesta.data.meta?.page || page);
      setTotalPages(respuesta.data.meta?.totalPages || 1);
      setTotal(respuesta.data.meta?.total || 0);
    } catch (error) {
      console.error(`Error al cargar datos de ${endpoint}:`, error);
      if (typeof manejarErrorApi === "function") {
        manejarErrorApi(error, `Error al cargar los datos de ${endpoint}`);
      }
    } finally {
      setCargando(false);
    }
  };

  // * RECARGAR DATOS CUANDO CAMBIA PAGINA
  useEffect(() => {
    fetchData();
  }, [page, search, order]);

  // * SETEA LA BUSQUEDA
  const setSearch = (nuevoTermino) => {
    setSearchState(nuevoTermino);
    setPage(1);
  };

  // * CALCULA LOS NUMEROS QUE SE MUESTRAN EN EL HEADER
  const inicioRegistro = total === 0 ? 0 : (page - 1) * limitPorDefecto + 1;
  const finRegistro = total === 0 ? 0 : page === totalPages ? total : page * limitPorDefecto;

  return {
    datos,
    cargando,
    page,
    setPage,
    total,
    totalPages,
    search,
    setSearch,
    order,
    setOrder,
    inicioRegistro,
    finRegistro,
    recargar: fetchData,
  };
}
