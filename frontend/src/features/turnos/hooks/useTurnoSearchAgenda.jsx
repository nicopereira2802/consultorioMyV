/** @format */
import { useState, useEffect } from "react";
import api from "../../../services/api";

export function useTurnoSearchAgenda(endpoint, limitPorDefecto = 9) {
  const [turnos, setTurnos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [practicasLista, setPracticasLista] = useState([]);
  const [obrasSocialesPaciente, setObrasSocialesPaciente] = useState([]);
  const [cargando, setCargando] = useState(false);

  const fetchTurnos = async () => {
    setCargando(true);
    try {
      const respuesta = await api.get(endpoint);
      setTurnos(respuesta.data.data || []);
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
      console.log(respuesta.data.data);
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
    fetchPacientes();
    fetchPracticas();
  }, []);

  return {
    turnos: turnos,
    pacientes: pacientes,
    practicasLista: practicasLista,
    obrasSocialesPaciente: obrasSocialesPaciente,
    cargando,
    recargar: fetchTurnos,
    buscarOSPaciente: fetchObrasSocialesPaciente,
  };
}
