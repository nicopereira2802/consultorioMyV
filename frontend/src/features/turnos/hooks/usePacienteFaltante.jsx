import { useState } from "react";

export function usePacienteFaltante(pacientes) {
  const [advertenciaVisible, setAdvertenciaVisible] = useState(true);

  const pacientesIncompletos = pacientes.filter((p) => !p.dni || !p.domicilio || !p.fecha_nacimiento);

  const obtenerCamposFaltantes = (p) => {
    const faltantes = [];
    if (!p.dni) faltantes.push("DNI");
    if (!p.domicilio) faltantes.push("domicilio");
    if (!p.fecha_nacimiento) faltantes.push("fecha de nacimiento");
    return faltantes.join(", ");
  };

  const cerrarAdvertencia = () => {
    setAdvertenciaVisible(false);
  };

  return { advertenciaVisible, pacientesIncompletos, obtenerCamposFaltantes, cerrarAdvertencia };
}
