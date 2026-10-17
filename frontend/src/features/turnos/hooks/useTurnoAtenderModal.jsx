/** @format */
import { useState, useCallback } from "react";

export function useTurnoAtenderModal(estadoInicialAtencion) {
  const [modalAtender, setModalAtender] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [datosAtencion, setDatosAtencion] = useState(estadoInicialAtencion);

  const abrirParaAtender = useCallback(
    (
      item,
      formateadorDatos = (i) => ({ ...estadoInicialAtencion, notas_consulta: i?.notas_consulta || "" }),
    ) => {
      setTurnoSeleccionado(item);
      setDatosAtencion(formateadorDatos(item));
      setModalAtender(true);
    },
    [estadoInicialAtencion],
  );

  const cerrarModalAtender = useCallback(() => {
    setModalAtender(false);
    setTurnoSeleccionado(null);
    setDatosAtencion(estadoInicialAtencion);
  }, [estadoInicialAtencion]);

  const agregarPracticaAtencion = () => {
    setDatosAtencion((prev) => ({
      ...prev,
      practicas: [...prev.practicas, { id_practica: "", id_obra_social: "" }],
    }));
  };

  const actualizarPracticaAtencion = (index, campo, valor) => {
    setDatosAtencion((prev) => {
      const nuevas = [...prev.practicas];
      nuevas[index][campo] = valor;
      return { ...prev, practicas: nuevas };
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
    setDatosAtencion,
    abrirParaAtender,
    cerrarModalAtender,
    agregarPracticaAtencion,
    actualizarPracticaAtencion,
    eliminarPracticaAtencion,
  };
}
