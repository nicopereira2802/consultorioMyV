import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import CalendarView from './components/CalendarView';
import TurnoRegistration from './components/TurnoRegistration';
import PatientsList from './components/PatientsList';
import PatientRegistration from './components/PatientRegistration';
import NavigationDrawer from './components/NavigationDrawer';
import { api } from './services/api';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('calendar'); // 'calendar' | 'registrar-turno' | 'pacientes' | 'registrar-paciente'
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [turnos, setTurnos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [obrasSociales, setObrasSociales] = useState([]);
  const [selectedDateForTurno, setSelectedDateForTurno] = useState('2026-09-20');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load all real data from backend (no default / fake data)
  const loadData = useCallback(async () => {
    try {
      const [turnosData, pacientesData, obrasData] = await Promise.all([
        api.getTurnos(),
        api.getPacientes(),
        api.getObrasSociales(),
      ]);
      setTurnos(turnosData);
      setPacientes(pacientesData);
      setObrasSociales(obrasData);
    } catch (err) {
      console.error('Error cargando datos del backend:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigate handler
  const handleNavigate = (view) => {
    setCurrentView(view);
    setIsNavOpen(false);
  };

  return (
    <Layout>
      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl font-medium text-sm animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hamburger Navigation Drawer */}
      <NavigationDrawer
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* Views */}
      {currentView === 'calendar' && (
        <CalendarView
          turnos={turnos}
          onOpenMenu={() => setIsNavOpen(true)}
          onNavigateToRegistrarTurno={() => {
            setSelectedDateForTurno('2026-09-20');
            setCurrentView('registrar-turno');
          }}
        />
      )}

      {currentView === 'registrar-turno' && (
        <TurnoRegistration
          pacientes={pacientes}
          turnos={turnos}
          initialDate={selectedDateForTurno}
          onCancel={() => setCurrentView('calendar')}
          onSuccess={() => {
            loadData();
            showToast('¡Turno registrado exitosamente!');
            setCurrentView('calendar');
          }}
          onNavigateToRegistrarPaciente={() => setCurrentView('registrar-paciente')}
        />
      )}

      {currentView === 'pacientes' && (
        <PatientsList
          pacientes={pacientes}
          turnos={turnos}
          onBack={() => setCurrentView('calendar')}
          onNavigateToRegistrarPaciente={() => setCurrentView('registrar-paciente')}
          onScheduleTurnoForPatient={(pacienteId) => {
            setSelectedDateForTurno('2026-09-20');
            setCurrentView('registrar-turno');
          }}
        />
      )}

      {currentView === 'registrar-paciente' && (
        <PatientRegistration
          obrasSociales={obrasSociales}
          onBack={() => setCurrentView('pacientes')}
          onSuccess={() => {
            loadData();
            showToast('¡Paciente registrado exitosamente!');
            setCurrentView('pacientes');
          }}
        />
      )}
    </Layout>
  );
}
