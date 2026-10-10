import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { DollarSign, CalendarPlus, Calendar, Users, FileText } from "lucide-react";

// Estructura declarativa de items idéntica a la convención de Sidebar
const NAV_ITEMS = [
  {
    id: "pagos",
    label: "Pagos",
    Icon: DollarSign,
    disabled: true,
  },
  {
    id: "nuevo-turno",
    label: "Turno",
    Icon: CalendarPlus,
    disabled: true,
  },
  {
    id: "agenda",
    to: "/",
    label: "Agenda",
    Icon: Calendar,
  },
  {
    id: "pacientes",
    to: "/pacientes",
    label: "Pacientes",
    Icon: Users,
  },
  {
    id: "practicas",
    to: "/practicas",
    label: "Prácticas",
    Icon: FileText,
  },
];

export const BottomNav = () => {
  const location = useLocation();
  const [toastMsg, setToastMsg] = useState("");

  const mostrarToast = (mensaje = "Función no disponible") => {
    setToastMsg(mensaje);
    setTimeout(() => {
      setToastMsg("");
    }, 2500);
  };

  // Función helper para determinar si un NavLink está activo (contemplando sub-rutas como /registrar-paciente)
  const checkIsActive = (itemTo) => {
    const currentPath = location.pathname;
    if (!itemTo) return false;
    if (itemTo === "/") {
      return (
        currentPath === "/" ||
        currentPath.startsWith("/agenda") ||
        currentPath.startsWith("/atencion")
      );
    }
    if (itemTo === "/pacientes") {
      return (
        currentPath.startsWith("/pacientes") ||
        currentPath === "/registrar-paciente"
      );
    }
    return currentPath.startsWith(itemTo);
  };

  return (
    <>
      {/* Toast Flotante Informativo */}
      {toastMsg && (
        <aside
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-1050 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none transition-all duration-200"
          role="status"
          aria-live="polite"
        >
          {toastMsg}
        </aside>
      )}

      {/* Navegación Inferior Flotante (Píldora estilo App Moderna) */}
      <div className="fixed bottom-3 left-0 right-0 z-10000 px-4 flex justify-center md:hidden pointer-events-none">
        <nav
          className="w-full max-w-md bg-white/95 backdrop-blur-lg border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl px-2 py-2 flex items-center justify-between pointer-events-auto transition-all duration-300"
          aria-label="Navegación inferior móvil M&V"
        >
          {NAV_ITEMS.map(({ id, to, label, Icon, disabled }) => {
            // Si el ítem es deshabilitado (ej. Pagos o Nuevo Turno), renderiza botón con Toast
            if (disabled) {
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => mostrarToast("Función no disponible")}
                  aria-label={label}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all duration-300 touch-manipulation select-none active:scale-95"
                >
                  <Icon size={20} className="transition-transform duration-200" />
                </button>
              );
            }

            const isActive = checkIsActive(to);

            return (
              <NavLink
                key={id}
                to={to}
                aria-label={label}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 touch-manipulation select-none active:scale-95 ${
                  isActive
                    ? "bg-[#2eb086] text-white shadow-md shadow-[#2eb086]/30 font-semibold"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-transform duration-200 ${
                    isActive ? "scale-105" : ""
                  }`}
                />
                {isActive && (
                  <span className="text-xs font-medium leading-none animate-in fade-in zoom-in-95 duration-200">
                    {label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default BottomNav;