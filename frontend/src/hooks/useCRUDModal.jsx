/** @format */
import { useState, useCallback } from "react";

export function useCRUDModal(estadoInicialFormulario) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalToggle, setModalToggle] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [editando, setEditando] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [datosFormulario, setDatosFormulario] = useState(estadoInicialFormulario);

  const abrirParaCrear = useCallback(() => {
    setEditando(false);
    setItemSeleccionado(null);
    setDatosFormulario(estadoInicialFormulario);
    setModalAbierto(true);
  }, [estadoInicialFormulario]);

  const abrirParaEditar = useCallback((item, formateadorDatos = (i) => i) => {
    setEditando(true);
    setItemSeleccionado(item);
    setDatosFormulario(formateadorDatos(item));
    setModalAbierto(true);
  }, []);

  const abrirParaToggle = useCallback((item) => {
    setItemSeleccionado(item);
    setModalToggle(true);
  }, []);

  const abrirParaEliminar = useCallback((item) => {
    setItemSeleccionado(item);
    setModalEliminar(true);
  }, []);

  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    setModalEliminar(false);
    setModalToggle(false);
    setItemSeleccionado(null);
    setDatosFormulario(estadoInicialFormulario);
  }, [estadoInicialFormulario]);

  const actualizarDatos = useCallback((e) => {
    const { name, value } = e.target;
    setDatosFormulario((prev) => ({ ...prev, [name]: value }));
  }, []);

  return {
    modalAbierto,
    modalToggle,
    modalEliminar,
    editando,
    itemSeleccionado,
    setItemSeleccionado,
    datosFormulario,
    setDatosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaToggle,
    abrirParaEliminar,
    cerrarModal,
    actualizarDatos,
  };
}
