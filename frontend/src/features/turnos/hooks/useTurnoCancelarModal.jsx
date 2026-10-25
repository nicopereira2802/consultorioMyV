/** @format */
import { useState, useCallback } from "react";
const ESTADO_INICIAL_CANCELAR = { notas_consulta: "" };

export function useTurnoCancelarModal() {
  const [modalCancelar, setModalCancelar] = useState(false);
  const [inasistente, setInasistente] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [datosCancelacion, setDatosCancelacion] = useState(ESTADO_INICIAL_CANCELAR);

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
    setDatosCancelacion(...ESTADO_INICIAL_CANCELAR);
  }, []);

  const actualizarDatosCancelacion = (campo, valor) => {
    setDatosCancelacion((prev) => ({ ...prev, [campo]: valor }));
  };

  return {
    modalCancelar,
    inasistente,
    turnoSeleccionadoCancelar: turnoSeleccionado,
    datosCancelacion,
    abrirParaCancelar,
    abrirParaInasistente,
    actualizarDatosCancelacion,
    cerrarModalCancelar,
  };
}
