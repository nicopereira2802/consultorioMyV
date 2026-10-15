/** @format */
import { useState, useEffect } from "react";
import api from "../../../services/api";

export function useTurnoPaginationSearch(endpoint, limitPorDefecto = 9) {
  const [turnos, setTurnos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [practicasLista, setPracticasLista] = useState([]);
  const [obrasSocialesPaciente, setObrasSocialesPaciente] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState({ column: "", direction: "ASC" });

  const fetchTurnos = async (parametrosExtra = {}) => {
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
      setTurnos(respuesta.data.data || []);
      setPage(respuesta.data.meta?.page || page);
      setTotalPages(respuesta.data.meta?.totalPages || 1);
      setTotal(respuesta.data.meta?.total || 0);
    } catch (error) {
      console.error(`Error al cargar datos de ${endpoint}:`, error);
    } finally {
      setCargando(false);
    }
  };

  const fetchPacientes = async () => {
    try {
      const respuesta = await api.get("/pacientes");
      setPacientes(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
    }
  };

  const fetchObrasSocialesPaciente = async (id_paciente) => {
    try {
      const respuesta = await api.get(`/pacientes-por-obras-sociales/${id_paciente}`);
      console.log(respuesta.data.data)
      setObrasSocialesPaciente(respuesta.data.data);
    } catch (error) {
      console.error("Error al cargar las obras sociales de los pacientes:", error);
    }
  };

  const fetchPracticas = async () => {
    try {
      const respuesta = await api.get("/practicas");
      setPracticasLista(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar catálogo de prácticas:", error);
    }
  };

  useEffect(() => {
    fetchTurnos();
  }, [page, search, order]);

  useEffect(() => {
    fetchPacientes();
    fetchPracticas();
  }, []);

  // Cálculos automáticos centralizados
  const inicioRegistro = total === 0 ? 0 : (page - 1) * limitPorDefecto + 1;
  const finRegistro = total === 0 ? 0 : page === totalPages ? total : page * limitPorDefecto;

  return {
    turnos: turnos,
    pacientes: pacientes,
    practicasLista: practicasLista,
    obrasSocialesPaciente: obrasSocialesPaciente,
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
    recargar: fetchTurnos,
    buscarOSPaciente: fetchObrasSocialesPaciente,
  };
}
