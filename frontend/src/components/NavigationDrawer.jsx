import { NavLink, useLocation } from 'react-router-dom';
import { Calendar, UserPlus, Users, CalendarPlus, X } from 'lucide-react';
import DentalLogo from '../assets/DentalLogo';

export default function NavigationDrawer({ isOpen, onClose }) {
  const location = useLocation();

  if (!isOpen) return null;

  const navItems = [
    { path: '/turnos', label: 'Calendario', icon: Calendar, matches: ['/turnos', '/'] },
    { path: '/turnos/nuevo', label: 'Registrar Turno', icon: CalendarPlus, matches: ['/turnos/nuevo'] },
    { path: '/pacientes', label: 'Pacientes', icon: Users, matches: ['/pacientes'] },
    { path: '/pacientes/nuevo', label: 'Registrar Paciente', icon: UserPlus, matches: ['/pacientes/nuevo'] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-80 max-w-full bg-white h-full shadow-2xl z-10 flex flex-col p-6 animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <DentalLogo className="w-10 h-10" />
            <div>
              <h2 className="text-xl font-bold text-gray-800 tracking-tight">Consultorio M&V</h2>
              <p className="text-xs text-teal-600 font-medium">Gestión Odontológica</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Cerrar menú"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-6 flex-1 flex flex-col gap-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Navegación
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.matches.includes(location.pathname);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-medium text-left transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 font-semibold border-l-4 border-teal-600 shadow-xs'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-gray-400'}`} />
                <span className="text-base">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
          Consultorio Odontológico M&V © 2026
        </div>
      </div>
    </div>
  );
}
