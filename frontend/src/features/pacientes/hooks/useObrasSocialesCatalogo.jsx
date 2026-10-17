/** @format */
import { useState, useEffect, useCallback } from "react";
import api from "../../../services/api";

export function useObrasSocialesCatalogo(setDatosFormulario) {
  const [obrasSocialesLista, setObrasSocialesLista] = useState([]);
  const [cargandoOS, setCargandoOS] = useState(false);

  const buscarObrasSociales = useCallback(async () => {
    setCargandoOS(true);
    try {
      const respuesta = await api.get("/obras-sociales");
      setObrasSocialesLista(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar catálogo de obras sociales:", error);
    } finally {
      setCargandoOS(false);
    }
  }, []);

  useEffect(() => {
    buscarObrasSociales();
  }, [buscarObrasSociales]);

  const agregarObraSocialForm = () => {
    setDatosFormulario((prev) => ({
      ...prev,
      obrasSociales: [...prev.obrasSociales, { id_obra_social: "", nro_afiliado: "" }],
    }));
  };

  const actualizarObraSocialForm = (index, campo, valor) => {
    setDatosFormulario((prev) => {
      const nuevasOS = [...prev.obrasSociales];
      nuevasOS[index][campo] = valor;
      return { ...prev, obrasSociales: nuevasOS };
    });
  };

  const eliminarObraSocialForm = (index) => {
    setDatosFormulario((prev) => {
      const osAEliminar = prev.obrasSociales[index];
      const nuevasOS = prev.obrasSociales.filter((_, i) => i !== index);
      const eliminadas = [...(prev.obrasSocialesEliminadas || [])];
      if (osAEliminar && osAEliminar.guardadoEnBD && osAEliminar.id_relacion) {
        eliminadas.push(osAEliminar.id_relacion);
      }
      return { ...prev, obrasSociales: nuevasOS, obrasSocialesEliminadas: eliminadas };
    });
  };

  return {
    obrasSocialesLista,
    cargandoOS,
    recargarObrasSociales: buscarObrasSociales,
    agregarObraSocialForm,
    actualizarObraSocialForm,
    eliminarObraSocialForm,
  };
}
