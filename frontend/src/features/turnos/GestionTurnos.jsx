/** @format */

import { useState, useEffect } from "react";
import api from "../../services/api";
import { formatFechaTabla, formatDateTimeInput, formatSoloHora } from "../../utils/index";
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
  BanknoteArrowDown,
  MoreVertical,
} from "lucide-react";
import Header from "../../components/common/Header";
import Tabla from "../../components/common/Tabla/Tabla";
import {
  FormularioAtender,
  FormularioCrearEditar,
  FormularioCancelar,
  FormularioEliminar,
  FormularioReprogramar,
} from "./components/FormulariosTurno";
import { VistaTurno } from "./components/VistaTurno";

// Mapeo básico de estados
const estadosMap = {
  Programado: {
    id_estado: 1,
    color: "bg-amber-50 text-amber-700 border-amber-200/60",
    icon: Clock,
  },
  Atendido: {
    id_estado: 2,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    icon: CheckCircle2,
  },
  Cancelado: {
    id_estado: 3,
    color: "bg-red-50 text-red-700 border-red-200/60",
    icon: XCircle,
  },
  Inasistente: {
    id_estado: 4,
    color: "bg-[#f0f6f9] text-[#2b5d73] border-[#93BBCF]",
    icon: UserRoundX,
  },
};

