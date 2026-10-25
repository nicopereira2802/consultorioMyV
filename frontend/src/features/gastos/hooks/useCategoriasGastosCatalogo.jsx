/** @format */

import { useState, useEffect, useCallback } from "react";
import api from "../../../services/api";

export function useCategoriasGastosCatalogo() {
  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);

  const fetchCategorias = useCallback(async () => {
    setCargandoCategorias(true);
    try {
      const res = await api.get("/categorias-gastos");
      setCategorias(res.data.data || []);
    } catch (error) {
      console.error("Error al cargar categorías de gastos:", error);
    } finally {
      setCargandoCategorias(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  return {
    categorias,
    cargandoCategorias,
    recargarCategorias: fetchCategorias,
  };
}
