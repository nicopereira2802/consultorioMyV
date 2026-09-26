import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DentalLogo from '../assets/DentalLogo';
import { api, extractDataArray } from '../services/api';
import { X, Calendar, AlertCircle } from 'lucide-react';

export default function PatientsList({ 
  pacientes = [], 
  turnos = [], 
  onBack, 
  onNavigateToRegistrarPaciente,
  onScheduleTurnoForPatient
}) {
  const navigate = useNavigate();
  const [pacientesList, setPacientesList] = useState(pacientes);
  const [turnosList, setTurnosList] = useState(turnos);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);

  useEffect(() => {
    let isMounted = true;
    api.get('/pacientes')
      .then((res) => {
        if (isMounted) {
          setPacientesList(extractDataArray(res));
        }
      })
      .catch((err) => console.error('Error al cargar pacientes:', err));

    api.get('/turnos')
      .then((res) => {
        if (isMounted) {
          setTurnosList(extractDataArray(res));
        }
      })
      .catch((err) => console.error('Error al cargar turnos:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter patients
  const filteredPacientes = useMemo(() => {
    if (!searchTerm.trim()) return pacientesList;
    const q = searchTerm.toLowerCase();
    return pacientesList.filter((p) => {
      const full = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
      const dni = (p.dni || '').toLowerCase();
      return full.includes(q) || dni.includes(q);
    });
  }, [pacientesList, searchTerm]);

  // Turnos for the selected patient
  const patientTurnos = useMemo(() => {
    if (!selectedPatientForHistory) return [];
    return turnosList.filter(t => t.id_paciente === selectedPatientForHistory.id_paciente);
  }, [selectedPatientForHistory, turnosList]);

  return (
    <div className="w-full">
      {/* Top Header Card Bar matching Image 3 */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3.5">
          <DentalLogo className="w-11 h-11" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Pacientes
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack || (() => navigate('/turnos'))}
            className="px-8 py-2.5 bg-[#F87171] hover:bg-[#EF4444] text-white font-medium rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer text-base sm:text-lg"
          >
            Volver
          </button>
          <button
            onClick={onNavigateToRegistrarPaciente || (() => navigate('/pacientes/nuevo'))}
            className="px-6 py-2.5 bg-[#A7F3D0] hover:bg-[#86EFAC] text-gray-900 font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer text-base sm:text-lg whitespace-nowrap"
          >
            Registrar nuevo
          </button>
        </div>
      </div>

      {/* Search Row */}
      <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
        <label className="text-lg sm:text-xl font-medium text-gray-900 text-left">
          Buscar:
        </label>
        <div className="flex-1 max-w-2xl">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='“12345678” o “Gomez”...'
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-base shadow-2xs text-center sm:text-left"
          />
        </div>
        <button
          onClick={() => {}}
          className="px-7 py-2.5 bg-[#2EAF85] hover:bg-[#259772] text-white font-medium rounded-xl shadow-xs transition-all text-base cursor-pointer self-start sm:self-auto"
        >
          Buscar
        </button>
      </div>

      {/* Table matching Image 3 */}
      <div className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Table Header with gray background */}
            <thead>
              <tr className="bg-[#9CA3AF] text-gray-900 font-bold text-sm sm:text-base">
                <th className="py-3 px-4 sm:px-6 text-center">DNI</th>
                <th className="py-3 px-4 sm:px-6 text-center">Nombre</th>
                <th className="py-3 px-4 sm:px-6 text-center">Saldo</th>
                <th className="py-3 px-4 sm:px-6 text-center">Obra Social</th>
                <th className="py-3 px-4 sm:px-6 text-center">Turnos</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredPacientes.length > 0 ? (
                filteredPacientes.map((paciente) => {
                  const obraSocialNombre = 
                    paciente.PacienteObraSocials?.[0]?.ObraSocial?.nombre || 
                    paciente.obra_social_nombre || 
                    'Particular';

                  const saldoDisplay = paciente.saldo || '-$0.00';

                  return (
                    <tr 
                      key={paciente.id_paciente}
                      className="hover:bg-gray-50/80 transition-colors text-sm sm:text-base text-gray-800"
                    >
                      <td className="py-4 px-4 sm:px-6 text-center font-medium">
                        {paciente.dni || '12345678'}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center font-medium">
                        {paciente.nombre} {paciente.apellido}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center text-gray-700 font-medium">
                        {saldoDisplay}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center font-medium text-gray-700">
                        {obraSocialNombre}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <button
                          onClick={() => setSelectedPatientForHistory(paciente)}
                          className="px-5 py-2 bg-[#2EAF85] hover:bg-[#259772] text-white font-medium rounded-lg text-sm transition-all shadow-2xs active:scale-95 cursor-pointer"
                        >
                          Historial
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">
                    No se encontraron pacientes con ese criterio de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial Modal */}
      {selectedPatientForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-900">
                  Historial de Turnos
                </h3>
                <p className="text-sm text-teal-700 font-medium">
                  {selectedPatientForHistory.nombre} {selectedPatientForHistory.apellido} — DNI {selectedPatientForHistory.dni || 'S/D'}
                </p>
              </div>
              <button
                onClick={() => setSelectedPatientForHistory(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="my-4 max-h-72 overflow-y-auto space-y-3">
              {patientTurnos.length > 0 ? (
                patientTurnos.map((t) => {
                  const inicio = t.fecha_hora_inicio ? new Date(t.fecha_hora_inicio).toLocaleString('es-AR') : 'Fecha no definida';
                  const estadoMap = { 1: 'Programado', 2: 'Cancelado', 3: 'Atendido', 4: 'Inasistente', 5: 'Reprogramado' };
                  const estado = t.EstadoTurno?.estado || estadoMap[t.id_estado] || 'Programado';
                  return (
                    <div key={t.id_turno} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm">
                          <Calendar className="w-4 h-4 text-teal-600" />
                          {inicio}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          estado === 'Atendido' ? 'bg-blue-100 text-blue-800' :
                          estado === 'Cancelado' ? 'bg-red-100 text-red-800' :
                          estado === 'Inasistente' ? 'bg-gray-100 text-gray-800' :
                          estado === 'Reprogramado' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {estado}
                        </span>
                      </div>
                      {t.notas_consulta && (
                        <p className="text-xs text-gray-600 mt-2">
                          <strong>Notas:</strong> {t.notas_consulta}
                        </p>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        Precio: ${t.precio_final || '0.00'}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                  Este paciente aún no tiene turnos registrados.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setSelectedPatientForHistory(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  const pid = selectedPatientForHistory.id_paciente;
                  setSelectedPatientForHistory(null);
                  if (onScheduleTurnoForPatient) {
                    onScheduleTurnoForPatient(pid);
                  } else {
                    navigate('/turnos/nuevo', { state: { pacienteId: pid } });
                  }
                }}
                className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium cursor-pointer"
              >
                Registrar Turno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
