/** @format */
import { useState, useCallback } from "react";

export function useTurnoCancelarModal(estadoInicialCancelar) {
  const [modalCancelar, setModalCancelar] = useState(false);
  const [inasistente, setInasistente] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [datosCancelacion, setDatosCancelacion] = useState(estadoInicialCancelar);

  const abrirParaCancelar = useCallback((item) => {
    setTurnoSeleccionado(item);
    setInasistente(false);
    setModalCancelar(true);
  }, []);

  const abrirParaInasistente = useCallback((item) => {
    setTurnoSeleccionado(item);
    setInasistente(true);
    setModalCancelar(true);
  }, []);

  const cerrarModalCancelar = useCallback(() => {
    setModalCancelar(false);
    setInasistente(false);
    setTurnoSeleccionado(null);
    setDatosCancelacion(estadoInicialCancelar);
  }, [estadoInicialCancelar]);

  return {
    modalCancelar,
    inasistente,
    turnoSeleccionadoCancelar: turnoSeleccionado,
    datosCancelacion,
    setDatosCancelacion,
    abrirParaCancelar,
    abrirParaInasistente,
    cerrarModalCancelar,
  };
}
