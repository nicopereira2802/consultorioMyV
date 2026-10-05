import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DentalLogo from '../assets/DentalLogo';
import NavigationDrawer from './NavigationDrawer';
import { api, extractDataArray } from '../services/api';
import { X, Calendar, AlertCircle, Search, Loader2, Menu, Plus } from 'lucide-react';

export default function PatientsList({ 
  onNavigateToRegistrarPaciente,
  onScheduleTurnoForPatient
}) {
  const navigate = useNavigate();

  // --- ESTADO DEL MENÚ LATERAL ---
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // --- ESTADOS LOCALES ---
  // Con esto guardo las listas traídas de la API, el término buscado y estados de UI (carga y modal)
  const [pacientesList, setPacientesList] = useState([]);
  const [turnosList, setTurnosList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);

  // --- PETICIÓN A LA API ---
  // Recibo pacientes filtrados o la lista completa según la búsqueda.
  // La funcion esta usando useCallback para mantener la misma referencia de función en los useEffect.
  const fetchPacientes = useCallback(async (searchQuery = '') => {
    setLoading(true);
    try {
      const q = searchQuery.trim();
      const endpoint = q ? `/pacientes?search=${encodeURIComponent(q)}` : '/pacientes';
      const res = await api.get(endpoint);
      setPacientesList(extractDataArray(res));
    } catch (err) {
      console.error('Error al cargar pacientes desde el backend:', err);
      setPacientesList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- CARGA INICIAL DE PACIENTES ---
  useEffect(() => {
    let isMounted = true;
    fetchPacientes('');

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
  }, [fetchPacientes]);

  // --- BÚSQUEDA AUTOMÁTICA ---
  //300ms de espera, podemos reducirlo si lo necesitamos.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPacientes(searchTerm);
    }, 300);

    return () => clearTimeout(timer); 
  }, [searchTerm, fetchPacientes]);

  // Manejador del submit del formulario
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPacientes(searchTerm);
  };

  // Para limpiar el input de la barra
  const handleClearSearch = () => {
    setSearchTerm('');
    fetchPacientes('');
  };

  // --- FILTRADO DE TURNOS DEL PACIENTE ---
  // Filtra de la lista de turnos únicamente los pertenecientes al paciente.
  const patientTurnos = useMemo(() => {
    if (!selectedPatientForHistory) return [];
    return turnosList.filter(
      (t) => (t.id_paciente || t.paciente_id) === (selectedPatientForHistory.id_paciente || selectedPatientForHistory.id)
    );
  }, [selectedPatientForHistory, turnosList]);

  return (
    <div className="w-full">
      {/* Drawer desplegable integrado directamente en la vista */}
      <NavigationDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />

      {/* BARRA SUPERIOR */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* Botón de Menú Hamburguesa */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>

          <DentalLogo className="w-9 h-9" />
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Pacientes
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToRegistrarPaciente || (() => navigate('/pacientes/nuevo'))}
            className="px-4 py-2 bg-[#2EAF85] hover:bg-[#259772] text-white font-medium rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer text-sm sm:text-base flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Registrar paciente
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA  */}
      <form onSubmit={handleSearchSubmit} className="pt-6 sm:pt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
        <label htmlFor="search-paciente-input" className="text-lg sm:text-xl font-medium text-gray-900 text-left">
          Buscar:
        </label>
        
        <div className="flex-1 max-w-2xl relative">
          <input
            id="search-paciente-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='“12345678” o “Gomez” o "3511234567"' 
            className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-base shadow-2xs text-left"
          />

          {loading ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-600">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : searchTerm ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              title="Borrar término de búsqueda"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-7 py-2.5 bg-[#2EAF85] hover:bg-[#259772] disabled:opacity-50 text-white font-medium rounded-xl shadow-xs transition-all text-base cursor-pointer self-start sm:self-auto flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {/* TABLA PRINCIPAL DE PACIENTES */}
      <div className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* Encabezados de la tabla*/}
              <tr className="bg-[#9CA3AF] text-gray-900 font-bold text-sm sm:text-base">
                <th className="py-3 px-4 sm:px-6 text-center">DNI</th>
                <th className="py-3 px-4 sm:px-6 text-center">Nombre</th>
                <th className="py-3 px-4 sm:px-6 text-center">Teléfono</th>
                <th className="py-3 px-4 sm:px-6 text-center">Saldo</th>
                <th className="py-3 px-4 sm:px-6 text-center">Obra Social</th>
                <th className="py-3 px-4 sm:px-6 text-center">Turnos</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {/* Cargando resultados */}
              {loading && pacientesList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-teal-700 text-sm">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Cargando pacientes desde el servidor...
                  </td>
                </tr>
              ) : pacientesList.length > 0 ? (
                /* Renderizado de la lista de pacientes */
                pacientesList.map((paciente) => {
                  // Mapeo de Obra Social según el formato de la base de datos
                  const obraSocialNombre = 
                    paciente.obra_social_nombre || 
                    paciente.obraSocial || 
                    paciente.PacienteObraSocials?.[0]?.ObraSocial?.nombre || 
                    'Particular';

                  const saldoDisplay = paciente.saldo || '-$0.00';
                  // Mapeo del teléfono
                  const telefonoDisplay = paciente.telefono || paciente.telefono_contacto || 'S/T';

                  return (
                    <tr 
                      key={paciente.id_paciente || paciente.id || paciente.dni}
                      className="hover:bg-gray-50/80 transition-colors text-sm sm:text-base text-gray-800"
                    >
                      <td className="py-4 px-4 sm:px-6 text-center font-medium">
                        {paciente.dni || 'S/DNI'}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center font-medium">
                        {paciente.nombre} {paciente.apellido}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center font-medium text-gray-700">
                        {telefonoDisplay}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center text-gray-700 font-medium">
                        {saldoDisplay}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center font-medium text-gray-700">
                        {obraSocialNombre}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <button
                          type="button"
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
                /* En caso de no encontrar resultados */
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500 text-sm">
                    {searchTerm 
                      ? `No se encontraron pacientes para "${searchTerm}".`
                      : 'No hay pacientes registrados en el sistema.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Turnos del Paciente Seleccionado (es una beta aún) */}
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
                type="button"
                onClick={() => setSelectedPatientForHistory(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Lista de Turnos */}
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

            {/* Botones de Cierre y Registro de Turno */}
            <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedPatientForHistory(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const pid = selectedPatientForHistory.id_paciente || selectedPatientForHistory.id;
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