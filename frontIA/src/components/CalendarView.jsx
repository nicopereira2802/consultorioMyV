import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Menu, Plus, Clock, User, Phone, FileText, DollarSign, X } from 'lucide-react';
import DentalLogo from '../assets/DentalLogo';
import { ScheduleXCalendar, useCalendarApp } from '@schedule-x/react';
import { createViewDay, createViewWeek, createViewMonthGrid } from '@schedule-x/calendar';
import { createCalendarControlsPlugin } from '@schedule-x/calendar-controls';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import { createEventModalPlugin } from '@schedule-x/event-modal';
import '@schedule-x/theme-default/dist/index.css';

const TIMEZONE = 'America/Argentina/Cordoba';

/**
 * Format a DB date/time string to Temporal.ZonedDateTime as required by Schedule-X
 */
function toZonedDateTime(dateValue) {
  if (!dateValue) return null;
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  try {
    return Temporal.ZonedDateTime.from(`${y}-${m}-${day}T${h}:${min}:${sec}-03:00[${TIMEZONE}]`);
  } catch (err) {
    console.warn('Error converting to ZonedDateTime:', err);
    return null;
  }
}

export default function CalendarView({
  turnos = [],
  onOpenMenu,
  onNavigateToRegistrarTurno
}) {
  const [activeView, setActiveView] = useState('month-grid'); // 'day' | 'week' | 'month-grid'
  const [currentDisplayDate, setCurrentDisplayDate] = useState(new Date(2026, 8, 20)); // Septiembre 2026
  const [selectedEventForDetail, setSelectedEventForDetail] = useState(null);

  // Initialize Schedule-X plugins via official factory functions
  const calendarControls = useMemo(() => createCalendarControlsPlugin(), []);
  const eventsService = useMemo(() => createEventsServicePlugin(), []);
  const eventModal = useMemo(() => createEventModalPlugin(), []);

  // Transform backend turnos into Schedule-X events (zero fake/default data)
  const scheduleEvents = useMemo(() => {
    return (turnos || [])
      .map((t) => {
        const startZDT = toZonedDateTime(t.fecha_hora_inicio);
        const endZDT = toZonedDateTime(t.fecha_hora_fin) || startZDT;

        if (!startZDT || !endZDT) return null;

        const pacienteNombre = t.Paciente
          ? `${t.Paciente.nombre} ${t.Paciente.apellido}`
          : `Turno #${t.id_turno}`;

        const estado = t.EstadoTurno?.estado || 'Programado';

        let calendarId = 'programado';
        if (estado === 'Atendido') calendarId = 'atendido';
        else if (estado === 'Cancelado') calendarId = 'cancelado';

        return {
          id: String(t.id_turno),
          title: pacienteNombre,
          start: startZDT,
          end: endZDT,
          calendarId,
          description: t.notas_consulta || '',
          rawTurno: t
        };
      })
      .filter(Boolean);
  }, [turnos]);

  // Format month label: "Septiembre 2026:"
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const monthLabel = `${monthNames[currentDisplayDate.getMonth()]} ${currentDisplayDate.getFullYear()}:`;

  // Calendar configuration (WITHOUT plugins property, passed as 2nd argument to useCalendarApp)
  const calendarConfig = useMemo(() => {
    return {
      views: [createViewMonthGrid(), createViewWeek(), createViewDay()],
      defaultView: 'month-grid',
      selectedDate: Temporal.PlainDate.from('2026-09-20'),
      locale: 'es-ES',
      firstDayOfWeek: 1, // Lunes
      dayBoundaries: {
        start: '08:00',
        end: '20:00',
      },
      calendars: {
        programado: {
          colorName: 'programado',
          lightColors: {
            main: '#2EAF85',
            container: '#DCFCE7',
            onContainer: '#166534',
          },
        },
        atendido: {
          colorName: 'atendido',
          lightColors: {
            main: '#3B82F6',
            container: '#DBEAFE',
            onContainer: '#1E40AF',
          },
        },
        cancelado: {
          colorName: 'cancelado',
          lightColors: {
            main: '#EF4444',
            container: '#FEE2E2',
            onContainer: '#991B1B',
          },
        },
      },
      events: scheduleEvents,
      callbacks: {
        onEventClick(event) {
          setSelectedEventForDetail(event);
        },
      },
    };
  }, [scheduleEvents]);

  // Plugins passed strictly as 2nd argument to useCalendarApp
  const plugins = useMemo(
    () => [calendarControls, eventsService, eventModal],
    [calendarControls, eventsService, eventModal]
  );

  const calendarApp = useCalendarApp(calendarConfig, plugins);

  // Sync events dynamically when turnos updates
  useEffect(() => {
    if (eventsService && typeof eventsService.set === 'function') {
      try {
        eventsService.set(scheduleEvents);
      } catch (e) {
        // Ignored if calendar is re-rendering
      }
    }
  }, [scheduleEvents, eventsService]);

  // View switch handlers
  const handleSetView = (viewName) => {
    setActiveView(viewName);
    if (calendarControls && typeof calendarControls.setView === 'function') {
      calendarControls.setView(viewName);
    }
  };

  // Month navigation handlers (< >)
  const handleNavigateMonth = (direction) => {
    const nextDate = new Date(currentDisplayDate);
    if (activeView === 'month-grid') {
      nextDate.setMonth(nextDate.getMonth() + direction);
    } else if (activeView === 'week') {
      nextDate.setDate(nextDate.getDate() + direction * 7);
    } else {
      nextDate.setDate(nextDate.getDate() + direction);
    }

    setCurrentDisplayDate(nextDate);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    const d = String(nextDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    if (calendarControls && typeof calendarControls.setDate === 'function') {
      try {
        calendarControls.setDate(Temporal.PlainDate.from(dateStr));
      } catch (e) {
        console.warn('Error setting date in controls:', e);
      }
    }
  };

  return (
    <div className="relative w-full">
      {/* Top Header matching Image 1 */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3.5">
          {/* Hamburger Menu button */}
          <button
            onClick={onOpenMenu}
            className="p-2 -ml-1 text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors cursor-pointer"
            title="Abrir menú"
          >
            <Menu className="w-7 h-7" />
          </button>

          {/* Dental Logo */}
          <DentalLogo className="w-11 h-11" />

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Calendario
          </h1>
        </div>

        {/* Volver button */}
        <button
          onClick={onOpenMenu}
          className="px-8 py-2.5 bg-[#F87171] hover:bg-[#EF4444] text-white font-medium rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer text-base sm:text-lg"
        >
          Volver
        </button>
      </div>

      {/* Main Content Body */}
      <div className="pt-6 sm:pt-8 space-y-6">
        {/* Tipo de vista buttons matching Image 1 */}
        <div>
          <h2 className="text-lg sm:text-xl font-medium text-gray-800 mb-3 text-left">
            Tipo de vista:
          </h2>

          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-3xl">
            {/* Diaria */}
            <button
              onClick={() => handleSetView('day')}
              className={`py-3 px-4 rounded-xl font-medium text-base sm:text-lg transition-all cursor-pointer text-center ${
                activeView === 'day'
                  ? 'border-2 border-[#2EAF85] text-gray-900 bg-white shadow-xs ring-1 ring-[#2EAF85]/30'
                  : 'bg-[#2EAF85] hover:bg-[#259772] text-white'
              }`}
            >
              Diaria
            </button>

            {/* Semanal */}
            <button
              onClick={() => handleSetView('week')}
              className={`py-3 px-4 rounded-xl font-medium text-base sm:text-lg transition-all cursor-pointer text-center ${
                activeView === 'week'
                  ? 'border-2 border-[#2EAF85] text-gray-900 bg-white shadow-xs ring-1 ring-[#2EAF85]/30'
                  : 'bg-[#2EAF85] hover:bg-[#259772] text-white'
              }`}
            >
              Semanal
            </button>

            {/* Mensual */}
            <button
              onClick={() => handleSetView('month-grid')}
              className={`py-3 px-4 rounded-xl font-medium text-base sm:text-lg transition-all cursor-pointer text-center ${
                activeView === 'month-grid'
                  ? 'border-2 border-[#2EAF85] text-gray-900 bg-white shadow-xs ring-1 ring-[#2EAF85]/30'
                  : 'bg-[#2EAF85] hover:bg-[#259772] text-white'
              }`}
            >
              Mensual
            </button>
          </div>
        </div>

        {/* Month Selector Header matching Image 1: "Septiembre 2026: [<] [>]" */}
        <div className="flex items-center gap-3 text-left">
          <span className="text-lg sm:text-xl font-medium text-gray-900">
            {monthLabel}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavigateMonth(-1)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#2EAF85] hover:bg-[#259772] text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
              title="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleNavigateMonth(1)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#2EAF85] hover:bg-[#259772] text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
              title="Siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Schedule-X Calendar Engine */}
        <div className="schedule-x-container w-full bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs min-h-[580px]">
          {calendarApp ? (
            <ScheduleXCalendar calendarApp={calendarApp} />
          ) : (
            <div className="py-24 text-center text-gray-400 font-medium">
              Cargando calendario Schedule-X...
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button (FAB) verde redondo con '+' */}
      <button
        onClick={onNavigateToRegistrarTurno}
        className="fixed sm:absolute bottom-6 right-6 w-16 h-16 rounded-full bg-[#2EAF85] hover:bg-[#23956f] text-white shadow-xl flex items-center justify-center hover:scale-108 active:scale-95 transition-all duration-200 z-30 cursor-pointer border-2 border-white/60"
        title="Registrar nuevo turno"
      >
        <Plus className="w-8 h-8 stroke-[3]" />
      </button>

      {/* Custom Event Detail Modal */}
      {selectedEventForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <DentalLogo className="w-8 h-8" />
                <h3 className="text-lg font-bold text-gray-900">
                  Detalles del Turno
                </h3>
              </div>
              <button
                onClick={() => setSelectedEventForDetail(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="flex items-center gap-2 text-gray-900 font-semibold text-base">
                <User className="w-5 h-5 text-teal-600" />
                <span>{selectedEventForDetail.title}</span>
              </div>

              {selectedEventForDetail.rawTurno?.Paciente && (
                <div className="text-sm text-gray-600 pl-7 space-y-1">
                  {selectedEventForDetail.rawTurno.Paciente.dni && (
                    <p>DNI: {selectedEventForDetail.rawTurno.Paciente.dni}</p>
                  )}
                  {selectedEventForDetail.rawTurno.Paciente.telefono && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {selectedEventForDetail.rawTurno.Paciente.telefono}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-700 pt-2 border-t border-gray-100">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>
                  {selectedEventForDetail.start?.toString().replace(/\[.*\]/, '').replace('T', ' ')}
                </span>
              </div>

              {selectedEventForDetail.description && (
                <div className="flex items-start gap-2 text-sm text-gray-600 pt-1">
                  <FileText className="w-4 h-4 text-teal-600 mt-0.5" />
                  <span>{selectedEventForDetail.description}</span>
                </div>
              )}

              {selectedEventForDetail.rawTurno?.precio_final && (
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Precio: ${selectedEventForDetail.rawTurno.precio_final}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedEventForDetail(null)}
                className="px-5 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
