import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import CalendarView from './components/CalendarView';
import TurnoRegistration from './components/TurnoRegistration';
import PatientsList from './components/PatientsList';
import PatientRegistration from './components/PatientRegistration';
import NavigationDrawer from './components/NavigationDrawer';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const location = useLocation();

  // Escuchar mensajes pasados por navigate(..., { state: { message: '...' } })
  useEffect(() => {
    const msg = location.state?.message;
    if (msg) {
      window.history.replaceState({}, document.title);
      const showTimer = setTimeout(() => {
        setToastMessage(msg);
      }, 0);
      const hideTimer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [location.state?.message]);

  return (
    <Layout>
      {/* Notificación Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl font-medium text-sm animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Menú de navegación lateral */}
      <NavigationDrawer
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
      />

      {/* Definición de rutas */}
      <Routes>
        <Route path="/" element={<Navigate to="/turnos" replace />} />
        <Route
          path="/turnos"
          element={<CalendarView onOpenMenu={() => setIsNavOpen(true)} />}
        />
        <Route
          path="/turnos/nuevo"
          element={<TurnoRegistration />}
        />
        <Route
          path="/pacientes"
          element={<PatientsList />}
        />
        <Route
          path="/pacientes/nuevo"
          element={<PatientRegistration />}
        />
        <Route path="*" element={<Navigate to="/turnos" replace />} />
      </Routes>
    </Layout>
  );
}
