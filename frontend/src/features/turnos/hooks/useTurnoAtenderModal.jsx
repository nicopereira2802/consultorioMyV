/** @format */
import { useState, useEffect, useCallback } from "react";
import { useTurnoDependencies } from "./useTurnoDependencies";

const ESTADO_INICIAL_ATENCION = { notas_consulta: "", precio_final: 0, practicas: [] };

export function useTurnoAtenderModal() {
  const [modalAtender, setModalAtender] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [datosAtencion, setDatosAtencion] = useState(ESTADO_INICIAL_ATENCION);

  const { practicasLista, obrasSocialesPaciente, buscarOSPaciente } = useTurnoDependencies();

  // Cargar obras sociales al atender
  useEffect(() => {
    if (turnoSeleccionado && turnoSeleccionado.id_paciente && modalAtender) {
      buscarOSPaciente(turnoSeleccionado.id_paciente);
    }
  }, [modalAtender, turnoSeleccionado]);

  // Calcular precio final según prácticas
  useEffect(() => {
    let totalPrecio = 0;
    datosAtencion.practicas.forEach((item) => {
      if (item.id_practica) {
        const encontrada = practicasLista.find((p) => Number(p.id_practica) === Number(item.id_practica));
        if (encontrada) totalPrecio += Number(encontrada.precio_referencia || 0);
      }
    });
    setDatosAtencion((prev) => ({ ...prev, precio_final: totalPrecio }));
  }, [datosAtencion.practicas, practicasLista]);

  const abrirParaAtender = useCallback((item) => {
    setTurnoSeleccionado(item);
    setDatosAtencion({ ...ESTADO_INICIAL_ATENCION, notas_consulta: item?.notas_consulta || "" });
    setModalAtender(true);
  }, []);

  const cerrarModalAtender = useCallback(() => {
    setModalAtender(false);
    setTurnoSeleccionado(null);
    setDatosAtencion(ESTADO_INICIAL_ATENCION);
  }, []);

  const agregarPracticaAtencion = () => {
    setDatosAtencion((prev) => ({
      ...prev,
      practicas: [...prev.practicas, { id_practica: "", id_obra_social: "" }],
    }));
  };

  const actualizarDatosAtencion = (campo, valor) => {
    setDatosAtencion((prev) => ({ ...prev, [campo]: valor }));
  };

  const actualizarPracticaAtencion = (index, campo, valor) => {
    setDatosAtencion((prev) => {
      const practicasActualizadas = [...prev.practicas];

      practicasActualizadas[index] = {
        ...practicasActualizadas[index],
        [campo]: valor,
      };
      return {
        ...prev,
        practicas: practicasActualizadas,
      };
    });
  };

  const eliminarPracticaAtencion = (index) => {
    setDatosAtencion((prev) => ({
      ...prev,
      practicas: prev.practicas.filter((_, i) => i !== index),
    }));
  };

  return {
    modalAtender,
    turnoSeleccionadoAtender: turnoSeleccionado,
    datosAtencion,
    obrasSocialesPaciente,
    abrirParaAtender,
    cerrarModalAtender,
    agregarPracticaAtencion,
    actualizarPracticaAtencion,
    actualizarDatosAtencion,
    eliminarPracticaAtencion,
  };
}
