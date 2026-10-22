/** @format */
import { useState, useEffect, useCallback } from "react";
import { calcularHoraFin } from "../utils/calcularHoraFin";

const ESTADO_INICIAL_REPROGRAMAR = { fecha_hora_inicio: "", duracion_minutos: 30, fecha_hora_fin: "" };

export function useTurnoReprogramarModal() {
  const [modalReprogramar, setModalReprogramar] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [datosReprogramacion, setDatosReprogramacion] = useState(ESTADO_INICIAL_REPROGRAMAR);

  // Cálculos de hora fin (Reprogramación)
  useEffect(() => {
    calcularHoraFin(datosReprogramacion, actualizarDatosReprogramacion);
  }, [datosReprogramacion.fecha_hora_inicio, datosReprogramacion.duracion_minutos]);

  const abrirParaReprogramar = useCallback((item, formateadorDatos = (i) => i) => {
    setTurnoSeleccionado(item);
    setDatosReprogramacion(formateadorDatos(item));
    setModalReprogramar(true);
  }, []);

  const cerrarModalReprogramar = useCallback(() => {
    setModalReprogramar(false);
    setTurnoSeleccionado(null);
    setDatosReprogramacion(...ESTADO_INICIAL_REPROGRAMAR);
  }, []);

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
