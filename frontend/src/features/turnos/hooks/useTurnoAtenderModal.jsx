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

  // Función auxiliar para sumar precios de referencia de la lista
  const calcularSumaPracticas = (practicas) => {
    return practicas.reduce((total, item) => {
      if (item.id_practica) {
        const encontrada = practicasLista.find(
          (p) => Number(p.id_practica) === Number(item.id_practica)
        );
        if (encontrada) total += Number(encontrada.precio_referencia || 0);
      }
      return total;
    }, 0);
  };

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

  // Modificación manual del precio u otros campos: NO es pisado por ningún effect
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

      // Si cambió la práctica seleccionada, recalculamos la suma base como sugerencia
      if (campo === "id_practica") {
        const nuevoPrecioSugerido = calcularSumaPracticas(practicasActualizadas);
        return {
          ...prev,
          practicas: practicasActualizadas,
          precio_final: nuevoPrecioSugerido,
        };
      }

      return {
        ...prev,
        practicas: practicasActualizadas,
      };
    });
  };

  const eliminarPracticaAtencion = (index) => {
    setDatosAtencion((prev) => {
      const practicasFiltradas = prev.practicas.filter((_, i) => i !== index);
      return {
        ...prev,
        practicas: practicasFiltradas,
        precio_final: calcularSumaPracticas(practicasFiltradas),
      };
    });
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