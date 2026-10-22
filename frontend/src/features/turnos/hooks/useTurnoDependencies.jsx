/** @format */
import { useState, useEffect } from "react";
import api from "../../../services/api";

export function useTurnoDependencies() {
  const [pacientes, setPacientes] = useState([]);
  const [practicasLista, setPracticasLista] = useState([]);
  const [obrasSocialesPaciente, setObrasSocialesPaciente] = useState([]);

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
    fetchPacientes();
    fetchPracticas();
  }, []);

  return {
    pacientes: pacientes,
    practicasLista: practicasLista,
    obrasSocialesPaciente: obrasSocialesPaciente,
    buscarOSPaciente: fetchObrasSocialesPaciente,
  };
}
