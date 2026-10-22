import { useState } from "react";

export function usePacienteVer() {
  const [modalCuenta, setModalCuenta] = useState(false);
  const [pacienteVerCuenta, setPacienteVerCuenta] = useState(null);

  const abrirParaVer = (pacienteSeleccionado) => {
    setPacienteVerCuenta(pacienteSeleccionado);
    setModalCuenta(true);
  };

  const cerrarVer = () => {
    setPacienteVerCuenta(null);
    setModalCuenta(false);
  };
  return { modalCuenta, pacienteVerCuenta, abrirParaVer, cerrarVer };
}
