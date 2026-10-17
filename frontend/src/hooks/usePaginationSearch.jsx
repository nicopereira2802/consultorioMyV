/** @format */
import { useState, useEffect } from "react";
import api from "../services/api";

export function usePaginationSearch(endpoint, limitPorDefecto = 9) {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState({ column: "", direction: "ASC" });

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
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, order]);

  // Cálculos automáticos centralizados
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
