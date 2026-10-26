/** @format */

import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Users,
  FileText,
  PanelLeftClose,
  CalendarDays,
  CalendarClock,
  Settings,
  Shield,
  ChevronDown,
  Wallet,
  Lock,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { useSidebar } from "../../../context/SidebarProvider";
import { usePinLock } from "../../../context/PinLockContext";
import ToothLogo from "../ToothLogo";
import RecuperarPinModal from "../../../features/auth/components/RecuperarPinModal";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Agenda Diaria",
    Icon: CalendarDays,
  },
  {
    to: "/turnos",
    label: "Turnos",
    Icon: CalendarClock,
  },
  {
    to: "/pacientes",
    label: "Pacientes",
    Icon: Users,
  },
  {
    to: "/caja",
    label: "Caja y Balances", 
    Icon: Wallet,
  },
];

export const Sidebar = () => {
  const { isOpen, toggleSidebar } = useSidebar();
  const { lock, bloquearTerminal } = usePinLock();

  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [modalPinAbierto, setModalPinAbierto] = useState(false);
  const [toastPinExito, setToastPinExito] = useState(false);
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
      className={`fixed top-0 left-0 h-screen z-50 bg-[#3B7A94] text-white shadow-xl flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
        !isOpen ? "w-20" : "w-72"
      }`}
      aria-label="Menú de navegación principal"
    >
      {/* Cabecera */}
      <div
        className={`flex items-center border-b border-white/15 min-h-21.25 transition-all duration-300 ${
          !isOpen ? "flex-col justify-center gap-4 py-4" : "justify-between px-5 py-6.5"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 min-w-10 rounded-full bg-white shadow-sm overflow-hidden shrink-0">
            <ToothLogo size={32} />
          </div>

          {isOpen && (
            <div className="flex flex-col whitespace-nowrap">
              <span className="text-lg font-bold text-white leading-tight">M&V Turnos</span>
              <span className="text-xs font-medium text-white/70">Gestión Odontológica</span>
            </div>
          )}
        </div>

        {/* Botón Adaptado para Colapsar/Expandir */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex items-center justify-center w-9 h-9 min-w-9 rounded-full bg-white/10 text-white transition-colors duration-200 hover:bg-white/20 active:scale-95 shrink-0"
          aria-label={!isOpen ? "Expandir menú" : "Colapsar menú"}
        >
          <PanelLeftClose
            size={18}
            className={`transition-transform duration-300 ${!isOpen ? "rotate-180" : ""}`}
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
                  ? "bg-white/20 text-white border-white shadow-sm"
                  : "text-white/80 hover:bg-white/10 hover:text-white border-transparent"
              }`
            }
          >
            <Icon size={22} className="shrink-0" />
            {isOpen && <span>{label}</span>}
          </NavLink>
        ))}

        {/* ─── DROPDOWN DE CONFIGURACIÓN / MAESTROS ─── */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownAbierto(!dropdownAbierto)}
            className="w-full flex items-center justify-between px-4 py-3 min-h-12 rounded-xl text-[15px] font-semibold transition-all duration-200 text-white/80 hover:bg-white/10 hover:text-white border-l-4 border-transparent"
          >
            <div className="flex items-center gap-4">
              <Settings size={22} className="shrink-0" />
              {isOpen && <span>Configuración</span>}
            </div>
            {isOpen && (
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 text-white/70 ${
                  dropdownAbierto ? "rotate-180" : ""
                }`}
              />
            )}
          </button>

          {/* Menú desplegable integrado debajo */}
          {dropdownAbierto && isOpen && (
            <div className="mt-1 ml-4 pl-4 border-l-2 border-white/20 flex flex-col gap-1">
              <NavLink
                to="/configuracion/obras-sociales"
                onClick={() => setDropdownAbierto(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Shield size={18} className="shrink-0 text-white/70" />
                <span>Obras Sociales</span>
              </NavLink>

              <NavLink
                to="/configuracion/practicas"
                onClick={() => setDropdownAbierto(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <FileText size={18} className="shrink-0 text-white/70" />
                <span>Prácticas</span>
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      {/* Acciones de Seguridad: Cambiar PIN y Cerrar Sesión */}
      <div className="p-3 border-t border-white/15 flex flex-col gap-2">
        {/* Botón Cambiar PIN (Diseño neutro estándar de la barra lateral, sin tonos rojos) */}
        <button
          type="button"
          onClick={() => setModalPinAbierto(true)}
          title="Cambiar PIN de Acceso"
          className={`w-full flex items-center rounded-xl text-sm font-semibold transition-all duration-200 text-white/90 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 active:scale-95 cursor-pointer ${
            !isOpen ? "justify-center p-3" : "gap-3 px-4 py-2.5"
          }`}
        >
          <KeyRound size={18} className="shrink-0 text-white/80" />
          {isOpen && <span>Cambiar PIN</span>}
        </button>

        {/* Botón de Bloqueo de Terminal / Cerrar Sesión */}
        <button
          type="button"
          onClick={() => {
            if (bloquearTerminal) bloquearTerminal();
            else lock();
          }}
          title="Cerrar Sesión"
          className={`w-full flex items-center rounded-xl text-sm font-semibold transition-all duration-200 text-rose-100 hover:text-white bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 active:scale-95 cursor-pointer ${
            !isOpen ? "justify-center p-3" : "gap-3 px-4 py-2.5"
          }`}
        >
          <Lock size={18} className="shrink-0 text-rose-300" />
          {isOpen && <span>Cerrar Sesión</span>}
        </button>
      </div>

      {/* Footer */}
      {isOpen && (
        <div className="p-4 border-t border-white/15 bg-[#2c6177] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
            <span className="text-xs font-semibold text-emerald-300">Consultorio Operativo</span>
          </div>
          <span className="text-xs font-medium text-white/60">v1.0</span>
        </div>
      )}

      {/* Modal para Cambiar PIN */}
      {modalPinAbierto && (
        <RecuperarPinModal
          isOpen={modalPinAbierto}
          onClose={() => setModalPinAbierto(false)}
          onSuccess={() => {
            setModalPinAbierto(false);
            setToastPinExito(true);
            setTimeout(() => setToastPinExito(false), 3500);
          }}
          usuarioActual={
            localStorage.getItem("usuario_guardado") ||
            localStorage.getItem("usuario") ||
            sessionStorage.getItem("usuario") ||
            "Odontólogo"
          }
          usuarioPredefinido={
            localStorage.getItem("usuario_guardado") ||
            localStorage.getItem("usuario") ||
            sessionStorage.getItem("usuario") ||
            "Odontólogo"
          }
          modo="cambiar"
        />
      )}

      {/* Toast Notificación: PIN Actualizado con Éxito */}
      {toastPinExito && (
        <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white text-xs font-semibold rounded-2xl shadow-xl shadow-emerald-950/20 border border-emerald-500/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-200" />
          <span>PIN actualizado correctamente.</span>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
