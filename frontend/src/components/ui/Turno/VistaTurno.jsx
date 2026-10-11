/** @format */

import { useState, useEffect } from "react";
import Modal from "../../ui/Modal";
import api from "../../../services/api";
import { formatFechaHoraTabla } from "../../../utils/formatearFecha";
import {
  Calendar,
  Clock,
  User,
  FileText,
  DollarSign,
  Activity,
  Shield,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserRoundX,
} from "lucide-react";

export function VistaTurno({ isOpen, onClose, turno }) {
  const [historial, setHistorial] = useState([]);
  const [practicasTurno, setPracticasTurno] = useState([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  // Cargar historial de estados y prácticas asociadas al turno cuando se abre el modal
  useEffect(() => {
    if (isOpen && turno?.id_turno) {
      cargarDetallesTurno(turno.id_turno);
    }
  }, [isOpen, turno]);

  const cargarDetallesTurno = async (id_turno) => {
    setCargandoDetalles(true);
    try {
      // Petición para el historial de estados
      const resHistorial = await api.get(
        `/historial-estado-turnos/${id_turno}`,
      );
      setHistorial(resHistorial.data.data || []);
    } catch (error) {
      console.error("Error al cargar el historial del turno:", error);
      setHistorial([]);
    }

    try {
      // Petición para obtener las prácticas del turno (asumiendo que filtras por turno o usas un endpoint relacionado)
      const resPracticas = await api.get(`/practicas-turnos`);
      const todasLasPracticas = resPracticas.data.data || [];

      console.log(todasLasPracticas)
      // Filtrar localmente las que correspondan a este turno
      const delTurno = todasLasPracticas.filter(
        (pt) => Number(pt.id_turno) === Number(id_turno),
      );
      setPracticasTurno(delTurno);
    } catch (error) {
      console.error("Error al cargar las prácticas del turno:", error);
      setPracticasTurno([]);
    } finally {
      setCargandoDetalles(false);
    }
  };

  if (!turno) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-3xl"
      title={`Detalles del Turno #${turno.id_turno}`}
    >
      <div className="flex flex-col gap-6 max-h-[75vh] overflow-y-auto pr-1 text-black">
        {/* ─── SECCIÓN 1: DATOS GENERALES Y ESTADO ───────────────── */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Estado */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white border border-gray-200 text-[#2eb086] shadow-2xs">
              <Activity size={20} />
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Estado Actual
              </span>
              <span className="font-bold text-gray-800 text-sm">
                {turno.EstadoTurno?.estado || "Desconocido"}
              </span>
            </div>
          </div>

          {/* Precio Final */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white border border-gray-200 text-[#2eb086] shadow-2xs">
              <DollarSign size={20} />
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Precio Final
              </span>
              <span className="font-bold text-gray-800 text-sm">
                $
                {Number(turno.precio_final || 0).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Fecha y Hora de Inicio */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 shadow-2xs">
              <Calendar size={20} />
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Fecha y Hora de Inicio
              </span>
              <span className="font-medium text-gray-700 text-sm">
                {formatFechaHoraTabla(turno.fecha_hora_inicio)}
              </span>
            </div>
          </div>

          {/* Fecha y Hora de Fin */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 shadow-2xs">
              <Clock size={20} />
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Fecha y Hora de Fin
              </span>
              <span className="font-medium text-gray-700 text-sm">
                {formatFechaHoraTabla(turno.fecha_hora_fin)}
              </span>
            </div>
          </div>
        </div>

        {/* ─── SECCIÓN 2: INFORMACIÓN DEL PACIENTE ───────────────── */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
            <User size={18} className="text-[#2eb086]" />
            <span>Datos del Paciente</span>
          </h3>
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-between gap-3 text-sm">
            <div>
              <span className="block text-xs text-gray-400 uppercase">
                Nombre Completo
              </span>
              <span className="font-semibold text-gray-800">
                {turno.Paciente
                  ? `${turno.Paciente.nombre} ${turno.Paciente.apellido}`
                  : `Paciente #${turno.id_paciente}`}
              </span>
            </div>
            <div>
              <span className="block text-xs text-gray-400 uppercase">DNI</span>
              <span className="font-medium text-gray-700">
                {turno.Paciente?.dni || "S/D"}
              </span>
            </div>
            <div>
              <span className="block text-xs text-gray-400 uppercase">
                Teléfono
              </span>
              <span className="font-medium text-gray-700">
                {turno.Paciente?.telefono || "S/D"}
              </span>
            </div>
          </div>
        </div>

        {/* ─── SECCIÓN 3: PRÁCTICAS REALIZADAS Y OBRAS SOCIALES ─── */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
            <Shield size={18} className="text-[#2eb086]" />
            <span>Prácticas Realizadas y Cobertura</span>
          </h3>
          {cargandoDetalles ? (
            <p className="text-xs text-gray-400 italic">
              Cargando prácticas...
            </p>
          ) : practicasTurno.length === 0 ? (
            <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
              No se registraron prácticas asociadas a este turno (o el turno no
              ha sido atendido aún).
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {practicasTurno.map((pt, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-semibold text-gray-800">
                      {pt.Practica?.nombre_referencia ||
                        `Práctica #${pt.id_practica}`}
                    </span>
                    <span className="block text-xs text-gray-500">
                      Nomenclador: {pt.Practica?.codigo_nomenclador || "S/D"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                      {pt.ObraSocial?.nombre || "Particular / Sin Obra Social"}
                    </span>
                    {pt.Practica?.precio_referencia && (
                      <span className="block text-xs font-medium text-gray-600 mt-1">
                        Ref: $
                        {Number(pt.Practica.precio_referencia).toLocaleString(
                          "es-AR",
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── SECCIÓN 4: NOTAS DE LA CONSULTA ───────────────────── */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
            <FileText size={18} className="text-[#2eb086]" />
            <span>Notas / Observaciones de la Consulta</span>
          </h3>
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-sm text-gray-700 min-h-[60px]">
            {turno.notas_consulta || (
              <span className="text-gray-400 italic">
                Sin notas registradas para este turno.
              </span>
            )}
          </div>
        </div>

        {/* ─── SECCIÓN 5: HISTORIAL DE ESTADOS ───────────────────── */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
            <History size={18} className="text-[#2eb086]" />
            <span>Historial de Estados</span>
          </h3>
          {cargandoDetalles ? (
            <p className="text-xs text-gray-400 italic">
              Cargando historial...
            </p>
          ) : historial.length === 0 ? (
            <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
              No hay registros en el historial de este turno.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {historial.map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 text-sm"
                >
                  <div className="p-1.5 rounded-lg bg-white border border-gray-200 text-[#2eb086] mt-0.5">
                    <Clock size={14} />
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="font-semibold text-gray-800">
                        {h.EstadoTurno?.estado ||
                          h.descripcion ||
                          `Estado #${h.id_estado}`}
                      </span>
                      {h.descripcion && h.EstadoTurno?.estado && (
                        <p className="text-xs text-gray-500">{h.descripcion}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      {formatFechaHoraTabla(h.fecha_hora_cambio)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Separador inferior y botón de cierre */}
      <div className="border-t border-gray-200 mt-6 pt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] transition-all shadow-sm font-semibold text-sm"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