export default function GestionTurnos() {
  /* ─── ESTADOS GENERALES ─────────────────────────────────── */
  const [turnos, setTurnos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [practicasLista, setPracticasLista] = useState([]);
  const [pacientesObrasSociales, setPacientesObrasSociales] = useState([]);
  const [cargando, setCargando] = useState(false);

  /* ─── ESTADOS PAGINACION Y ORDEN ─────────────────────────────────── */
  const [page, setPage] = useState(1);
  const [totalTurnos, setTotalTurnos] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(9);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState({ column: "id_turno", direction: "ASC" });
  const [estadoFiltrado, setEstadoFiltrado] = useState("all");

  /* ─── ESTADO PARA MENÚ DESPLEGABLE DE ACCIONES ───────────── */
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);

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

  const [datosAtencion, setDatosAtencion] = useState({
    notas_consulta: "",
    precio_final: 0,
    practicas: [],
  });

  const [inasistente, setInasistente] = useState(false);
  const [notasCanceladoInasistente, setNotasCanceladoInasistente] = useState({
    notas_consulta: "",
  });

  // Estados para el modal de reprogramación
  const [modalReprogramarAbierto, setModalReprogramarAbierto] = useState(false);
  const [datosReprogramacion, setDatosReprogramacion] = useState({
    fecha_hora_inicio: "",
    duracion_minutos: 30,
    fecha_hora_fin: "",
  });

  const [modalVerAbierto, setModalVerAbierto] = useState(false);
  const [turnoParaVer, setTurnoParaVer] = useState(null);

  /* ─── USE-EFFECTS ─────────────────────────────────── */
  useEffect(() => {
    buscarPacientes();
    buscarPracticas();
  }, []);

  useEffect(() => {
    buscarTurnos();
  }, [page, search, order, estadoFiltrado]);

  useEffect(() => {
    if (datosFormulario.fecha_hora_inicio && datosFormulario.duracion_minutos) {
      calcularHoraFin(datosFormulario.fecha_hora_inicio, datosFormulario.duracion_minutos);
    }
  }, [datosFormulario.fecha_hora_inicio, datosFormulario.duracion_minutos]);

  // UseEffect específico para calcular la fecha fin en el modal de reprogramar
  useEffect(() => {
    if (datosReprogramacion.fecha_hora_inicio && datosReprogramacion.duracion_minutos) {
      const inicio = new Date(datosReprogramacion.fecha_hora_inicio);
      const minutos = parseInt(datosReprogramacion.duracion_minutos, 10);
      if (!isNaN(inicio.getTime()) && !isNaN(minutos)) {
        const fin = new Date(inicio.getTime() + minutos * 60000);
        const isoFin = new Date(fin.getTime() - fin.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setDatosReprogramacion((prev) => ({ ...prev, fecha_hora_fin: isoFin }));
      }
    }
  }, [datosReprogramacion.fecha_hora_inicio, datosReprogramacion.duracion_minutos]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuAbiertoId !== null && !event.target.closest(".menu-acciones-container")) {
        setMenuAbiertoId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuAbiertoId]);

  /* ─── PETICIONES API ─────────────────────────────────── */
  const buscarTurnos = async () => {
    setCargando(true);
    try {
      const respuesta = await api.get("/turnos", {
        params: {
          page: page,
          search: search,
          sortField: order.column,
          sortOrder: order.direction,
          estadoFiltrado: estadosMap[estadoFiltrado]?.id_estado || null,
        },
      });
      setTurnos(respuesta.data.data || []);
      setPage(respuesta.data.meta.page);
      setTotalPages(respuesta.data.meta.totalPages);
      setTotalTurnos(respuesta.data.meta.total);
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
      const respuesta = await api.get(`/pacientes-por-obras-sociales/${id_paciente}`);
      setPacientesObrasSociales(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar relación paciente-obra social:", error);
    }
  };

  const calcularHoraFin = (fecha_inicio, duracion_minutos) => {
    const inicio = new Date(fecha_inicio);
    const minutos = parseInt(duracion_minutos, 10);

    if (!isNaN(inicio.getTime()) && !isNaN(minutos)) {
      const fin = new Date(inicio.getTime() + minutos * 60000);
      const isoFin = new Date(fin.getTime() - fin.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

      setDatosFormulario((prev) => ({
        ...prev,
        fecha_hora_fin: isoFin,
      }));
    }
  };

  const abrirVistaTurno = (turno) => {
    setTurnoParaVer(turno);
    setModalVerAbierto(true);
  };

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

  const abrirModalCancelar = (turno) => {
    setTurnoSeleccionado(turno);
    setModalAbierto(false);
    setInasistente(false);
    setModalCancelarAbierto(true);
  };

  const abrirModalInasistente = (turno) => {
    setTurnoSeleccionado(turno);
    setModalAbierto(false);
    setInasistente(true);
    setModalCancelarAbierto(true);
  };

  // Función para abrir el modal de reprogramación desde la edición del turno
  const abrirModalReprogramarDesdeEdicion = (turno) => {
    setTurnoSeleccionado(turno);
    setModalAbierto(false);
    setModalReprogramarAbierto(true);
  };

  const actualizarDatosReprogramacion = (e) => {
    const { name, value } = e.target;
    setDatosReprogramacion((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModalEliminar(false);
    setModalAtenderAbierto(false);
    setModalCancelarAbierto(false);
    setModalReprogramarAbierto(false);
    setTurnoSeleccionado(null);
    setMenuAbiertoId(null);
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
    setNotasCanceladoInasistente({ notas_consulta: "" });
  };

  const actualizarDatos = (e) => {
    const { name, value } = e.target;
    setDatosFormulario((prev) => ({
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
        obras_sociales: datosAtencion.practicas
          .filter((p) => p.id_practica)
          .map((p) => (p.id_obra_social ? Number(p.id_obra_social) : null)),
      };

      await api.patch(`/turnos/${turnoSeleccionado.id_turno}/atender`, payloadAtencion);

      buscarTurnos();
      cerrarModal();
    } catch (error) {
      console.error("Error al registrar la atención del turno:", error);
      alert(error.response?.data?.error || "Ocurrió un error al registrar la atención.");
    }
  };

  const procesarCancelacionTurno = async (e) => {
    e.preventDefault();
    if (!turnoSeleccionado) return;

    try {
      const payloadAtencion = {
        notas_consulta: notasCanceladoInasistente.notas_consulta.trim(),
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

  const ejecutarEliminacion = async () => {
    if (!turnoSeleccionado) return;
    try {
      await api.patch(`/turnos/${turnoSeleccionado.id_turno}/delete`);
      buscarTurnos();
      cerrarModal();
    } catch (error) {
      console.error("Error al eliminar turno:", error);
      alert("No se pudo eliminar el turno.");
    }
  };

  const inicioRegistro = totalTurnos === 0 ? 0 : (page - 1) * 9 + 1;
  const finRegistro = totalTurnos === 0 ? 0 : page === totalPages ? totalTurnos : page * 9;

  return (
    <div className="w-full flex flex-col gap-4 pb-24">
      {/* ─── CABECERA PRINCIPAL CON BOTÓN EXCLUSIVO PARA PC ───────────────── */}
      <Header
        icono={CalendarClock}
        titulo="Gestión de Turnos"
        subtitulo="Listado general y administración de turnos del consultorio"
        badge={`${totalTurnos} Registrados`}
        botonAccion={
          <button
            type="button"
            onClick={modalCreando}
            className="sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0"
          >
            <Plus size={18} />
            <span>Agendar Turno</span>
          </button>
        }
      />

      <div className="w-full px-4 flex flex-col gap-4">
        {/* ─── CONTENEDOR UNIFICADO ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {/* Barra superior */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-medium text-gray-500">
              Mostrando {inicioRegistro} a {finRegistro} de {totalTurnos} registros
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <select
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50"
                value={estadoFiltrado}
                onChange={(e) => {
                  setEstadoFiltrado(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Todos</option>
                {Object.keys(estadosMap).map((nombreEstado) => (
                  <option key={nombreEstado} value={nombreEstado}>
                    {nombreEstado}
                  </option>
                ))}
              </select>

              <div className="relative flex-1 sm:w-80">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por paciente, DNI o nota..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Tabla adaptable */}
          <div className="overflow-x-auto w-full">
            <Tabla
              cargando={cargando}
              sinDatosText="No se encontraron turnos registrados."
              columnas={[
                { label: "ID", className: "hidden md:table-cell" },
                { label: "Paciente" },
                { label: "Fecha y Hora" },
                { label: "Precio ($)", className: "hidden md:table-cell" },
                { label: "Estado" },
                { label: "Notas", className: "hidden md:table-cell" },
                { label: "Acciones", align: "center" },
              ]}
            >
              {turnos.map((turno, index) => {
                const estadoInfo = estadosMap[turno.EstadoTurno.estado] || {
                  nombre: "Desconocido",
                  color: "bg-gray-100 text-gray-600 border-gray-200",
                  icon: AlertCircle,
                };
                const IconoEstado = estadoInfo.icon;
                const menuEstaAbierto = menuAbiertoId === turno.id_turno;
                const esUltimasFilas = index >= turnos.length - 2;
                return (
                  <tr key={turno.id_turno} className="hover:bg-gray-50/60 transition-colors">
                    <td className="hidden md:table-cell px-5 py-4 font-semibold text-gray-500 w-16 text-xs">
                      #{turno.id_turno}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="hidden md:flex w-8 h-8 rounded-full bg-[#e8f7f1] text-[#2eb086] items-center justify-center font-bold text-xs shrink-0">
                          {turno.Paciente?.nombre?.charAt(0) || "P"}
                          {turno.Paciente?.apellido?.charAt(0) || ""}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 text-sm">
                            {turno.Paciente
                              ? `${turno.Paciente.nombre} ${turno.Paciente.apellido}`
                              : `Paciente #${turno.id_paciente}`}
                          </span>
                          {turno.Paciente?.dni && (
                            <span className="text-xs text-gray-400 mt-0.5">DNI: {turno.Paciente.dni}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatFechaTabla(turno.fecha_hora_inicio)}
                        </span>
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <Clock size={12} className="text-gray-400" />
                          {formatSoloHora(turno.fecha_hora_inicio)} - {formatSoloHora(turno.fecha_hora_fin)}{" "}
                          hs
                        </span>
                      </div>
                    </td>

                    <td className="hidden md:table-cell px-5 py-4 font-semibold text-gray-800 text-sm">
                      $
                      {Number(turno.precio_final).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${estadoInfo.color}`}
                      >
                        <IconoEstado size={14} />
                        <span>{turno.EstadoTurno.estado}</span>
                      </span>
                    </td>

                    <td className="hidden md:table-cell px-5 py-4 text-gray-500 text-xs max-w-[200px] truncate">
                      {turno.notas_consulta || <span className="text-gray-300 italic">Sin notas</span>}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 relative">
                        <button
                          type="button"
                          onClick={() => abrirVistaTurno(turno)}
                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>

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

                        {turno.EstadoTurno.estado === "Programado" && (
                          <div className="relative menu-acciones-container">
                            <button
                              type="button"
                              onClick={() => setMenuAbiertoId(menuEstaAbierto ? null : turno.id_turno)}
                              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                              title="Más opciones"
                            >
                              <MoreVertical size={18} />
                            </button>

                            {menuEstaAbierto && (
                              <div
                                className={`absolute right-0 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 flex flex-col ${
                                  esUltimasFilas ? "bottom-full mb-2" : "top-full mt-2"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuAbiertoId(null);
                                    abrirModalAtender(turno);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
                                >
                                  <CheckSquare size={16} />
                                  <span>Atender Turno</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuAccionesAbierto(false);
                                    if (abrirModalReprogramarDesdeEdicion)
                                      abrirModalReprogramarDesdeEdicion();
                                  }}
                                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#3B7A94] hover:bg-[#f0f6f9] transition-colors text-left"
                                >
                                  <CalendarDays size={16} />
                                  <span>Reprogramar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuAbiertoId(null);
                                    abrirModalCancelar(turno);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                                >
                                  <X size={16} />
                                  <span>Cancelar Turno</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuAbiertoId(null);
                                    abrirModalInasistente(turno);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium hover:bg-[#f0f6f9] text-[#2b5d73] transition-colors text-left"
                                >
                                  <UserRoundX size={16} />
                                  <span>Inasistente</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {turno.EstadoTurno.estado === "Atendido" && (
                          <div className="relative menu-acciones-container">
                            <button
                              type="button"
                              onClick={() => setMenuAbiertoId(menuEstaAbierto ? null : turno.id_turno)}
                              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                              title="Más opciones"
                            >
                              <MoreVertical size={18} />
                            </button>

                            {menuEstaAbierto && (
                              <div
                                className={`absolute right-0 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 flex flex-col ${
                                  esUltimasFilas ? "bottom-full mb-2" : "top-full mt-2"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuAbiertoId(null);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <BanknoteArrowDown size={16} />
                                  <span>Cobrar</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Tabla>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-white">
            <div className="text-xs text-gray-500">
              Página {page} de {totalPages || 1}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 transition-all"
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </button>

              <select
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="px-3 py-1.5 bg-[#2eb086] text-white rounded-xl text-xs font-semibold shadow-sm focus:outline-none cursor-pointer"
              >
                {Array.from({ length: totalPages }, (_, index) => (
                  <option key={index + 1} value={index + 1} className="bg-white text-gray-800">
                    {index + 1}
                  </option>
                ))}
              </select>

              <button
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 transition-all"
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Botón Flotante Móvil */}
      <button
        type="button"
        onClick={modalCreando}
        className="fixed bottom-20 right-4 z-40 flex md:hidden items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-3 py-3 rounded-full font-semibold text-sm shadow-2xl transition-all duration-300 active:scale-95 group"
        title="Agendar Turno"
      >
        <Plus size={20} className="transition-transform group-hover:rotate-90 duration-300" />
      </button>

      {/* Modales */}
      <VistaTurno
        isOpen={modalVerAbierto}
        onClose={() => {
          setModalVerAbierto(false);
          setTurnoParaVer(null);
        }}
        turno={turnoParaVer}
      />

      {modalAbierto && (
        <FormularioCrearEditar
          modalAbierto={modalAbierto}
          cerrarModal={cerrarModal}
          editando={editando}
          pacientes={pacientes}
          datosFormulario={datosFormulario}
          actualizarDatos={actualizarDatos}
          procesarFormulario={procesarFormulario}
        />
      )}

      {/* ─── 3. Renderizado del componente FormularioReprogramar ─── */}
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
          notasCanceladoInasistente={notasCanceladoInasistente}
          setNotasCanceladoInasistente={setNotasCanceladoInasistente}
          procesarCancelacionTurno={procesarCancelacionTurno}
        />
      )}

      {modalEliminar && (
        <FormularioEliminar
          modalEliminar={modalEliminar}
          cerrarModal={cerrarModal}
          turnoSeleccionado={turnoSeleccionado}
          ejecutarEliminacion={ejecutarEliminacion}
        />
      )}
    </div>
  );
}
