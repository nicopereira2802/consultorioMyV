/** @format */
import { useState, useCallback } from "react";

export function useTurnoCRUDModal(
  estadoInicialFormulario,
  estadoInicialAtenderFormulario,
  estadoInicialReprogramarFormulario,
  estadoInicialCancelarFormulario,
) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [modalAtender, setModalAtender] = useState(false);
  const [modalReprogramar, setModalReprogramar] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [inasistente, setInasistente] = useState(false);
  const [modalVer, setModalVer] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [datosFormulario, setDatosFormulario] = useState(estadoInicialFormulario);
  const [datosAtencion, setDatosAtencion] = useState(estadoInicialAtenderFormulario);
  const [datosReprogramacion, setDatosReprogramacion] = useState(estadoInicialReprogramarFormulario);
  const [datosCancelacion, setDatosCancelacion] = useState(estadoInicialCancelarFormulario);

  const abrirParaVer = useCallback((item) => {
    setTurnoSeleccionado(item);
    setModalVer(true);
  }, []);

  const abrirParaCrear = useCallback(() => {
    setEditando(false);
    setTurnoSeleccionado(null);
    setDatosFormulario(estadoInicialFormulario);
    setModalAbierto(true);
  }, [estadoInicialFormulario]);

  const abrirParaEditar = useCallback((item, formateadorDatos = (i) => i) => {
    setEditando(true);
    setTurnoSeleccionado(item);
    setDatosFormulario(formateadorDatos(item));
    setModalAbierto(true);
  }, []);

  const abrirParaAtender = useCallback(
    (
      item,
      formateadorDatos = (i) => ({
        ...estadoInicialAtenderFormulario,
        notas_consulta: "",
      }),
    ) => {
      setTurnoSeleccionado(item);
      setModalAbierto(false);
      setDatosAtencion(formateadorDatos(item));
      setModalAtender(true);
    },
    [estadoInicialAtenderFormulario],
  );

  const abrirParaCancelar = useCallback((item) => {
    setTurnoSeleccionado(item);
    setModalAbierto(false);
    setInasistente(false);
    setModalCancelar(true);
  }, []);

  const abrirParaInasistente = useCallback((item) => {
    setTurnoSeleccionado(item);
    setModalAbierto(false);
    setInasistente(true);
    setModalCancelar(true);
  }, []);

  const abrirParaReprogramar = useCallback(
    (item, formateadorDatos = (i) => i) => {
      setTurnoSeleccionado(item);
      console.log(item)
      setDatosReprogramacion(formateadorDatos(item));
      setModalAbierto(false);
      setModalReprogramar(true);
    },
    [estadoInicialReprogramarFormulario],
  );

  const abrirParaEliminar = useCallback((item) => {
    setTurnoSeleccionado(item);
    setModalEliminar(true);
  }, []);

  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    setModalEliminar(false);
    setModalAtender(false);
    setModalCancelar(false);
    setInasistente(false);
    setDatosCancelacion(estadoInicialCancelarFormulario);
    setModalReprogramar(false);
    setTurnoSeleccionado(null);
    setDatosFormulario(estadoInicialFormulario);
    setDatosAtencion(estadoInicialAtenderFormulario);
  }, [estadoInicialFormulario]);

  const actualizarDatos = useCallback((e) => {
    const { name, value } = e.target;
    setDatosFormulario((prev) => ({ ...prev, [name]: value }));
  }, []);

  const actualizarDatosReprogramacion = (e) => {
    const { name, value } = e.target;
    setDatosReprogramacion((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const agregarPracticaAtencion = () => {
    setDatosAtencion((prev) => ({
      ...prev,
      practicas: [...prev.practicas, { id_practica: "", id_obra_social: "" }],
    }));
  };

  const actualizarPracticaAtencion = (index, campo, valor) => {
    setDatosAtencion((prev) => {
      const nuevasPracticas = [...prev.practicas];
      nuevasPracticas[index][campo] = valor;
      return { ...prev, practicas: nuevasPracticas };
    });
  };

  const eliminarPracticaAtencion = (index) => {
    setDatosAtencion((prev) => ({
      ...prev,
      practicas: prev.practicas.filter((_, i) => i !== index),
    }));
  };

  return {
    // Estados de modales
    modalAbierto,
    setModalAbierto,
    editando,
    setEditando,
    modalAtender,
    setModalAtender,
    modalReprogramar,
    setModalReprogramar,
    modalCancelar,
    setModalCancelar,
    inasistente,
    setInasistente,
    modalVer,
    setModalVer,
    modalEliminar,
    setModalEliminar,

    // Selección y datos
    itemSeleccionado: turnoSeleccionado,
    setItemSeleccionado: setTurnoSeleccionado,
    datosFormulario,
    setDatosFormulario,
    datosAtencion,
    setDatosAtencion,
    datosReprogramacion,
    setDatosReprogramacion,
    datosCancelacion,
    setDatosCancelacion,

    // Funciones de apertura
    abrirParaVer,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaAtender,
    abrirParaCancelar,
    abrirParaInasistente,
    abrirParaReprogramar,
    abrirParaEliminar,

    // Utilidades y acciones
    cerrarModal,
    actualizarDatos,
    actualizarDatosReprogramacion,
    agregarPracticaAtencion,
    actualizarPracticaAtencion,
    eliminarPracticaAtencion,
  };
}
