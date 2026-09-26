import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Plus, Clock, User, Phone, FileText, DollarSign, X, AlertCircle, CheckCircle, Ban } from 'lucide-react';
import DentalLogo from '../assets/DentalLogo';
import { api, extractDataArray, extractErrorMessage } from '../services/api';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const ESTADOS_MAP = {
  1: 'Programado',
  2: 'Cancelado',
  3: 'Atendido',
  4: 'Inasistente',
  5: 'Reprogramado'
};

export default function CalendarView({
  turnos = [],
  onOpenMenu,
  onNavigateToRegistrarTurno
}) {
  const navigate = useNavigate();
  const [turnosList, setTurnosList] = useState(turnos);
  const [pacientesList, setPacientesList] = useState([]);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusActionMessage, setStatusActionMessage] = useState('');

  const goToRegistrarTurno = onNavigateToRegistrarTurno || (() => navigate('/turnos/nuevo'));

  // Cargar turnos y pacientes del backend
  const loadData = useCallback(() => {
    Promise.allSettled([
      api.get('/turnos'),
      api.get('/pacientes')
    ]).then(([turnosRes, pacRes]) => {
      if (turnosRes.status === 'fulfilled') {
        setTurnosList(extractDataArray(turnosRes.value));
      }
      if (pacRes.status === 'fulfilled') {
        setPacientesList(extractDataArray(pacRes.value));
      }
    }).catch((err) => console.error('Error al cargar datos en CalendarView:', err));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pacientesMap = useMemo(() => {
    const map = {};
    pacientesList.forEach((p) => {
      map[p.id_paciente] = p;
    });
    return map;
  }, [pacientesList]);

  // Cambiar estado de turno (atender / cancelar / inasistente)
  const handleCambiarEstado = async (idTurno, accion) => {
    setIsUpdatingStatus(true);
    setStatusActionMessage('');
    try {
      if (accion === 'cancelar') {
        await api.patch(`/turnos/${idTurno}/cancelar`);
      } else if (accion === 'atender') {
        await api.patch(`/turnos/${idTurno}/atender`, {
          notas_consulta: 'Atención completada',
          practicas_realizadas: []
        });
      } else if (accion === 'inasistente') {
        await api.patch(`/turnos/${idTurno}/inasistente`);
      }
      loadData();
      setSelectedEventForDetail(null);
    } catch (err) {
      setStatusActionMessage(extractErrorMessage(err, 'No se pudo actualizar el estado del turno'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3.5">
          {/* Hamburger Menu button */}
          <button
            onClick={onOpenMenu}
            className="p-2 -ml-1 text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors cursor-pointer"
            title="Abrir menú"
          >
            <Menu className="w-7 h-7" />
          </button>

          {/* Dental Logo */}
          <DentalLogo className="w-11 h-11" />

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Calendario
          </h1>
        </div>

        {/* Botón Agregar Turno (reemplaza al botón Volver) */}
        <button
          onClick={goToRegistrarTurno}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#2EAF85] hover:bg-[#259772] text-white font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer text-base sm:text-lg"
          title="Agregar nuevo turno"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Agregar turno</span>
        </button>
      </div>

      {/* Main Content Body */}
      <div className="pt-6 sm:pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 text-left">
            Listado de Turnos
          </h2>
          <span className="text-sm font-medium text-gray-500">
            Total: {turnosList.length} turnos
          </span>
        </div>

        {/* List Table: Fecha -> Hora -> Paciente -> Estado -> Detalle */}
        {turnosList.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-2xs bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Hora</th>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {turnosList.map((t) => {
                  const paciente = t.Paciente || pacientesMap[t.id_paciente];
                  const pacienteNombre = paciente
                    ? `${paciente.nombre} ${paciente.apellido}`
                    : `Paciente #${t.id_paciente}`;
                  const estado = t.EstadoTurno?.estado || ESTADOS_MAP[t.id_estado] || 'Programado';
                  const fechaStr = formatDate(t.fecha_hora_inicio);
                  const horaStr = t.fecha_hora_fin
                    ? `${formatTime(t.fecha_hora_inicio)} - ${formatTime(t.fecha_hora_fin)} hs`
                    : `${formatTime(t.fecha_hora_inicio)} hs`;

                  return (
                    <tr key={t.id_turno} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                        {fechaStr}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-700 whitespace-nowrap">
                        {horaStr}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {pacienteNombre}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          estado === 'Atendido' ? 'bg-blue-100 text-blue-800' :
                          estado === 'Cancelado' ? 'bg-red-100 text-red-800' :
                          estado === 'Inasistente' ? 'bg-gray-100 text-gray-800' :
                          estado === 'Reprogramado' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {estado}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setStatusActionMessage('');
                            setSelectedEventForDetail({
                              ...t,
                              Paciente: paciente,
                              EstadoTurno: { estado }
                            });
                          }}
                          className="px-3.5 py-1.5 bg-[#2EAF85] hover:bg-[#259772] text-white rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center bg-gray-50 rounded-xl border border-gray-200 text-gray-500 flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 text-gray-400" />
            <p className="text-base font-medium">No se encontraron turnos registrados.</p>
            <button
              onClick={goToRegistrarTurno}
              className="mt-2 px-5 py-2 bg-[#2EAF85] hover:bg-[#259772] text-white font-medium rounded-xl text-sm shadow-xs cursor-pointer"
            >
              Registrar nuevo turno
            </button>
          </div>
        )}
      </div>

      {/* Custom Event Detail Modal */}
      {selectedEventForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <DentalLogo className="w-8 h-8" />
                <h3 className="text-lg font-bold text-gray-900">
                  Detalles del Turno
                </h3>
              </div>
              <button
                onClick={() => setSelectedEventForDetail(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusActionMessage && (
              <div className="mt-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                {statusActionMessage}
              </div>
            )}

            <div className="my-4 space-y-3">
              <div className="flex items-center gap-2 text-gray-900 font-semibold text-base">
                <User className="w-5 h-5 text-teal-600" />
                <span>
                  {selectedEventForDetail.Paciente
                    ? `${selectedEventForDetail.Paciente.nombre} ${selectedEventForDetail.Paciente.apellido}`
                    : `Turno #${selectedEventForDetail.id_turno}`}
                </span>
              </div>

              {selectedEventForDetail.Paciente && (
                <div className="text-sm text-gray-600 pl-7 space-y-1">
                  {selectedEventForDetail.Paciente.dni && (
                    <p>DNI: {selectedEventForDetail.Paciente.dni}</p>
                  )}
                  {selectedEventForDetail.Paciente.telefono && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {selectedEventForDetail.Paciente.telefono}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-700 pt-2 border-t border-gray-100">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>
                  {formatDate(selectedEventForDetail.fecha_hora_inicio)} | {formatTime(selectedEventForDetail.fecha_hora_inicio)} - {formatTime(selectedEventForDetail.fecha_hora_fin)} hs
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-semibold text-gray-700">Estado:</span>
                <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  selectedEventForDetail.EstadoTurno?.estado === 'Atendido' ? 'bg-blue-100 text-blue-800' :
                  selectedEventForDetail.EstadoTurno?.estado === 'Cancelado' ? 'bg-red-100 text-red-800' :
                  selectedEventForDetail.EstadoTurno?.estado === 'Inasistente' ? 'bg-gray-100 text-gray-800' :
                  selectedEventForDetail.EstadoTurno?.estado === 'Reprogramado' ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {selectedEventForDetail.EstadoTurno?.estado || 'Programado'}
                </span>
              </div>

              {selectedEventForDetail.notas_consulta && (
                <div className="flex items-start gap-2 text-sm text-gray-600 pt-1">
                  <FileText className="w-4 h-4 text-teal-600 mt-0.5" />
                  <span>{selectedEventForDetail.notas_consulta}</span>
                </div>
              )}

              {selectedEventForDetail.precio_final && (
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Precio: ${selectedEventForDetail.precio_final}</span>
                </div>
              )}
            </div>

            {/* Acciones de estado si el turno está Programado */}
            {selectedEventForDetail.EstadoTurno?.estado === 'Programado' && (
              <div className="py-3 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleCambiarEstado(selectedEventForDetail.id_turno, 'atender')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Marcar Atendido</span>
                </button>
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleCambiarEstado(selectedEventForDetail.id_turno, 'cancelar')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedEventForDetail(null)}
                className="px-5 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
