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
    if (!Array.isArray(practicas)) return 0;
    return practicas.reduce((total, item) => {
      if (item && item.id_practica) {
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
    const practicasIniciales = Array.isArray(item?.Practicas || item?.practicas)
      ? [...(item.Practicas || item.practicas)]
      : [];
    setDatosAtencion({
      ...ESTADO_INICIAL_ATENCION,
      notas_consulta: item?.notas_consulta || "",
      precio_final:
        item?.precio_final !== undefined && item?.precio_final !== null
          ? Number(item.precio_final)
          : ESTADO_INICIAL_ATENCION.precio_final,
      practicas: practicasIniciales,
    });
    setModalAtender(true);
  }, []);

  const cerrarModalAtender = useCallback(() => {
    setModalAtender(false);
    setTurnoSeleccionado(null);
    setDatosAtencion(ESTADO_INICIAL_ATENCION);
  }, []);

  const agregarPracticaAtencion = () => {
    setDatosAtencion((prev) => {
      const listaActual = Array.isArray(prev?.practicas) ? prev.practicas : [];
      return {
        ...prev,
        practicas: [...listaActual, { id_practica: "", id_obra_social: "" }],
      };
    });
  };

  // Modificación manual del precio u otros campos: NO es pisado por ningún effect
  const actualizarDatosAtencion = (campo, valor) => {
    setDatosAtencion((prev) => ({ ...prev, [campo]: valor }));
  };

  const actualizarPracticaAtencion = (index, campo, valor) => {
    setDatosAtencion((prev) => {
      const listaActual = Array.isArray(prev?.practicas) ? prev.practicas : [];
      const practicasActualizadas = [...listaActual];
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
      const listaActual = Array.isArray(prev?.practicas) ? prev.practicas : [];
      const practicasFiltradas = listaActual.filter((_, i) => i !== index);
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
