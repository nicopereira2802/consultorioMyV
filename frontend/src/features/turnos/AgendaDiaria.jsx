/** @format */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AgendaCalendario from "./components/AgendaCalendario";
import api from "../../services/api";
import { formatDateTimeInput, formatFechaCortaTexto } from "../../utils/index";
import { Calendar, AlertTriangle, X, UserCheck } from "lucide-react";
import Header from "../../components/common/Header";
import {
  FormularioCrearEditar,
  FormularioAtender,
  FormularioCancelar,
  FormularioReprogramar,
} from "./components/FormulariosTurno";

export default function AgendaDiaria() {
  const navigate = useNavigate();
  /* ─── VARIABLES GENERALES ─────────────────────────────────── */
  const [turnos, setTurnos] = useState();
  const [pacientes, setPacientes] = useState([]);
  const [practicasLista, setPracticasLista] = useState([]);
  const [pacientesObrasSociales, setPacientesObrasSociales] = useState([]);

  /* ─── ESTADO PARA LA ADVERTENCIA DE PACIENTES INCOMPLETOS ─── */
  const [advertenciaVisible, setAdvertenciaVisible] = useState(true);

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

  // Estados para el modal de reprogramación
  const [modalReprogramarAbierto, setModalReprogramarAbierto] = useState(false);
  const [datosReprogramacion, setDatosReprogramacion] = useState({
    fecha_hora_inicio: "",
    duracion_minutos: 30,
    fecha_hora_fin: "",
  });

  /* ─── USE-EFFECTS ─────────────────────────────────── */
  useEffect(() => {
    buscarTurnos();
    buscarPacientes();
    buscarPracticas();
  }, []);

  useEffect(() => {}, [modalAbierto]);

  useEffect(() => {
    if (datosFormulario.fecha_hora_inicio && datosFormulario.duracion_minutos) {
      calcularHoraFin(datosFormulario.fecha_hora_inicio, datosFormulario.duracion_minutos);
    }
  }, [datosFormulario.fecha_hora_inicio, datosFormulario.duracion_minutos]);

  // Recalcular precio base automáticamente en el modal de atención según las prácticas seleccionadas
  useEffect(() => {
    let total = 0;
    datosAtencion.practicas.forEach((item) => {
      if (item.id_practica) {
        const encontrada = practicasLista.find((p) => Number(p.id_practica) === Number(item.id_practica));
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
      const respuesta = await api.get(`/pacientes-por-obras-sociales/${id_paciente}`);
      setPacientesObrasSociales(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar relación paciente-obra social:", error);
    }
  };

  /* ─── LÓGICA DE PACIENTES INCOMPLETOS ─────────────────────────── */
  const pacientesIncompletos = pacientes.filter((p) => !p.dni || !p.domicilio || !p.fecha_nacimiento);

  const obtenerCamposFaltantes = (p) => {
    const faltantes = [];
    if (!p.dni) faltantes.push("DNI");
    if (!p.domicilio) faltantes.push("domicilio");
    if (!p.fecha_nacimiento) faltantes.push("fecha de nacimiento");
    return faltantes.join(", ");
  };

  /* ─── FUNCION CALCULAR HORA FIN ─────────────────────────────────── */
  const calcularHoraFin = (fecha_inicio, duracion_minutos) => {
    const inicio = new Date(fecha_inicio);
    const minutos = parseInt(duracion_minutos, 10);

    if (!isNaN(inicio.getTime()) && !isNaN(minutos)) {
      const fin = new Date(inicio.getTime() + minutos * 60000);

      // Formato YYYY-MM-THH:mm para input datetime-local
      const isoFin = new Date(fin.getTime() - fin.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

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

    const fechaInicio = selectInfo?.start ? formatDateTimeInput(selectInfo.start) : null;

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

  // Función para abrir el modal de reprogramación desde la edición del turno
  const abrirModalReprogramarDesdeEdicion = (turno) => {
    setTurnoSeleccionado(turno);
    setModalAbierto(false);
    setModalReprogramarAbierto(true);
  };

  /* ─── CERRAR MODALES ─────────────────────────────────── */
  const cerrarModal = () => {
    setModalAbierto(false);
    setModalAtenderAbierto(false);
    setModalCancelarAbierto(false);
    setModalReprogramarAbierto(false);
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

  const actualizarDatosReprogramacion = (e) => {
    const { name, value } = e.target;
    setDatosReprogramacion((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      console.error("Error al guardar el turno:", error.response);

      const status = error.response?.status || error.status;
      const errors = error.response?.data?.errors;

      if (status === 409) {
        alert("El horario seleccionado se superpone con otro turno");
      }

      if (status === 400 && errors && ("fecha_hora_inicio" in errors || "fecha_hora_fin" in errors)) {
        alert("El horario seleccionado debe ser como minimo la hora actual");
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

      await api.patch(`/turnos/${turnoSeleccionado.id_turno}/atender`, payloadAtencion);

      buscarTurnos();
      cerrarModal();
    } catch (error) {
      console.error("Error al registrar la atención del turno:", error);
      alert(error.response?.data?.error || "Ocurrió un error al registrar la atención.");
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
        await api.patch(`/turnos/${turnoSeleccionado.id_turno}/inasistente`, payloadAtencion);
      } else {
        await api.patch(`/turnos/${turnoSeleccionado.id_turno}/cancelar`, payloadAtencion);
      }

      buscarTurnos();
      cerrarModal();
    } catch (error) {
      console.error("Error al registrar la cancelación del turno:", error);
      alert(error.response?.data?.error || "Ocurrió un error al registrar la cancelación.");
    }
  };

  // Función que procesa la petición PATCH hacia turnos/:id/reprogramado
  const procesarReprogramacionTurno = async (e) => {
    e.preventDefault();
    if (!turnoSeleccionado) return;

    try {
      await api.patch(`/turnos/${turnoSeleccionado.id_turno}/reprogramado`, {
        fecha_hora_inicio: new Date(datosReprogramacion.fecha_hora_inicio).toISOString(),
        fecha_hora_fin: new Date(datosReprogramacion.fecha_hora_fin).toISOString(),
      });

      buscarTurnos();
      cerrarModal();
    } catch (error) {
      console.error("Error al reprogramar el turno:", error);
      if (error.response?.status === 409) {
        alert("El horario seleccionado se superpone con otro turno existente.");
      } else {
        alert(error.response?.data?.error || "No se pudo reprogramar el turno.");
      }
    }
  };

  const procesarClickEnTurno = (clickInfo) => {
    const turnoSeleccionado = turnos.find((t) => String(t.id_turno) === String(clickInfo.event.id));
    if (turnoSeleccionado) {
      modalEditando(turnoSeleccionado);
    }
  };

  /* ─── RETORNO DE LA PAGINA ─────────────────────────────────── */
  return (
    <div className="w-full h-screen flex flex-col pb-20 md:pb-0">
      {/* ─── CABECERA PRINCIPAL ─────────────────────────────────── */}
      <Header
        icono={Calendar}
        titulo="Agenda de Turnos"
        subtitulo="Gestión horaria y turnos del consultorio odontológico"
        badge={formatFechaCortaTexto(new Date())}
      />

      {/* ─── ADVERTENCIA DINÁMICA DE PACIENTES INCOMPLETOS ──────── */}
      {advertenciaVisible && pacientesIncompletos.length > 0 && (
        <div className="mx-4 mt-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-2 text-amber-800 shadow-sm transition-all duration-200 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm font-semibold">
                Hay {pacientesIncompletos.length}{" "}
                {pacientesIncompletos.length > 1 ? "pacientes creados " : "paciente creado "}
                con datos faltantes:
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAdvertenciaVisible(false)}
              className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-700 transition-colors"
              title="Cerrar advertencia"
            >
              <X size={18} />
            </button>
          </div>

          <div className="pl-8 flex flex-col gap-1 text-xs">
            {pacientesIncompletos.map((paciente) => (
              <div
                key={paciente.id_paciente}
                className="flex items-center justify-between py-1 border-b border-amber-200/50 last:border-0"
              >
                <span>
                  <strong className="font-medium text-amber-900">
                    {paciente.nombre} {paciente.apellido}
                  </strong>{" "}
                  - Faltan:{" "}
                  <span className="text-amber-700 font-medium">{obtenerCamposFaltantes(paciente)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/pacientes?editarId=${paciente.id_paciente}`);
                  }}
                  className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg font-medium transition-colors shadow-sm"
                >
                  <UserCheck size={14} />
                  <span>Completar</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── CONTENEDOR DEL CALENDARIO (OCUPA TODO EL ESPACIO RESTANTE) ─── */}
      <div className="flex-1 w-full min-h-0 p-2 md:p-4 text-black flex flex-col">
        <div className="w-full h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-2 md:p-4 flex flex-col">
          <AgendaCalendario turnos={turnos} onDateSelect={modalCreando} onEventClick={procesarClickEnTurno} />
        </div>
      </div>

      {/* ─── MODALES ─────────────────────────────────────────── */}
      {modalAbierto && (
        <FormularioCrearEditar
          modalAbierto={modalAbierto}
          cerrarModal={cerrarModal}
          editando={editando}
          pacientes={pacientes}
          setPacientes={setPacientes}
          datosFormulario={datosFormulario}
          actualizarDatos={actualizarDatos}
          setDatosFormulario={setDatosFormulario}
          procesarFormulario={procesarFormulario}
          abrirModalAtenderDesdeEdicion={abrirModalAtenderDesdeEdicion}
          abrirModalCancelarDesdeEdicion={abrirModalCancelarDesdeEdicion}
          abrirModalInasistenteDesdeEdicion={abrirModalInasistenteDesdeEdicion}
          abrirModalReprogramarDesdeEdicion={abrirModalReprogramarDesdeEdicion}
        />
      )}

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

      {modalReprogramarAbierto && (
        <FormularioReprogramar
          modalReprogramarAbierto={modalReprogramarAbierto}
          cerrarModal={cerrarModal}
          turnoSeleccionado={turnoSeleccionado}
          datosReprogramacion={datosReprogramacion}
          actualizarDatosReprogramacion={actualizarDatosReprogramacion}
          procesarReprogramacionTurno={procesarReprogramacionTurno}
        />
      )}
    </div>
  );
}
