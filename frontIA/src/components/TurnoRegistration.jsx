import React, { useState, useMemo } from 'react';
import DentalLogo from '../assets/DentalLogo';
import { api } from '../services/api';

/**
 * Helper to generate calendar days for a given year and month (0-indexed)
 */
function getMonthDays(year, month) {
  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Convert JS Sunday=0 to Monday=0: (day + 6) % 7
  const startDayIndex = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const days = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayIndex - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dateStr,
      displayDate: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const m = month + 1;
    const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dateStr,
      displayDate: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`,
      isCurrentMonth: true
    });
  }

  // Next month padding up to full weeks (multiples of 7)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const m = month + 2 > 12 ? 1 : month + 2;
    const y = month + 2 > 12 ? year + 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dateStr,
      displayDate: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`,
      isCurrentMonth: false
    });
  }

  return { daysOfWeek, days };
}

export default function TurnoRegistration({
  pacientes = [],
  turnos = [],
  onCancel,
  onSuccess,
  onNavigateToRegistrarPaciente,
  initialDate = '2026-09-20'
}) {
  const [pacienteSearch, setPacienteSearch] = useState('');
  const [selectedPacienteId, setSelectedPacienteId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState(initialDate || '2026-09-20');
  const [hour, setHour] = useState(9);
  const [minutes, setMinutes] = useState(0);
  const [modulos, setModulos] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Generate calendar days for September 2026 (matching reference or selected date's month)
  const { daysOfWeek, days } = useMemo(() => {
    return getMonthDays(2026, 8); // Septiembre 2026
  }, []);

  // Filter real patients from backend
  const filteredPacientes = useMemo(() => {
    if (!pacienteSearch.trim()) return pacientes;
    const query = pacienteSearch.toLowerCase();
    return pacientes.filter((p) => {
      const fullName = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
      const dni = (p.dni || '').toLowerCase();
      return fullName.includes(query) || dni.includes(query);
    });
  }, [pacienteSearch, pacientes]);

  // Handle selecting a patient
  const handleSelectPaciente = (paciente) => {
    setSelectedPacienteId(paciente.id_paciente);
    setPacienteSearch(`${paciente.nombre} ${paciente.apellido} (DNI: ${paciente.dni || 'S/D'})`);
    setIsDropdownOpen(false);
    setErrorMessage('');
  };

  // Adjust time (+ / -)
  const adjustTime = (deltaMinutes) => {
    let totalMinutes = hour * 60 + minutes + deltaMinutes;
    if (totalMinutes < 8 * 60) totalMinutes = 8 * 60;
    if (totalMinutes > 20 * 60) totalMinutes = 20 * 60;
    setHour(Math.floor(totalMinutes / 60));
    setMinutes(totalMinutes % 60);
  };

  // Adjust modules (+ / -)
  const adjustModulos = (delta) => {
    setModulos((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  const formattedTime = `${hour}:${minutes === 0 ? '00' : String(minutes).padStart(2, '0')}`;

  // Helper to compute real status of a day from actual turnos
  const getDayStatus = (dateStr, isCurrentMonth) => {
    if (!isCurrentMonth) {
      return { status: 'Libre', bgClass: 'bg-[#D1D5DB] text-gray-800' };
    }

    const dayTurnos = (turnos || []).filter(t => {
      const inicio = t.fecha_hora_inicio || '';
      return inicio.startsWith(dateStr);
    });

    if (dayTurnos.length >= 3) {
      return { status: 'Lleno', bgClass: 'bg-[#F87171] text-gray-900' };
    } else if (dayTurnos.length > 0) {
      return { status: 'Ocupado', bgClass: 'bg-[#FDE047] text-gray-900' };
    } else {
      return { status: 'Libre', bgClass: 'bg-[#A7F3D0] text-gray-900' };
    }
  };

  // Submit appointment
  const handleConfirmar = async () => {
    if (!selectedPacienteId) {
      setErrorMessage('Por favor seleccione un paciente de la lista o regístrelo.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const pad = (n) => String(n).padStart(2, '0');
      const startDateTime = `${selectedDate}T${pad(hour)}:${pad(minutes)}:00`;

      // 40 minutes per module
      const endTotalMinutes = hour * 60 + minutes + modulos * 40;
      const endHour = Math.floor(endTotalMinutes / 60);
      const endMin = endTotalMinutes % 60;
      const endDateTime = `${selectedDate}T${pad(endHour)}:${pad(endMin)}:00`;

      const turnoData = {
        id_paciente: selectedPacienteId,
        id_estado: 1, // Programado
        fecha_hora_inicio: startDateTime,
        fecha_hora_fin: endDateTime,
        precio_final: modulos * 15000.0,
        notas_consulta: `Turno de ${modulos} módulo(s)`
      };

      await api.createTurno(turnoData);
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMessage(err.message || 'Error al registrar el turno');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Top Bar matching Image 2 */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3.5">
          <DentalLogo className="w-11 h-11" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Registrar turno
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 bg-[#F87171] hover:bg-[#EF4444] text-white font-medium rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer text-base sm:text-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#A7F3D0] hover:bg-[#86EFAC] text-gray-900 font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer text-base sm:text-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {errorMessage}
        </div>
      )}

      {/* Main Form Body */}
      <div className="pt-6 sm:pt-8 space-y-6">
        {/* Paciente input row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 relative">
          <label className="text-lg sm:text-xl font-medium text-gray-900 w-24 text-left">
            Paciente:
          </label>

          <div className="relative flex-1 max-w-lg">
            <input
              type="text"
              value={pacienteSearch}
              onChange={(e) => {
                setPacienteSearch(e.target.value);
                setSelectedPacienteId(null);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder='Ej: "Gómez" o "38456789"...'
              className="w-full px-4 py-2.5 rounded-xl border border-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-base shadow-2xs"
            />

            {/* Dropdown with real search results */}
            {isDropdownOpen && filteredPacientes.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto">
                {filteredPacientes.map((p) => (
                  <div
                    key={p.id_paciente}
                    onClick={() => handleSelectPaciente(p)}
                    className="p-3 hover:bg-teal-50 cursor-pointer border-b border-gray-100 last:border-0 flex justify-between items-center text-left"
                  >
                    <div>
                      <span className="font-semibold text-gray-900">{p.nombre} {p.apellido}</span>
                      <span className="text-xs text-gray-500 ml-2">DNI: {p.dni || 'Sin DNI'}</span>
                    </div>
                    <span className="text-xs text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md font-medium">
                      {p.PacienteObraSocials?.[0]?.ObraSocial?.nombre || 'Particular'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onNavigateToRegistrarPaciente}
            className="px-5 py-2.5 bg-[#2EAF85] hover:bg-[#259772] text-white font-medium rounded-xl shadow-xs transition-all text-base cursor-pointer self-start sm:self-auto whitespace-nowrap"
          >
            Registrar nuevo
          </button>
        </div>

        {/* Día: Interactive month grid matching Image 2 with real turnos */}
        <div className="text-left space-y-2">
          <div className="text-lg sm:text-xl font-medium text-gray-900">
            Día:
          </div>

          <div className="w-full select-none">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-2 text-center">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-sm sm:text-base font-semibold text-gray-800 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {days.slice(0, 28).map((dayItem) => {
                const { status, bgClass } = getDayStatus(dayItem.dateStr, dayItem.isCurrentMonth);
                const isSelected = selectedDate === dayItem.dateStr;

                return (
                  <div
                    key={dayItem.dateStr}
                    onClick={() => setSelectedDate(dayItem.dateStr)}
                    className={`
                      h-16 sm:h-20 md:h-24 p-2 sm:p-2.5 rounded-xl border border-gray-900/80 flex flex-col justify-between
                      transition-all duration-150 cursor-pointer ${bgClass}
                      ${isSelected ? 'ring-4 ring-teal-600 scale-[1.02] shadow-md z-10' : 'hover:opacity-90'}
                    `}
                  >
                    <div className="text-xs sm:text-sm md:text-base font-bold text-left text-gray-900 tracking-tight">
                      {dayItem.displayDate}
                    </div>
                    <div className="text-[11px] sm:text-xs md:text-sm font-medium text-left text-gray-800">
                      {status}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom controls: Hora de Inicio & N° de módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Hora de Inicio */}
          <div className="flex items-center gap-3">
            <span className="text-base sm:text-lg font-medium text-gray-900 w-32 sm:w-36 text-left">
              Hora de Inicio:
            </span>
            <div className="w-28 py-2 px-3 bg-white rounded-xl border border-gray-300 text-center text-lg font-semibold text-gray-700 shadow-2xs">
              {formattedTime}
            </div>
            <button
              type="button"
              onClick={() => adjustTime(-30)}
              className="w-9 h-9 bg-[#F87171] hover:bg-[#EF4444] text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all shadow-2xs active:scale-90 cursor-pointer"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => adjustTime(30)}
              className="w-9 h-9 bg-[#A7F3D0] hover:bg-[#86EFAC] text-gray-900 rounded-lg flex items-center justify-center font-bold text-xl transition-all shadow-2xs active:scale-90 cursor-pointer"
            >
              +
            </button>
          </div>

          {/* N° de módulos */}
          <div className="flex items-center gap-3">
            <span className="text-base sm:text-lg font-medium text-gray-900 w-32 sm:w-36 text-left">
              N° de módulos:
            </span>
            <div className="w-28 py-2 px-3 bg-white rounded-xl border border-gray-300 text-center text-lg font-semibold text-gray-700 shadow-2xs">
              {modulos}
            </div>
            <button
              type="button"
              onClick={() => adjustModulos(-1)}
              className="w-9 h-9 bg-[#F87171] hover:bg-[#EF4444] text-white rounded-lg flex items-center justify-center font-bold text-xl transition-all shadow-2xs active:scale-90 cursor-pointer"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => adjustModulos(1)}
              className="w-9 h-9 bg-[#A7F3D0] hover:bg-[#86EFAC] text-gray-900 rounded-lg flex items-center justify-center font-bold text-xl transition-all shadow-2xs active:scale-90 cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
