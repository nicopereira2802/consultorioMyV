import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToothLogo from './ToothLogo';
import Sidebar from './Sidebar';
import './header.css';

/**
 * HeaderVolver - Cabecera oficial compartida de M&V Turnos
 * Incluye:
 * - Botón hamburguesa (☰) para abrir el menú lateral desplegable
 * - Isotipo odontológico y título de pantalla
 * - Botón Volver en tono coral
 * - Slot flexible para botones de acción adicionales a la derecha
 *
 * @param {string} title - Título de la pantalla
 * @param {string} [backPath] - Ruta de redirección al pulsar Volver
 * @param {function} [onBack] - Handler de callback personalizado
 * @param {boolean} [showBack=true] - Controla la visibilidad del botón Volver
 * @param {string} [backText='Volver'] - Etiqueta textual del botón Volver
 * @param {boolean} [showMenu=true] - Controla la visibilidad del botón hamburguesa
 * @param {React.ReactNode} [actions] - Slot de acciones complementarias a la derecha
 */
export const HeaderVolver = ({
  title,
  backPath,
  onBack,
  showBack = true,
  backText = 'Volver',
  showMenu = true,
  actions = null
}) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <>
      <header className="header-volver-container" role="banner">
        <div className="header-volver-branding">
          {showMenu && (
            <button
              type="button"
              className="header-btn-hamburger btn-menu-lateral menu-hamburguesa"
              onClick={() => setIsSidebarOpen(true)}
              title="Abrir menú de navegación"
              aria-label="Abrir menú lateral"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}

          <div className="header-volver-logo-badge" title="M&V Turnos Odontológicos">
            <ToothLogo size={36} />
          </div>
          <h1 className="header-volver-title">{title}</h1>
        </div>

        <div className="header-volver-actions">
          {showBack && (
            <button
              type="button"
              className="header-btn-volver btn-volver bg-[#f87171] hover:bg-[#ef4444] text-white font-medium rounded-xl transition-all shadow-sm"
              onClick={handleBackClick}
              aria-label={`Regresar desde ${title}`}
            >
              {backText}
            </button>
          )}
          {actions}
        </div>
      </header>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
};

export const Header = HeaderVolver;
export default HeaderVolver;