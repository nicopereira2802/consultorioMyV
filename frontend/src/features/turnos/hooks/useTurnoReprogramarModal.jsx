/** @format */
import { useState, useCallback } from "react";

export function useTurnoReprogramarModal(estadoInicialReprogramar) {
  const [modalReprogramar, setModalReprogramar] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [datosReprogramacion, setDatosReprogramacion] = useState(estadoInicialReprogramar);

  const abrirParaReprogramar = useCallback((item, formateadorDatos = (i) => i) => {
    setTurnoSeleccionado(item);
    setDatosReprogramacion(formateadorDatos(item));
    setModalReprogramar(true);
  }, []);

  const cerrarModalReprogramar = useCallback(() => {
    setModalReprogramar(false);
    setTurnoSeleccionado(null);
    setDatosReprogramacion(estadoInicialReprogramar);
  }, [estadoInicialReprogramar]);

  const actualizarDatosReprogramacion = (e) => {
    const { name, value } = e.target;
    setDatosReprogramacion((prev) => ({ ...prev, [name]: value }));
  };

  return {
    modalReprogramar,
    turnoSeleccionadoReprogramar: turnoSeleccionado,
    datosReprogramacion,
    setDatosReprogramacion,
    abrirParaReprogramar,
    cerrarModalReprogramar,
    actualizarDatosReprogramacion,
  };
}
