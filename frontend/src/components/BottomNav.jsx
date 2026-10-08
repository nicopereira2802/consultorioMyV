import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BottomNav.css';


export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState('');

  const currentPath = location.pathname;

  const isAgendaActive = currentPath.startsWith('/agenda') || currentPath.startsWith('/atencion');
  const isPacientesActive = currentPath.startsWith('/pacientes') || currentPath === '/registrar-paciente';
  const isPracticasActive = currentPath.startsWith('/practicas');

  const mostrarToast = (mensaje = 'No disponible') => {
    setToastMsg(mensaje);
    setTimeout(() => {
      setToastMsg('');
    }, 2500);
  };

  return (
    <>
      {toastMsg && (
        <aside
          className="bottom-nav-toast"
          role="status"
          aria-live="polite"
        >
          {toastMsg}
        </aside>
      )}

      <nav className="bottom-nav" aria-label="Navegación inferior móvil M&V">
        <button
          type="button"
          className="bottom-nav-item"
          onClick={() => mostrarToast('No disponible')}
          aria-label="Pagos y Cobros"
          title="Pagos y Cobros"
        >
          <div className="bottom-nav-icon-container">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </button>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={() => mostrarToast('No disponible')}
          aria-label="Nuevo Turno"
          title="Nuevo Turno"
        >
          <div className="bottom-nav-icon-container">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          </div>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${isAgendaActive ? 'active' : ''}`}
          onClick={() => navigate('/agenda')}
          aria-label="Agenda Diaria"
          title="Agenda Diaria"
        >
          <div className="bottom-nav-icon-container">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <circle cx="8" cy="14" r="1" fill="#ffffff" stroke="none" />
              <circle cx="12" cy="14" r="1" fill="#ffffff" stroke="none" />
              <circle cx="16" cy="14" r="1" fill="#ffffff" stroke="none" />
              <circle cx="8" cy="18" r="1" fill="#ffffff" stroke="none" />
              <circle cx="12" cy="18" r="1" fill="#ffffff" stroke="none" />
              <circle cx="16" cy="18" r="1" fill="#ffffff" stroke="none" />
            </svg>
          </div>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${isPacientesActive ? 'active' : ''}`}
          onClick={() => navigate('/pacientes')}
          aria-label="Gestión de Pacientes"
          title="Gestión de Pacientes"
        >
          <div className="bottom-nav-icon-container">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${isPracticasActive ? 'active' : ''}`}
          onClick={() => navigate('/practicas')}
          aria-label="Catálogo de Prácticas"
          title="Catálogo de Prácticas"
        >
          <div className="bottom-nav-icon-container">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
        </button>
      </nav>
    </>
  );
};

export const Navegacion = BottomNav;
export default BottomNav;
