import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DentalLogo from '../assets/DentalLogo';
import { api, extractDataArray, extractErrorMessage } from '../services/api';
import { AlertCircle, Clock, User, Phone, FileText, DollarSign, X } from 'lucide-react';

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

export default function TurnoRegistration({
  pacientes = [],
  turnos = [],
  onCancel,
  onSuccess,
  onNavigateToRegistrarPaciente,
  initialDate
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [turnosList, setTurnosList] = useState(turnos);
  const [pacientesList, setPacientesList] = useState(pacientes);

  const [pacienteSearch, setPacienteSearch] = useState('');
  const [selectedPacienteId, setSelectedPacienteId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Por defecto, fecha actual (no en el pasado para cumplir con el esquema Zod)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(initialDate || todayStr);
  const [hour, setHour] = useState(10);
  const [minutes, setMinutes] = useState(0);
  const [modulos, setModulos] = useState(1);
  const [precioFinal, setPrecioFinal] = useState(15000);
  const [notasConsulta, setNotasConsulta] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedEventForDetail, setSelectedEventForDetail] = useState(null);

  // Cargar datos iniciales del backend
  const loadAllData = useCallback(() => {
    Promise.allSettled([
      api.get('/pacientes'),
      api.get('/turnos')
    ]).then(([pacRes, turnosRes]) => {
      if (pacRes.status === 'fulfilled') {
        const pList = extractDataArray(pacRes.value);
        setPacientesList(pList);
        const passedId = location.state?.pacienteId;
        if (passedId) {
          const found = pList.find((p) => p.id_paciente === passedId);
          if (found) {
            setSelectedPacienteId(found.id_paciente);
            setPacienteSearch(`${found.nombre} ${found.apellido} (DNI: ${found.dni || 'S/D'})`);
          }
        }
      }
      if (turnosRes.status === 'fulfilled') {
        setTurnosList(extractDataArray(turnosRes.value));
      }
    }).catch((err) => console.error('Error al cargar datos en TurnoRegistration:', err));
  }, [location.state]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const pacientesMap = useMemo(() => {
    const map = {};
    pacientesList.forEach((p) => {
      map[p.id_paciente] = p;
    });
    return map;
  }, [pacientesList]);

  // Filtrar pacientes
  const filteredPacientes = useMemo(() => {
    if (!pacienteSearch.trim()) return pacientesList;
    const query = pacienteSearch.toLowerCase();
    return pacientesList.filter((p) => {
      const fullName = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
      const dni = String(p.dni || '').toLowerCase();
      return fullName.includes(query) || dni.includes(query);
    });
  }, [pacienteSearch, pacientesList]);

  // Seleccionar paciente
  const handleSelectPaciente = (paciente) => {
    setSelectedPacienteId(paciente.id_paciente);
    setPacienteSearch(`${paciente.nombre} ${paciente.apellido} (DNI: ${paciente.dni || 'S/D'})`);
    setIsDropdownOpen(false);
    setErrorMessage('');
  };

  // Ajustar hora
  const adjustTime = (deltaMinutes) => {
    let totalMinutes = hour * 60 + minutes + deltaMinutes;
    if (totalMinutes < 8 * 60) totalMinutes = 8 * 60;
    if (totalMinutes > 20 * 60) totalMinutes = 20 * 60;
    setHour(Math.floor(totalMinutes / 60));
    setMinutes(totalMinutes % 60);
  };

  // Ajustar módulos (cada módulo = 40 minutos)
  const adjustModulos = (delta) => {
    setModulos((prev) => {
      const nuevo = Math.max(1, Math.min(10, prev + delta));
      setPrecioFinal(nuevo * 15000);
      return nuevo;
    });
  };

  const formattedTime = `${hour}:${minutes === 0 ? '00' : String(minutes).padStart(2, '0')}`;
  const duracionMinutos = modulos * 40;

  // Confirmar registro de turno según los requisitos del backend Zod schema
  const handleConfirmar = async () => {
    if (!selectedPacienteId) {
      setErrorMessage('Por favor seleccione un paciente de la lista o regístrelo.');
      return;
    }

    if (!selectedDate) {
      setErrorMessage('Por favor seleccione una fecha para el turno.');
      return;
    }

    const pad = (n) => String(n).padStart(2, '0');
    const startDateTime = `${selectedDate}T${pad(hour)}:${pad(minutes)}:00`;
    const startDateObj = new Date(startDateTime);

    if (startDateObj < new Date(Date.now() - 5 * 60 * 1000)) {
      setErrorMessage('La fecha y hora del turno debe ser posterior al momento actual.');
      return;
    }

    const parsedPrecio = Number(precioFinal);
    if (isNaN(parsedPrecio) || parsedPrecio <= 0) {
      setErrorMessage('El precio final debe ser un número mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Requeridos estrictamente por createTurnoSchema:
      // id_paciente (number, positive int),
      // id_estado (number, positive int -> 1),
      // fecha_hora_inicio (date >= hoy),
      // duracion_minutos (number, positive int),
      // precio_final (number, positive, <= 2 decimals),
      // notas_consulta (string, trim)
      const turnoData = {
        id_paciente: Number(selectedPacienteId),
        id_estado: 1, // 1 = Programado
        fecha_hora_inicio: startDateTime,
        duracion_minutos: Number(duracionMinutos),
        precio_final: Number(parsedPrecio.toFixed(2)),
        notas_consulta: notasConsulta.trim() || 'Consulta odontológica'
      };

      await api.post('/turnos', turnoData);

      // Recargar turnos
      const res = await api.get('/turnos');
      setTurnosList(extractDataArray(res));

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/turnos', { state: { message: '¡Turno registrado exitosamente!' } });
      }
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, 'Error al registrar el turno'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3.5">
          <DentalLogo className="w-11 h-11" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Registrar turno
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel || (() => navigate('/turnos'))}
            className="px-6 py-2.5 bg-[#F87171] hover:bg-[#EF4444] text-white font-medium rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer text-base sm:text-lg"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#A7F3D0] hover:bg-[#86EFAC] text-gray-900 font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer text-base sm:text-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm text-left">
          {errorMessage}
        </div>
      )}

      {/* Main Form Body */}
      <div className="pt-6 sm:pt-8 space-y-6">
        {/* Paciente input row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 relative">
          <label className="text-lg sm:text-xl font-medium text-gray-900 w-28 text-left">
            Paciente:
          </label>

          <div className="relative flex-1 max-w-lg">
            <input
              type="text"
              value={pacienteSearch}
              onChange={(e) => {
                setPacienteSearch(e.target.value);
                setSelectedPacienteId(null);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder='Ej: "Gómez" o "38450123"...'
              className="w-full px-4 py-2.5 rounded-xl border border-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-base shadow-2xs"
            />

            {/* Dropdown with real search results */}
            {isDropdownOpen && filteredPacientes.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto">
                {filteredPacientes.map((p) => (
                  <div
                    key={p.id_paciente}
                    onClick={() => handleSelectPaciente(p)}
                    className="p-3 hover:bg-teal-50 cursor-pointer border-b border-gray-100 last:border-0 flex justify-between items-center text-left"
                  >
                    <div>
                      <span className="font-semibold text-gray-900">{p.nombre} {p.apellido}</span>
                      <span className="text-xs text-gray-500 ml-2">DNI: {p.dni || 'Sin DNI'}</span>
                    </div>
                    <span className="text-xs text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md font-medium">
                      {p.telefono || 'Sin tel.'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onNavigateToRegistrarPaciente || (() => navigate('/pacientes/nuevo'))}
            className="px-5 py-2.5 bg-[#2EAF85] hover:bg-[#259772] text-white font-medium rounded-xl shadow-xs transition-all text-base cursor-pointer self-start sm:self-auto whitespace-nowrap"
          >
            Registrar nuevo
          </button>
        </div>

        {/* Día / Fecha input */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <label className="text-lg sm:text-xl font-medium text-gray-900 w-28 text-left">
            Día:
          </label>
          <input
            type="date"
            value={selectedDate}
            min={todayStr}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="py-2.5 px-4 rounded-xl border border-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-base shadow-2xs max-w-xs bg-white cursor-pointer"
          />
        </div>

        {/* Precio Final (requerido por el esquema Zod del backend) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <label className="text-lg sm:text-xl font-medium text-gray-900 w-28 text-left">
            Precio ($):
          </label>
          <div className="relative max-w-xs w-full">
            <span className="absolute left-3.5 top-2.5 text-gray-500 font-semibold">$</span>
            <input
              type="number"
              step="0.01"
              min="1"
              value={precioFinal}
              onChange={(e) => setPrecioFinal(e.target.value)}
              placeholder="15000.00"
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-base shadow-2xs"
            />
          </div>
        </div>

        {/* Notas / Motivo de consulta */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <label className="text-lg sm:text-xl font-medium text-gray-900 w-28 text-left">
            Notas:
          </label>
          <input
            type="text"
            value={notasConsulta}
            onChange={(e) => setNotasConsulta(e.target.value)}
            placeholder="Motivo o notas de la consulta..."
            className="flex-1 max-w-lg px-4 py-2.5 rounded-xl border border-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-base shadow-2xs"
          />
        </div>

        {/* Listado de Turnos Registrados en TurnoRegistration */}
        {/* Orden requerido: Fecha -> Hora -> Paciente (Nombre y Apellido) -> Estado -> Ver Detalle */}
        <div className="space-y-3 text-left pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              Turnos Registrados:
            </h2>
            <span className="text-xs font-semibold text-gray-500">
              Total: {turnosList.length} turnos
            </span>
          </div>

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
                            type="button"
                            onClick={() => setSelectedEventForDetail({
                              ...t,
                              Paciente: paciente,
                              EstadoTurno: { estado }
                            })}
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
            </div>
          )}
        </div>

        {/* Bottom controls: Hora de Inicio & N° de módulos / Duración */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Hora de Inicio */}
          <div className="flex items-center gap-3">
            <span className="text-base sm:text-lg font-medium text-gray-900 w-32 sm:w-36 text-left">
              Hora de Inicio:
            </span>
            <div className="w-28 py-2 px-3 bg-white rounded-xl border border-gray-300 text-center text-lg font-semibold text-gray-700 shadow-2xs">
              {formattedTime}
            </div>
            <button
              type="button"
              onClick={() => adjustTime(-30)}
              className="w-9 h-9 bg-[#F87171] hover:bg-[#EF4444] text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all shadow-2xs active:scale-90 cursor-pointer"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => adjustTime(30)}
              className="w-9 h-9 bg-[#A7F3D0] hover:bg-[#86EFAC] text-gray-900 rounded-lg flex items-center justify-center font-bold text-xl transition-all shadow-2xs active:scale-90 cursor-pointer"
            >
              +
            </button>
          </div>

          {/* N° de módulos / Duración en minutos */}
          <div className="flex items-center gap-3">
            <span className="text-base sm:text-lg font-medium text-gray-900 w-32 sm:w-36 text-left">
              Módulos ({duracionMinutos} min):
            </span>
            <div className="w-28 py-2 px-3 bg-white rounded-xl border border-gray-300 text-center text-lg font-semibold text-gray-700 shadow-2xs">
              {modulos} ({duracionMinutos}m)
            </div>
            <button
              type="button"
              onClick={() => adjustModulos(-1)}
              className="w-9 h-9 bg-[#F87171] hover:bg-[#EF4444] text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all shadow-2xs active:scale-90 cursor-pointer"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => adjustModulos(1)}
              className="w-9 h-9 bg-[#A7F3D0] hover:bg-[#86EFAC] text-gray-900 rounded-lg flex items-center justify-center font-bold text-xl transition-all shadow-2xs active:scale-90 cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalle de Turno */}
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
                type="button"
                onClick={() => setSelectedEventForDetail(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
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
