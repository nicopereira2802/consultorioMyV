/** @format */

import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Calendar, CalendarClock, FileText, Users, Settings, Shield, ChevronUp } from "lucide-react";

export const Bottombar = () => {
  const location = useLocation();
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  // Referencia unificada para todo el bloque de configuración (botón + menú)
  const configContainerRef = useRef(null);

  // Cerrar el dropdown si se hace clic fuera del contenedor de configuración
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (configContainerRef.current && !configContainerRef.current.contains(event.target)) {
        setDropdownAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Función helper para determinar si un NavLink está activo (contemplando sub-rutas)
  const checkIsActive = (itemTo) => {
    const currentPath = location.pathname;
    if (!itemTo) return false;
    if (itemTo === "/") {
      return currentPath === "/" || currentPath.startsWith("/agenda") || currentPath.startsWith("/atencion");
    }
    return currentPath.startsWith(itemTo);
  };

  // Verificar si alguna ruta de configuración está activa para iluminar el botón principal
  const isConfigActive =
    location.pathname.startsWith("/configuracion") ||
    location.pathname.startsWith("/obras-sociales") ||
    location.pathname.startsWith("/practicas");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10000 md:hidden bg-[#3B7A94] border-t border-white/15 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
      {/* Contenedor principal que agrupa el menú flotante y el botón de config bajo la misma referencia */}
      <div ref={configContainerRef} className="relative">
        {/* ─── MENÚ DESPLEGABLE DE CONFIGURACIÓN ─── */}
        {dropdownAbierto && (
          <div className="absolute bottom-full mb-2 right-2 z-10001 w-52 bg-[#3B7A94] border border-white/20 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/60 border-b border-white/10 mb-1">
              Configuración
            </div>

            <NavLink
              to="/configuracion/obras-sociales"
              onClick={() => setDropdownAbierto(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Shield size={18} className="shrink-0 text-white/80" />
              <span>Obras Sociales</span>
            </NavLink>

            <NavLink
              to="/configuracion/practicas"
              onClick={() => setDropdownAbierto(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <FileText size={18} className="shrink-0 text-white/80" />
              <span>Prácticas</span>
            </NavLink>
          </div>
        )}

        {/* ─── BARRA DE NAVEGACIÓN INFERIOR ─── */}
        <nav
          className="w-full px-2 py-1.5 flex items-center justify-around"
          aria-label="Navegación inferior móvil M&V"
        >
          {/* 1. Cobros */}
          <NavLink
            to="/cobros"
            aria-label="Cobros"
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all duration-200 touch-manipulation select-none active:scale-95 ${
              checkIsActive("/cobros")
                ? "bg-white/20 text-white shadow-sm font-semibold"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <FileText size={20} />
            <span className="text-[10px] font-medium leading-tight mt-1">Cobros</span>
          </NavLink>

          {/* 2. Turnos */}
          <NavLink
            to="/turnos"
            aria-label="Turnos"
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all duration-200 touch-manipulation select-none active:scale-95 ${
              checkIsActive("/turnos")
                ? "bg-white/20 text-white shadow-sm font-semibold"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <CalendarClock size={20} />
            <span className="text-[10px] font-medium leading-tight mt-1">Turnos</span>
          </NavLink>

          {/* 3. Agenda */}
          <NavLink
            to="/"
            aria-label="Agenda"
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 touch-manipulation select-none active:scale-95 ${
              checkIsActive("/")
                ? "bg-white/25 text-white shadow-md font-bold"
                : "text-white/90 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Calendar size={22} className="text-white" />
            <span className="text-[10px] font-bold leading-tight mt-1">Agenda</span>
          </NavLink>

          {/* 4. Pacientes */}
          <NavLink
            to="/pacientes"
            aria-label="Pacientes"
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all duration-200 touch-manipulation select-none active:scale-95 ${
              checkIsActive("/pacientes")
                ? "bg-white/20 text-white shadow-sm font-semibold"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Users size={20} />
            <span className="text-[10px] font-medium leading-tight mt-1">Pacientes</span>
          </NavLink>

          {/* 5. Configuración */}
          <button
            type="button"
            onClick={() => setDropdownAbierto((prev) => !prev)}
            aria-label="Configuración"
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all duration-200 touch-manipulation select-none active:scale-95 ${
              isConfigActive || dropdownAbierto
                ? "bg-white/20 text-white shadow-sm font-semibold"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Settings size={20} />
              <ChevronUp
                size={10}
                className={`absolute -bottom-1 -right-1 transition-transform duration-200 ${dropdownAbierto ? "rotate-180" : ""}`}
              />
            </div>
            <span className="text-[10px] font-medium leading-tight mt-1">Config</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Bottombar;
