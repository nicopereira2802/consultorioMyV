import api from "../../../services/api";
import { formatearPacienteParaEditar } from "./formatearPacienteParaEditar";

export const verificarCompletarPaciente = (
  cargando,
  searchParams,
  pacientes,
  abrirParaEditar,
  setSearchParams,
) => {
  const editarId = searchParams.get("editarId");
  if (!editarId) return;

  const abrirEdicionPorParametro = async () => {
    // 1. Intentamos buscarlo en los pacientes ya cargados
    let pacienteEncontrado = pacientes.find((p) => String(p.id_paciente) === String(editarId));

    // 2. Si no está en la página actual, lo buscamos directamente en la API
    if (!pacienteEncontrado) {
      try {
        const res = await api.get(`/pacientes/${editarId}`);
        pacienteEncontrado = res.data.data || res.data;
      } catch (error) {
        console.error("Error al obtener paciente para editar:", error);
      }
    }

    // 3. Si lo encontramos, abrimos el modal y limpiamos el parámetro URL
    if (pacienteEncontrado) {
      abrirParaEditar(pacienteEncontrado, formatearPacienteParaEditar);
      // Limpiar query param para que no reabra el modal si se refresca/cierra
      searchParams.delete("editarId");
      setSearchParams(searchParams, { replace: true });
    }
  };

  if (!cargando) {
    abrirEdicionPorParametro();
  }
};
