/** @format */
import { useState, useEffect, useCallback, useRef } from "react";
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [order, setOrder] = useState({ column: "", direction: "ASC" });

  const abortControllerRef = useRef(null);

  // * Debounce sobre el término de búsqueda (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const termino = search.trim();
      // Disparar la búsqueda solo tras 350ms sin presionar teclas, cuando tenga >= 2 caracteres o esté vacío
      if (termino.length >= 2 || termino.length === 0) {
        setDebouncedSearch(termino);
        setPage(1);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  // * BUSCAR DATOS PARA LA TABLA Y PAGINACION
  const fetchData = useCallback(
    async (parametrosExtra = {}) => {
      // Cancelar petición previa si todavía está en vuelo
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setCargando(true);
      try {
        const respuesta = await api.get(endpoint, {
          params: {
            page,
            search: debouncedSearch,
            buscar: debouncedSearch,
            limit: limitPorDefecto,
            sortField: order.column || undefined,
            sortOrder: order.direction,
            ...parametrosExtra,
          },
          signal: controller.signal,
        });

        setDatos(respuesta.data.data || []);
        setPage(respuesta.data.meta?.page || page);
        setTotalPages(respuesta.data.meta?.totalPages || 1);
        setTotal(respuesta.data.meta?.total || 0);
      } catch (error) {
        // Ignorar cancelaciones causadas por AbortController / peticiones previas sin acumular toasts
        if (
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED" ||
          error?.message === "canceled"
        ) {
          return;
        }

        console.error(`Error al cargar datos de ${endpoint}:`, error);
        if (typeof manejarErrorApi === "function") {
          manejarErrorApi(error, `Error al cargar los datos de ${endpoint}`);
        }
      } finally {
        // Solo quitar loading si esta fue la última petición activa
        if (abortControllerRef.current === controller) {
          setCargando(false);
        }
      }
    },
    [endpoint, page, debouncedSearch, order, limitPorDefecto]
  );

  // * RECARGAR DATOS CUANDO CAMBIA PAGINA, ORDEN O TERMINO DE BUSQUEDA CON DEBOUNCE
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // * SETEA LA BUSQUEDA (actualiza inmediatamente el input visual para mantener fluidez total)
  const setSearch = (nuevoTermino) => {
    setSearchState(nuevoTermino);
  };

  // * CALCULA LOS NUMEROS QUE SE MUESTRAN EN EL HEADER
  const inicioRegistro = total === 0 ? 0 : (page - 1) * limitPorDefecto + 1;
  const finRegistro =
    total === 0 ? 0 : page === totalPages ? total : page * limitPorDefecto;

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
