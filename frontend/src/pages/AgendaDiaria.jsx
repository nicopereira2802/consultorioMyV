/** @format */

import { useState, useEffect } from "react";
import Modal from "../components/Modal";
import AgendaCalendario from "../components/AgendaCalendario";
import api from "../services/api";
import {
  formatFechaTabla,
  formatDateTimeInput,
  formatFechaCortaTexto,
} from "../utils/index";
import { Calendar, Plus } from "lucide-react";

export default function AgendaDiaria() {
  /* ─── VARIABLES GENERALES ─────────────────────────────────── */
  const [turnos, setTurnos] = useState();
  const [pacientes, setPacientes] = useState([]);

  /* ─── VARIABLES DEL MODAL ─────────────────────────────────── */
  const [datosFormulario, setDatosFormulario] = useState({
    duracion_minutos: 30, // Valor por defecto
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(false);

  /* ─── USE-EFFECTS ─────────────────────────────────── */
  useEffect(() => {
    buscarTurnos();
    buscarPacientes();
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

    setDatosFormulario({
      ...turno,
      fecha_hora_inicio: formatDateTimeInput(turno.fecha_hora_inicio),
      fecha_hora_fin: formatDateTimeInput(turno.fecha_hora_fin),
      duracion_minutos: turno.duracion_minutos || 30,
    });

    setModalAbierto(true);
  };

  /* ─── CERRAR MODAL ─────────────────────────────────── */
  const cerrarModal = () => {
    setModalAbierto(false);
    setDatosFormulario({});
  };

  /* ─── ACTUALIZAR DATOS DEL FORMULARIO ─────────────────────────────────── */
  const actualizarDatos = (e) => {
    const { name, value } = e.target;

    setDatosFormulario((prev) => ({ ...prev, [name]: value }));
  };

  /* ─── ENVIAR EL FORMULARIO ─────────────────────────────────── */
  const procesarFormulario = async (e) => {
    e.preventDefault();

    if (!datosFormulario.id_paciente) {
      alert("Por favor seleccione un paciente.");
      return;
    }

    try {
      // Excluimos duracion_minutos antes de enviar al backend si no se guarda en BD
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
      if(error.status = 409){
        alert("El horario seleccionado se superpone con otro turno")
      } 
    }
  };

  const handleEventClick = (clickInfo) => {
    // Buscar el turno por id en la lista local o mandar el objeto
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Ícono de calendario en contenedor con color institucional */}
          <div className="w-12 h-12 rounded-2xl bg-[#e8f7f1] text-[#2eb086] flex items-center justify-center shrink-0 shadow-sm">
            <Calendar size={24} />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                Agenda de Turnos
              </h1>
              {/* Badge dinámico con la fecha corta */}
              <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f7f1] text-[#2eb086] border border-[#2eb086]/20">
                {formatFechaCortaTexto(new Date())}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">
              Gestión horaria y turnos del consultorio odontológico
            </p>
          </div>
        </div>

        {/* { Botón de Acción Rápida }
        <button
          type="button"
          onClick={() => modalCreando()}
          className="flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0"
        >
          <Plus size={18} />
          <span>Nuevo Turno</span>
        </button> */}
      </div>

      {/* ─── CONTENEDOR DEL CALENDARIO ─────────────────────────── */}
      <div className="flex-1 w-full min-h-0 text-black">
        <AgendaCalendario
          turnos={turnos}
          onDateSelect={modalCreando}
          onEventClick={handleEventClick}
        />
      </div>

      {/* ─── MODAL CREAR / EDITAR TURNO ─────────────────────────── */}
      {modalAbierto && (
        <form onSubmit={procesarFormulario}>
          <Modal
            isOpen={modalAbierto}
            onClose={cerrarModal}
            width="max-w-2xl"
            title={editando ? "Editar Turno" : "Agendar Turno Nuevo"}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Paciente */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Paciente *
                </label>
                <select
                  name="id_paciente"
                  value={datosFormulario.id_paciente || ""}
                  onChange={actualizarDatos}
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                >
                  <option value="">Seleccione un paciente...</option>
                  {pacientes.map((p) => (
                    <option key={p.id_paciente} value={p.id_paciente}>
                      {p.nombre} {p.apellido} - DNI: {p.dni || "S/D"} -
                      Telefono: {p.telefono || "S/D"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora de Inicio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Fecha y Hora de Inicio *
                </label>
                <input
                  type="datetime-local"
                  name="fecha_hora_inicio"
                  value={datosFormulario.fecha_hora_inicio || ""}
                  onChange={actualizarDatos}
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                />
              </div>

              {/* Duración (Minutos) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Duración (Minutos)
                </label>
                <select
                  name="duracion_minutos"
                  value={datosFormulario.duracion_minutos || 30}
                  onChange={actualizarDatos}
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos (1 hora)</option>
                  <option value={90}>90 minutos (1h 30m)</option>
                  <option value={120}>120 minutos (2 horas)</option>
                </select>
              </div>

              {/* Fecha y Hora de Fin (Calculado) */}
              <div className="col-span-1 md:col-span-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Fecha y Hora de Fin (Calculado automáticamente)
                </label>
                <input
                  type="datetime-local"
                  name="fecha_hora_fin"
                  value={datosFormulario.fecha_hora_fin || ""}
                  disabled
                  className="w-full bg-gray-100 border border-gray-300 p-2 rounded-lg text-sm text-gray-600 cursor-not-allowed font-medium"
                />
              </div>

              {/* Notas / Observaciones */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Notas de la Consulta
                </label>
                <textarea
                  name="notas_consulta"
                  rows={3}
                  placeholder="Observaciones previas, alergias, o detalles del procedimiento..."
                  value={datosFormulario.notas_consulta || ""}
                  onChange={actualizarDatos}
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                />
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-gray-200 my-5" />

            {/* Acciones */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cerrarModal}
                className="px-4 py-2.5 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] transition-all shadow-sm font-semibold text-sm"
              >
                {editando ? "Guardar Cambios" : "Confirmar Turno"}
              </button>
            </div>
          </Modal>
        </form>
      )}
    </div>
  );
}
