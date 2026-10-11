/** @format */

import { useState, useEffect } from "react";
import AgendaCalendario from "../components/ui/AgendaCalendario";
import api from "../services/api";
import { formatDateTimeInput, formatFechaCortaTexto } from "../utils/index";
import { Calendar, Plus } from "lucide-react";
import Header from "../components/ui/Header";
import {
  FormularioCrearEditar,
  FormularioAtender,
  FormularioCancelar,
} from "../components/ui/Turno/FormulariosTurno";

export default function AgendaDiaria() {
  /* ─── VARIABLES GENERALES ─────────────────────────────────── */
  const [turnos, setTurnos] = useState();
  const [pacientes, setPacientes] = useState([]);
  const [practicasLista, setPracticasLista] = useState([]);
  const [pacientesObrasSociales, setPacientesObrasSociales] = useState([]);

  /* ─── VARIABLES DEL MODAL ─────────────────────────────────── */
  const [datosFormulario, setDatosFormulario] = useState({
    duracion_minutos: 30, // Valor por defecto
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalAtenderAbierto, setModalAtenderAbierto] = useState(false);
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);

  // Estado específico para el modal de Atender Turno
  const [datosAtencion, setDatosAtencion] = useState({
    notas_consulta: "",
    precio_final: 0,
    practicas: [],
  });

  // Estado específico para el modal de Cancelar e Inasistente
  const [inasistente, setInasistente] = useState(false);
  const [notasCancelarInasistente, setNotasCancelarInasistente] = useState("");

  /* ─── USE-EFFECTS ─────────────────────────────────── */
  useEffect(() => {
    buscarTurnos();
    buscarPacientes();
    buscarPracticas();
  }, []);

  useEffect(() => {}, [modalAbierto]);

  useEffect(() => {
    if (datosFormulario.fecha_hora_inicio && datosFormulario.duracion_minutos) {
      calcularHoraFin(
        datosFormulario.fecha_hora_inicio,
        datosFormulario.duracion_minutos,
      );
    }
  }, [datosFormulario.fecha_hora_inicio, datosFormulario.duracion_minutos]);

  // Recalcular precio base automáticamente en el modal de atención según las prácticas seleccionadas
  useEffect(() => {
    let total = 0;
    datosAtencion.practicas.forEach((item) => {
      if (item.id_practica) {
        const encontrada = practicasLista.find(
          (p) => Number(p.id_practica) === Number(item.id_practica),
        );
        if (encontrada) {
          total += Number(encontrada.precio_referencia || 0);
        }
      }
    });
    setDatosAtencion((prev) => ({ ...prev, precio_final: total }));
  }, [datosAtencion.practicas, practicasLista]);

  /* ─── PETICIONES API ─────────────────────────────────── */
  const buscarTurnos = async () => {
    try {
      const respuesta = await api.get("/turnos");
      setTurnos(respuesta.data.data);
    } catch (error) {
      console.error("Error al cargar los turnos:", error);
    }
  };

  const buscarPacientes = async () => {
    try {
      const respuesta = await api.get("/pacientes");
      setPacientes(respuesta.data.data);
    } catch (error) {
      console.error("Error al cargar los pacientes:", error);
    }
  };

  const buscarPracticas = async () => {
    try {
      const respuesta = await api.get("/practicas");
      setPracticasLista(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar catálogo de prácticas:", error);
    }
  };

  const buscarObrasSocialesPaciente = async (id_paciente) => {
    try {
      const respuesta = await api.get(
        `/pacientes-por-obras-sociales/${id_paciente}`,
      );
      setPacientesObrasSociales(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar relación paciente-obra social:", error);
    }
  };

  /* ─── FUNCION CALCULAR HORA FIN ─────────────────────────────────── */
  const calcularHoraFin = (fecha_inicio, duracion_minutos) => {
    const inicio = new Date(fecha_inicio);
    const minutos = parseInt(duracion_minutos, 10);

    if (!isNaN(inicio.getTime()) && !isNaN(minutos)) {
      const fin = new Date(inicio.getTime() + minutos * 60000);

      // Formato YYYY-MM-THH:mm para input datetime-local
      const isoFin = new Date(fin.getTime() - fin.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      setDatosFormulario((prev) => ({
        ...prev,
        fecha_hora_fin: isoFin,
      }));
    }
  };

  /* ─── FUNCIONES DEL MODAL ─────────────────────────────────── */

  /* ─── MODAL PARA CREAR PACIENTE ─────────────────────────────────── */
  const modalCreando = (selectInfo) => {
    setEditando(false);
    setTurnoSeleccionado(null);

    const fechaInicio = selectInfo?.start
      ? formatDateTimeInput(selectInfo.start)
      : null;

    setDatosFormulario({
      id_paciente: null,
      fecha_hora_inicio: fechaInicio,
      duracion_minutos: 30,
      precio_final: 0,
      notas_consulta: "",
    });

    setModalAbierto(true);
  };

  /* ─── MODAL PARA EDITAR PACIENTE ─────────────────────────────────── */
  const modalEditando = (turno) => {
    setEditando(true);
    setTurnoSeleccionado(turno);

    setDatosFormulario({
      ...turno,
      fecha_hora_inicio: formatDateTimeInput(turno.fecha_hora_inicio),
      fecha_hora_fin: formatDateTimeInput(turno.fecha_hora_fin),
      duracion_minutos: turno.duracion_minutos || 30,
    });

    setModalAbierto(true);
  };

  /* ─── ABRIR MODAL ATENDER TURNO ──────────────────────────── */
  const abrirModalAtenderDesdeEdicion = () => {
    if (!turnoSeleccionado) return;
    setModalAbierto(false); // Cierra el modal de edición actual

    setDatosAtencion({
      notas_consulta: turnoSeleccionado.notas_consulta || "",
      precio_final: 0,
      practicas: [],
    });

    buscarObrasSocialesPaciente(turnoSeleccionado.id_paciente);
    setModalAtenderAbierto(true);
  };

  /* ─── ABRIR MODAL CANCELAR TURNO ──────────────────────────── */
  const abrirModalCancelarDesdeEdicion = () => {
    if (!turnoSeleccionado) return;
    setModalAbierto(false); // Cierra el modal de edición actual

    setInasistente(false);
    setModalCancelarAbierto(true);
  };

  /* ─── ABRIR MODAL INASISTENTE TURNO ──────────────────────────── */
  const abrirModalInasistenteDesdeEdicion = () => {
    if (!turnoSeleccionado) return;
    setModalAbierto(false); // Cierra el modal de edición actual

    setInasistente(true);
    setModalCancelarAbierto(true);
  };

  /* ─── CERRAR MODALES ─────────────────────────────────── */
  const cerrarModal = () => {
    setModalAbierto(false);
    setModalAtenderAbierto(false);
    setModalCancelarAbierto(false);
    setTurnoSeleccionado(null);
    setDatosFormulario({});
    setDatosAtencion({
      notas_consulta: "",
      precio_final: 0,
      practicas: [],
    });
    setInasistente(false);
    setNotasCancelarInasistente("");
  };

  /* ─── MANEJO DINÁMICO DE PRÁCTICAS EN ATENCIÓN ───────────── */
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

  /* ─── ACTUALIZAR DATOS DEL FORMULARIO ─────────────────────────────────── */
  const actualizarDatos = (e) => {
    const { name, value } = e.target;
    setDatosFormulario((prev) => ({ ...prev, [name]: value }));
  };

  /* ─── ENVIAR EL FORMULARIO DE TURNO ─────────────────────────── */
  const procesarFormulario = async (e) => {
    e.preventDefault();

    if (!datosFormulario.id_paciente) {
      alert("Por favor seleccione un paciente.");
      return;
    }

    try {
      const { duracion_minutos, ...restoDatos } = datosFormulario;

      const datosAEnviar = {
        ...restoDatos,
        id_paciente: Number(restoDatos.id_paciente),
        precio_final: parseFloat(restoDatos.precio_final),
        fecha_hora_inicio: new Date(restoDatos.fecha_hora_inicio).toISOString(),
        fecha_hora_fin: new Date(restoDatos.fecha_hora_fin).toISOString(),
        notas_consulta: restoDatos.notas_consulta?.trim() || "",
      };
      if (editando) {
        await api.put(`/turnos/${datosAEnviar.id_turno}`, datosAEnviar);
      } else {
        await api.post(`/turnos`, datosAEnviar);
      }
      buscarTurnos();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar el turno:", error);
      if (error.response?.status === 409 || error.status === 409) {
        alert("El horario seleccionado se superpone con otro turno");
      }
    }
  };

  /* ─── PROCESAR ATENCIÓN DEL TURNO (PATCH /atender) ───────── */
  const procesarAtencionTurno = async (e) => {
    e.preventDefault();
    if (!turnoSeleccionado) return;

    try {
      const payloadAtencion = {
        notas_consulta: datosAtencion.notas_consulta.trim(),
        precio_final: parseFloat(datosAtencion.precio_final),
        practicas_realizadas: datosAtencion.practicas
          .filter((p) => p.id_practica)
          .map((p) => Number(p.id_practica)),
        practicas_detalle: datosAtencion.practicas
          .filter((p) => p.id_practica)
          .map((p) => ({
            id_practica: Number(p.id_practica),
            id_obra_social: p.id_obra_social ? Number(p.id_obra_social) : null,
          })),
      };

      await api.patch(
        `/turnos/${turnoSeleccionado.id_turno}/atender`,
        payloadAtencion,
      );

      buscarTurnos();
      cerrarModal();
    } catch (error) {
      console.error("Error al registrar la atención del turno:", error);
      alert(
        error.response?.data?.error ||
          "Ocurrió un error al registrar la atención.",
      );
    }
  };

  /* ─── PROCESAR CANCELACION O INASISTENCIA DEL TURNO (PATCH /cancelar o /inasistente) ───────── */
  const procesarCancelacionTurno = async (e) => {
    e.preventDefault();
    if (!turnoSeleccionado) return;

    try {
      const payloadAtencion = {
        notas_consulta: notasCancelarInasistente.trim(),
      };

      if (inasistente) {
        await api.patch(
          `/turnos/${turnoSeleccionado.id_turno}/inasistente`,
          payloadAtencion,
        );
      } else {
        await api.patch(
          `/turnos/${turnoSeleccionado.id_turno}/cancelar`,
          payloadAtencion,
        );
      }

      buscarTurnos();
      cerrarModal();
    } catch (error) {
      console.error("Error al registrar la cancelación del turno:", error);
      alert(
        error.response?.data?.error ||
          "Ocurrió un error al registrar la cancelación.",
      );
    }
  };

  const procesarClickEnTurno = (clickInfo) => {
    const turnoSeleccionado = turnos.find(
      (t) => String(t.id_turno) === String(clickInfo.event.id),
    );
    if (turnoSeleccionado) {
      modalEditando(turnoSeleccionado);
    }
  };

  /* ─── RETORNO DE LA PAGINA ─────────────────────────────────── */
  return (
    <div className="w-full h-[calc(100vh-6rem)] flex flex-col gap-4">
      {/* ─── CABECERA PRINCIPAL ─────────────────────────────────── */}
      <Header
        icono={Calendar}
        titulo="Agenda de Turnos"
        subtitulo="Gestión horaria y turnos del consultorio odontológico"
        badge={formatFechaCortaTexto(new Date())}
        botonAccion={
          <button
            type="button"
            onClick={modalCreando}
            className="flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0"
          >
            <Plus size={18} />
            <span>Nuevo Turno</span>
          </button>
        }
      />

      {/* ─── CONTENEDOR DEL CALENDARIO ─────────────────────────── */}
      <div className="flex-1 w-full min-h-0 p-4 pt-0 text-black">
        <div className="w-full h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-4">
          <AgendaCalendario
            turnos={turnos}
            onDateSelect={modalCreando}
            onEventClick={procesarClickEnTurno}
          />
        </div>
      </div>

      {/* ─── MODAL CREAR / EDITAR TURNO ─────────────────────────── */}
      {modalAbierto && (
        <FormularioCrearEditar
          page={"Agenda"}
          modalAbierto={modalAbierto}
          cerrarModal={cerrarModal}
          editando={editando}
          pacientes={pacientes}
          datosFormulario={datosFormulario}
          actualizarDatos={actualizarDatos}
          procesarFormulario={procesarFormulario}
          abrirModalAtenderDesdeEdicion={abrirModalAtenderDesdeEdicion}
          abrirModalCancelarDesdeEdicion={abrirModalCancelarDesdeEdicion}
          abrirModalInasistenteDesdeEdicion={abrirModalInasistenteDesdeEdicion}
        />
      )}

      {/* ─── MODAL: MARCAR COMO ATENDIDO Y REGISTRAR PRÁCTICAS ──── */}
      {modalAtenderAbierto && (
        <FormularioAtender
          modalAtenderAbierto={modalAtenderAbierto}
          cerrarModal={cerrarModal}
          turnoSeleccionado={turnoSeleccionado}
          datosAtencion={datosAtencion}
          setDatosAtencion={setDatosAtencion}
          practicasLista={practicasLista}
          pacientesObrasSociales={pacientesObrasSociales}
          agregarPracticaAtencion={agregarPracticaAtencion}
          actualizarPracticaAtencion={actualizarPracticaAtencion}
          eliminarPracticaAtencion={eliminarPracticaAtencion}
          procesarAtencionTurno={procesarAtencionTurno}
        />
      )}

      {/* ─── MODAL: MARCAR COMO CANCELADO O INASISTENTE ──── */}
      {modalCancelarAbierto && (
        <FormularioCancelar
          modalCancelarAbierto={modalCancelarAbierto}
          cerrarModal={cerrarModal}
          turnoSeleccionado={turnoSeleccionado}
          inasistente={inasistente}
          notasCanceladoInasistente={notasCancelarInasistente}
          setNotasCanceladoInasistente={setNotasCancelarInasistente}
          procesarCancelacionTurno={procesarCancelacionTurno}
        />
      )}
    </div>
  );
}
