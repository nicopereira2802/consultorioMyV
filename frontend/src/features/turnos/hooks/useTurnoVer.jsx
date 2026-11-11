import { useState } from "react";
import { useTurnoDependencies } from "./useTurnoDependencies";

export function useTurnoVer() {
  const [modalVer, setModalVer] = useState(false);
  const [turnoVer, setTurnoVer] = useState(null);

  const { practicasLista } = useTurnoDependencies();

  const abrirParaVer = (turnoEncontrado) => {
    setTurnoVer(turnoEncontrado);
    setModalVer(true);
  };

  const cerrarVer = () => {
    setTurnoVer(null);
    setModalVer(false);
  };
  return { modalVer, turnoVer, practicasLista, abrirParaVer, cerrarVer };
}
