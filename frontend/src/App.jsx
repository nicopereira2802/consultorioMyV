import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AgendaDiaria from './pages/AgendaDiaria';
import GestionPacientes from './pages/GestionPacientes';
import CatalogoPracticas from './pages/CatalogoPracticas';
import GestionCobros from './pages/GestionCobros';
import BottomNav from './components/BottomNav';
import { useSwipeNavigation } from './hooks/useSwipeNavigation';

/**
 * App - Enrutador Principal Operativo (Sprint 1)
 * Conecta todas las pantallas operativas de M&V Turnos sin barreras de autenticación.
 */
function App() {
  // Habilitar navegación gestual (swipe horizontal) entre módulos en móviles
  useSwipeNavigation();

  useEffect(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      const timer = setTimeout(() => {
        splash.classList.add('oculto');
        setTimeout(() => splash.remove(), 400);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/agenda" replace />} />

        <Route path="/agenda" element={<AgendaDiaria />} />

        <Route path="/atencion" element={<Navigate to="/agenda" replace />} />
        <Route path="/atencion/:idTurno" element={<Navigate to="/agenda" replace />} />

        <Route path="/pacientes" element={<GestionPacientes />} />
        <Route path="/pacientes/nuevo" element={<Navigate to="/pacientes" replace />} />
        <Route path="/registrar-paciente" element={<Navigate to="/pacientes" replace />} />

        <Route path="/practicas" element={<CatalogoPracticas />} />

        <Route path="/cobros" element={<GestionCobros />} />
        <Route path="/pagos" element={<Navigate to="/cobros" replace />} />
        <Route path="/registro-cobros" element={<Navigate to="/cobros" replace />} />

        <Route path="*" element={<Navigate to="/agenda" replace />} />
      </Routes>

      <BottomNav />
    </>
  );
}

export default App;