/** @format */

import { useState, useEffect } from "react";
import Modal from "../components/ui/Modal";
import api from "../services/api";
import { formatFechaHoraTabla, formatDateTimeInput } from "../utils/index";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CalendarClock,
  CheckSquare,
  X,
  UserRoundX,
  Eye,
} from "lucide-react";
import Header from "../components/ui/Header";
import Tabla from "../components/ui/Tabla";
import {
  FormularioAtender,
  FormularioCrearEditar,
  FormularioCancelar,
} from "../components/ui/Turno/FormulariosTurno";
import { VistaTurno } from "../components/ui/Turno/VistaTurno";

// Mapeo básico de estados
const estadosMap = {
  Programado: {
    color: "bg-amber-50 text-amber-700 border-amber-200/60",
    icon: Clock,
  },
  Atendido: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    icon: CheckCircle2,
  },
  Cancelado: {
    color: "bg-red-50 text-red-700 border-red-200/60",
    icon: XCircle,
  },
  Inasistente: {
    color: "bg-yellow-50 text-yellow-700 border-yellow-200/60",
    icon: UserRoundX,
  },
};

export default function GestionTurnos() {
  /* ─── ESTADOS GENERALES ─────────────────────────────────── */
  const [turnos, setTurnos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [practicasLista, setPracticasLista] = useState([]);
  const [pacientesObrasSociales, setPacientesObrasSociales] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);

  /* ─── ESTADOS DE LOS MODALES Y FORMULARIOS ───────────────── */
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [modalAtenderAbierto, setModalAtenderAbierto] = useState(false);
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);

  const [editando, setEditando] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);

  const [datosFormulario, setDatosFormulario] = useState({
    id_paciente: "",
    id_estado: 1,
    fecha_hora_inicio: "",
    fecha_hora_fin: "",
    duracion_minutos: 30,
    precio_final: 0,
    notas_consulta: "",
  });

  // Estado específico para el modal de Atender Turno
  const [datosAtencion, setDatosAtencion] = useState({
    notas_consulta: "",
    precio_final: 0,
    practicas: [],
  });

  // Estado específico para el modal de Cancelar e Inasistente
  const [inasistente, setInasistente] = useState(false);
  const [notasCancelarInasistente, setNotasCancelarInasistente] = useState("");

  // Estados espefíficos para vista de turno
  const [modalVerAbierto, setModalVerAbierto] = useState(false);
  const [turnoParaVer, setTurnoParaVer] = useState(null);

  const abrirVistaTurno = (turno) => {
    setTurnoParaVer(turno);
    setModalVerAbierto(true);
  };

  /* ─── USE-EFFECTS ─────────────────────────────────── */
  useEffect(() => {
    buscarTurnos();
    buscarPacientes();
    buscarPracticas();
  }, []);

  // Cálculo automático de fecha_hora_fin en el modal principal
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
    setCargando(true);
    try {
      const respuesta = await api.get("/turnos");
      setTurnos(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar turnos:", error);
    } finally {
      setCargando(false);
    }
  };

  const buscarPacientes = async () => {
    try {
      const respuesta = await api.get("/pacientes");
      setPacientes(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
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

  /* ─── CÁLCULO DE FECHA FIN ───────────────────────────────── */
  const calcularHoraFin = (fecha_inicio, duracion_minutos) => {
    const inicio = new Date(fecha_inicio);
    const minutos = parseInt(duracion_minutos, 10);

    if (!isNaN(inicio.getTime()) && !isNaN(minutos)) {
      const fin = new Date(inicio.getTime() + minutos * 60000);
      const isoFin = new Date(fin.getTime() - fin.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      setDatosFormulario((prev) => ({
        ...prev,
        fecha_hora_fin: isoFin,
      }));
    }
  };

  /* ─── MANEJO DE MODALES ─────────────────────────────────── */
  const modalCreando = () => {
    setEditando(false);
    setDatosFormulario({
      id_paciente: "",
      id_estado: 1,
      fecha_hora_inicio: "",
      fecha_hora_fin: "",
      duracion_minutos: 30,
      precio_final: 0,
      notas_consulta: "",
    });
    setModalAbierto(true);
  };

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

  const confirmarEliminar = (turno) => {
    setTurnoSeleccionado(turno);
    setModalEliminar(true);
  };

  // Abrir Modal Atender Turno
  const abrirModalAtender = (turno) => {
    setTurnoSeleccionado(turno);
    setDatosAtencion({
      notas_consulta: turno.notas_consulta || "",
      precio_final: 0,
      practicas: [],
    });
    buscarObrasSocialesPaciente(turno.id_paciente);
    setModalAtenderAbierto(true);
  };

  /* ─── ABRIR MODAL CANCELAR TURNO ──────────────────────────── */
  const abrirModalCancelar = (turno) => {
    setTurnoSeleccionado(turno);
    setModalAbierto(false);

    setInasistente(false);
    setModalCancelarAbierto(true);
  };

  /* ─── ABRIR MODAL INASISTENTE TURNO ──────────────────────────── */
  const abrirModalInasistente = (turno) => {
    setTurnoSeleccionado(turno);
    setModalAbierto(false);

    setInasistente(true);
    setModalCancelarAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModalEliminar(false);
    setModalAtenderAbierto(false);
    setModalCancelarAbierto(false);
    setTurnoSeleccionado(null);
    setDatosFormulario({
      id_paciente: "",
      id_estado: 1,
      fecha_hora_inicio: "",
      fecha_hora_fin: "",
      duracion_minutos: 30,
      precio_final: 0,
      notas_consulta: "",
    });
    setDatosAtencion({
      notas_consulta: "",
      precio_final: 0,
      practicas: [],
    });
    setInasistente(false);
    setNotasCancelarInasistente("");
  };

  /* ─── CAMPOS FORMULARIO GENERAL ─────────────────────────── */
  const actualizarDatos = (e) => {
    const { name, value } = e.target;
    setDatosFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  // Filtrar las obras sociales correspondientes exclusivamente al paciente del turno actual
  const obtenerObrasSocialesPacienteActual = () => {
    if (!turnoSeleccionado) return [];
    const idPaciente = turnoSeleccionado.id_paciente;
    // Filtramos las relaciones asociadas a este paciente y populamos los datos de la obra social si vienen incluidos o los buscamos en la lista global
    return pacientesObrasSociales.filter(
      (rel) => Number(rel.id_paciente) === Number(idPaciente),
    );
  };

  /* ─── GUARDAR / EDITAR TURNO ─────────────────────────────── */
  const procesarFormulario = async (e) => {
    e.preventDefault();

    if (!datosFormulario.id_paciente) {
      alert("Por favor seleccione un paciente.");
      return;
    }

    try {
      const { duracion_minutos, ...restoDatos } = datosFormulario;

      const payload = {
        ...restoDatos,
        id_paciente: Number(restoDatos.id_paciente),
        id_estado: Number(restoDatos.id_estado),
        precio_final: parseFloat(restoDatos.precio_final),
        fecha_hora_inicio: new Date(restoDatos.fecha_hora_inicio).toISOString(),
        fecha_hora_fin: new Date(restoDatos.fecha_hora_fin).toISOString(),
        notas_consulta: restoDatos.notas_consulta?.trim() || "",
      };

      if (editando) {
        await api.put(`/turnos/${turnoSeleccionado.id_turno}`, payload);
      } else {
        await api.post("/turnos", payload);
      }

      buscarTurnos();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar el turno:", error);
      if (error.response?.status === 409) {
        alert("El horario seleccionado se superpone con otro turno existente.");
      } else {
        alert("Ocurrió un error al procesar el turno.");
      }
    }
  };

  /* ─── PROCESAR ATENCIÓN DEL TURNO (PATCH /atender) ───────── */
  const procesarAtencionTurno = async (e) => {
    e.preventDefault();
    if (!turnoSeleccionado) return;
    console.log(
      datosAtencion.practicas
        .filter((p) => p.id_practica)
        .map((p) => Number(p.id_practica)),
    );

    try {
      // Preparamos los datos según lo que espera tu backend en turnoAtendido
      // Enviamos las prácticas realizadas (IDs) y opcionalmente las obras sociales si tu backend las procesa en la intermedia
      const payloadAtencion = {
        notas_consulta: datosAtencion.notas_consulta.trim(),
        precio_final: parseFloat(datosAtencion.precio_final),
        // Si tu backend espera una lista de IDs de prácticas (ej: practicas_realizadas)
        practicas_realizadas: datosAtencion.practicas
          .filter((p) => p.id_practica)
          .map((p) => Number(p.id_practica)),
        // Si también quieres enviar los detalles de la obra social asociada a cada práctica:
        obras_sociales: datosAtencion.practicas
          .filter((p) => p.id_practica)
          .map((p) => (p.id_obra_social ? Number(p.id_obra_social) : null)),
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

  /* ─── ELIMINAR TURNO (DELETE) ────────────────────────────── */
  const ejecutarEliminacion = async () => {
    if (!turnoSeleccionado) return;
    try {
      await api.delete(`/turnos/${turnoSeleccionado.id_turno}`);
      buscarTurnos();
      cerrarModal();
    } catch (error) {
      console.error("Error al eliminar turno:", error);
      alert("No se pudo eliminar el turno.");
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-4">
      {/* ─── CABECERA PRINCIPAL ─────────────────────────────────── */}
      <Header
        icono={CalendarClock}
        titulo="Gestión de Turnos"
        subtitulo="Listado general y administración de turnos del consultorio"
        badge={`${turnos.length} Registrados`}
        botonAccion={
          <button
            type="button"
            onClick={modalCreando}
            className="flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0"
          >
            <Plus size={18} />
            <span>Agendar Turno</span>
          </button>
        }
      />

      <div className="flex-1 w-full min-h-0 p-4 pt-0">
        {/* ─── BARRA DE BÚSQUEDA Y FILTROS ───────────────────────── */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar por paciente, DNI o nota..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all"
            />
          </div>
        </div>

        {/* ─── TABLA DE TURNOS ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1 mt-4">
          <div className="overflow-x-auto">
            <Tabla
              cargando={cargando}
              sinDatosText="No se encontraron turnos registrados."
              columnas={[
                { label: "ID" },
                { label: "Paciente" },
                { label: "Fecha y Hora" },
                { label: "Precio ($)" },
                { label: "Estado" },
                { label: "Notas de la consulta" },
                { label: "Acciones", align: "center" },
              ]}
            >
              {turnos.map((turno) => {
                const estadoInfo = estadosMap[turno.EstadoTurno.estado] || {
                  nombre: "Desconocido",
                  color: "bg-gray-100 text-gray-600 border-gray-200",
                  icon: AlertCircle,
                };
                const IconoEstado = estadoInfo.icon;

                return (
                  <tr
                    key={turno.id_turno}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    {/* ID */}
                    <td className="px-6 py-4 font-semibold text-gray-500 w-16">
                      #{turno.id_turno}
                    </td>

                    {/* Paciente */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#e8f7f1] text-[#2eb086] flex items-center justify-center font-bold text-sm shrink-0">
                          {turno.Paciente?.nombre?.charAt(0) || "P"}
                          {turno.Paciente?.apellido?.charAt(0) || ""}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">
                            {turno.Paciente
                              ? `${turno.Paciente.nombre} ${turno.Paciente.apellido}`
                              : `Paciente #${turno.id_paciente}`}
                          </span>
                          {turno.Paciente?.dni && (
                            <span className="text-xs text-gray-400">
                              DNI: {turno.Paciente.dni}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Fecha y Hora */}
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {formatFechaHoraTabla(turno.fecha_hora_inicio)}
                    </td>

                    {/* Precio */}
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      $
                      {Number(turno.precio_final).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${estadoInfo.color}`}
                      >
                        <IconoEstado size={14} />
                        <span>{turno.EstadoTurno.estado}</span>
                      </span>
                    </td>

                    {/* Notas */}
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                      {turno.notas_consulta || (
                        <span className="text-gray-300 italic">Sin notas</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => abrirVistaTurno(turno)}
                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Ver detalle del turno"
                        >
                          <Eye size={18} />
                        </button>
                        {/* Botón Atender (Disponible si está pendiente/confirmado o según tu lógica) */}
                        {turno.EstadoTurno.estado === "Programado" && (
                          <div>
                            <button
                              type="button"
                              onClick={() => abrirModalAtender(turno)}
                              className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Marcar como Atendido y Registrar Prácticas"
                            >
                              <CheckSquare size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirModalCancelar(turno)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                              title="Marcar como Cancelado"
                            >
                              <X size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirModalInasistente(turno)}
                              className="p-2 rounded-lg text-yellow-600 hover:bg-yellow-50 transition-colors"
                              title="Marcar como Inasistente"
                            >
                              <UserRoundX size={18} />
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => modalEditando(turno)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar Turno"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmarEliminar(turno)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Eliminar Turno"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Tabla>
          </div>
        </div>
      </div>

      {/* ─── MODAL VER DETALLE DE TURNO ─────────────────────────── */}
      <VistaTurno
        isOpen={modalVerAbierto}
        onClose={() => {
          setModalVerAbierto(false);
          setTurnoParaVer(null);
        }}
        turno={turnoParaVer}
      />

      {/* ─── MODAL CREAR / EDITAR TURNO ─────────────────────────── */}
      {modalAbierto && (
        <FormularioCrearEditar
          page={"Turnos"}
          modalAbierto={modalAbierto}
          cerrarModal={cerrarModal}
          editando={editando}
          pacientes={pacientes}
          datosFormulario={datosFormulario}
          actualizarDatos={actualizarDatos}
          procesarFormulario={procesarFormulario}
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

      {/* ─── MODAL CONFIRMAR ELIMINACIÓN ─────────────────────────── */}
      {modalEliminar && (
        <Modal
          isOpen={modalEliminar}
          onClose={cerrarModal}
          width="max-w-md"
          title="Eliminar Turno"
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que deseas eliminar el turno{" "}
              <strong className="text-gray-800">
                #{turnoSeleccionado?.id_turno}
              </strong>{" "}
              del paciente{" "}
              <strong className="text-gray-800">
                {turnoSeleccionado?.Paciente
                  ? `${turnoSeleccionado.Paciente.nombre} ${turnoSeleccionado.Paciente.apellido}`
                  : `#${turnoSeleccionado?.id_paciente}`}
              </strong>
              ?
            </p>
          </div>

          <div className="border-t border-gray-200 my-4" />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={cerrarModal}
              className="px-4 py-2 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={ejecutarEliminacion}
              className="px-4 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600 font-semibold text-sm transition-colors shadow-sm"
            >
              Sí, Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
