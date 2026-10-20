import { useState } from "react";

export function useTurnoVer() {
  const [modalVer, setModalVer] = useState(false);
  const [turnoVer, setTurnoVer] = useState(null);

  const abrirParaVer = (turnoEncontrado) => {
    setTurnoVer(turnoEncontrado);
    setModalVer(true);
  };

  const cerrarVer = () => {
    setTurnoVer(null);
    setModalVer(false);
  };
  return { modalVer, turnoVer, abrirParaVer, cerrarVer };
}
