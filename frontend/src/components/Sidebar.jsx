import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import ToothLogo from './ToothLogo';
import './Sidebar.css';

/**
 * Sidebar - Menú lateral desplegable off-canvas para navegación general M&V Turnos
 *
 * @param {boolean} isOpen - Estado de visibilidad del drawer
 * @param {function} onClose - Callback para cerrar el drawer
 */
export const Sidebar = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'is-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`sidebar-drawer ${isOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación principal"
      >
        <div className="sidebar-header">
          <div className="sidebar-branding">
            <div className="sidebar-logo-badge">
              <ToothLogo size={32} />
            </div>
            <div className="sidebar-title-group">
              <span className="sidebar-app-name">M&V Turnos</span>
              <span className="sidebar-app-desc">Gestión Odontológica</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Cerrar menú de navegación"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/agenda"
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Agenda Diaria</span>
          </NavLink>

          <NavLink
            to="/pacientes"
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Pacientes</span>
          </NavLink>

          <NavLink
            to="/practicas"
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Catálogo de Prácticas</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-status-tag">
            <span className="sidebar-status-dot" />
            <span>Consultorio Operativo</span>
          </div>
          <span className="sidebar-version-text">v1.0</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
