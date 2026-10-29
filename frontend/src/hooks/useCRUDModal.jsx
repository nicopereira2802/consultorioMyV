/** @format */
import { useState, useEffect, useCallback } from "react";
import { calcularHoraFin } from "../features/turnos/utils/calcularHoraFin";

export function useCRUDModal(estadoInicialFormulario) {
  // * DEFINICION DE ESTADOS GENERALES
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalToggle, setModalToggle] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [editando, setEditando] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [datosFormulario, setDatosFormulario] = useState(estadoInicialFormulario);

  // Cálculos de hora fin (Creación / Edición)
  useEffect(() => {
    // Solo calculamos si el modal está abierto y hay una fecha de inicio
    if (modalAbierto && datosFormulario.fecha_hora_inicio && datosFormulario.duracion_minutos) {
      calcularHoraFin(datosFormulario, actualizarDatos);
    }
  }, [datosFormulario.fecha_hora_inicio, datosFormulario.duracion_minutos, modalAbierto]);

  // * ABRIR MODAL DE CREAR
  const abrirParaCrear = useCallback(
    (datosExtra = {}) => {
      // Si se usa directamente como onClick, React pasa el evento: lo ignoramos
      const esObjetoPlano =
        datosExtra && typeof datosExtra === "object" && Object.getPrototypeOf(datosExtra) === Object.prototype;
      const extras = esObjetoPlano ? datosExtra : {};

      setEditando(false);
      setItemSeleccionado(null);
      setDatosFormulario({ ...estadoInicialFormulario, ...extras });
      setModalAbierto(true);
    },
    [estadoInicialFormulario],
  );

  // * ABRIR MODAL DE EDITAR
  const abrirParaEditar = useCallback((item, formateadorDatos = (i) => i) => {
    setEditando(true);
    setItemSeleccionado(item);
    setDatosFormulario(formateadorDatos(item));
    setModalAbierto(true);
  }, []);

  // * ABRIR MODAL DE TOGGLE
  const abrirParaToggle = useCallback((item) => {
    setItemSeleccionado(item);
    setModalToggle(true);
  }, []);

  // * ABRIR MODAL DE ELIMINAR
  const abrirParaEliminar = useCallback((item) => {
    setItemSeleccionado(item);
    setModalEliminar(true);
  }, []);

  // * ABRIR MODAL DE CERRAR LOS MODALES (VALORES DEFAULT)
  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    setModalEliminar(false);
    setModalToggle(false);
    setItemSeleccionado(null);
    setDatosFormulario(estadoInicialFormulario);
  }, [estadoInicialFormulario]);

  // * ACTUALIZAR DATOS DEL FORMULARIO
  const actualizarDatos = useCallback((e) => {
    if (typeof e === "function") {
      setDatosFormulario(e);
    } else if (e?.target) {
      const { name, value } = e.target;
      setDatosFormulario((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  return {
    modalAbierto,
    modalToggle,
    modalEliminar,
    editando,
    itemSeleccionado,
    datosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaToggle,
    abrirParaEliminar,
    cerrarModal,
    actualizarDatos,
  };
}
