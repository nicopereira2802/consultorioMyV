/** @format */

import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Calendar, Users, FileText, PanelLeftClose } from "lucide-react";
import { useSidebar } from "../context/SidebarProvider";
import ToothLogo from "./ToothLogo";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Agenda Diaria",
    Icon: Calendar,
  },
  {
    to: "/turnos",
    label: "Turnos",
    Icon: Users,
  },
  {
    to: "/pacientes",
    label: "Pacientes",
    Icon: Users,
  },
  {
    to: "/cobros",
    label: "Cobros",
    Icon: FileText,
  },
];

export const Sidebar = () => {
  const { isOpen, toggleSidebar } = useSidebar();

  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-50 bg-white shadow-xl flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
        !isOpen ? "w-20" : "w-72.5"
      }`}
      aria-label="Menú de navegación principal"
    >
      {/* Cabecera */}
      <div
        className={`flex items-center border-b border-gray-200 min-h-21.25 transition-all duration-300 ${
          !isOpen
            ? "flex-col justify-center gap-4 py-4"
            : "justify-between px-5 py-4"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 min-w-10 rounded-full bg-white shadow-sm overflow-hidden flex-shrink-0">
            <ToothLogo size={32} />
          </div>

          {isOpen && (
            <div className="flex flex-col whitespace-nowrap">
              <span className="text-lg font-bold text-gray-800 leading-tight">
                M&V Turnos
              </span>
              <span className="text-xs font-medium text-gray-500">
                Gestión Odontológica
              </span>
            </div>
          )}
        </div>

        {/* Botón Gris para Colapsar/Expandir */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex items-center justify-center w-9 h-9 min-w-[9 rounded-full bg-gray-100 text-gray-500 transition-colors duration-200 hover:bg-gray-200 hover:text-gray-800 active:scale-95 flex-shrink-0"
          aria-label={!isOpen ? "Expandir menú" : "Colapsar menú"}
        >
          <PanelLeftClose
            size={18}
            className={`transition-transform duration-300 ${
              !isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-2 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 min-h-12 rounded-xl text-[15px] font-semibold transition-all duration-200 whitespace-nowrap border-l-4 ${
                isActive
                  ? "bg-[#e8f7f1] text-[#2eb086] border-[#2eb086]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-[#2eb086] border-transparent"
              }`
            }
          >
            <Icon size={22} className="shrink-0" />
            {isOpen && <span>{label}</span>}
          </NavLink>
        ))}

        {/* ─── DROPDOWN DE CONFIGURACIÓN / MAESTROS ─── */}
        <button
          onClick={() => setDropdownAbierto(!dropdownAbierto)}
          className="flex items-center gap-1 text-gray-600 hover:text-[#2eb086] font-medium focus:outline-none"
        >
          Configuración
          {/* Icono de flechita que rota según el estado */}
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              dropdownAbierto ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Menú flotante */}
        {dropdownAbierto && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
            <NavLink
              to="/configuracion/obras-sociales"
              onClick={() => setDropdownAbierto(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2eb086]"
            >
              🏥 Obras Sociales
            </NavLink>
            <NavLink
              to="/configuracion/practicas"
              onClick={() => setDropdownAbierto(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2eb086]"
            >
              🩺 Prácticas
            </NavLink>
          </div>
        )}
      </nav>

      {/* Footer */}
      {isOpen && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#2eb086] rounded-full animate-pulse hrink-0" />
            <span className="text-xs font-semibold text-green-700">
              Consultorio Operativo
            </span>
          </div>
          <span className="text-xs font-medium text-gray-500">v1.0</span>
        </div>
      )}
    </aside>
  );
};
