/** @format */

import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Calendar,
  CalendarClock,
  FileText,
  Users,
  Settings,
  Shield,
  ChevronUp,
  Wallet,
  Lock,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { usePinLock } from "../../../context/PinLockContext";
import RecuperarPinModal from "../../../features/auth/components/RecuperarPinModal";

export const Bottombar = () => {
  const location = useLocation();
  const { lock, bloquearTerminal } = usePinLock();
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [modalPinAbierto, setModalPinAbierto] = useState(false);
  const [toastPinExito, setToastPinExito] = useState(false);

  // Referencia unificada para todo el bloque de configuración (botón + menú)
  const configContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (configContainerRef.current && !configContainerRef.current.contains(event.target)) {
        setDropdownAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkIsActive = (itemTo) => {
    const currentPath = location.pathname;
    if (!itemTo) return false;
    if (itemTo === "/") {
      return currentPath === "/" || currentPath.startsWith("/agenda") || currentPath.startsWith("/atencion");
    }
    return currentPath.startsWith(itemTo);
  };

  const isConfigActive =
    location.pathname.startsWith("/configuracion") ||
    location.pathname.startsWith("/obras-sociales") ||
    location.pathname.startsWith("/practicas");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#3B7A94] border-t border-white/15 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
      <div ref={configContainerRef} className="relative">
        {/* DROPDOWN CONFIGURACIÓN */}
        {dropdownAbierto && (
          <div className="absolute bottom-full mb-2 right-2 z-60 w-52 bg-[#3B7A94] border border-white/20 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
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

            {/* Botón Cambiar PIN */}
            <button
              type="button"
              onClick={() => {
                setDropdownAbierto(false);
                setModalPinAbierto(true);
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors text-left w-full cursor-pointer"
            >
              <KeyRound size={18} className="shrink-0 text-white/80" />
              <span>Cambiar PIN</span>
            </button>

            {/* Botón Cerrar Sesión */}
            <button
              type="button"
              onClick={() => {
                setDropdownAbierto(false);
                if (bloquearTerminal) bloquearTerminal();
                else lock();
              }}
              title="Cerrar Sesión"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-200 hover:bg-rose-500/20 transition-colors text-left w-full border-t border-white/10 mt-1 cursor-pointer"
            >
              <Lock size={16} className="shrink-0 text-rose-300" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}

        {/* BARRA INFERIOR */}
        <nav
          className="w-full px-2 py-1.5 flex items-center justify-around"
          aria-label="Navegación inferior móvil M&V"
        >
          {/* 1. Caja */}
          <NavLink
            to="/caja"
            aria-label="Caja"
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 touch-manipulation select-none active:scale-95 ${
              checkIsActive("/caja")
                ? "bg-white/20 text-white shadow-sm font-semibold"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Wallet size={20} />
            <span className="text-[10px] font-medium leading-tight mt-1">Caja</span>
          </NavLink>

          {/* 2. Turnos */}
          <NavLink
            to="/turnos"
            aria-label="Turnos"
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 touch-manipulation select-none active:scale-95 ${
              checkIsActive("/turnos")
                ? "bg-white/20 text-white shadow-sm font-semibold"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <CalendarClock size={20} />
            <span className="text-[10px] font-medium leading-tight mt-1">Turnos</span>
          </NavLink>

          {/* 3. Agenda (Central) */}
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
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 touch-manipulation select-none active:scale-95 ${
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
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 touch-manipulation select-none active:scale-95 ${
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
        <div className="fixed bottom-20 left-4 right-4 z-[10002] flex items-center justify-center gap-2.5 px-4 py-3 bg-emerald-600 text-white text-xs font-semibold rounded-2xl shadow-xl border border-emerald-500/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-200" />
          <span>PIN actualizado correctamente.</span>
        </div>
      )}
    </div>
  );
};

export default Bottombar;
