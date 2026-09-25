import React, { useMemo } from 'react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import { createViewDay, createViewWeek } from '@schedule-x/calendar';

export default function ScheduleXView({ turnos = [], viewMode = 'semanal', selectedDate = '2026-09-20' }) {
  // Map backend turnos to Schedule-X format: "YYYY-MM-DD HH:mm"
  const formattedEvents = useMemo(() => {
    return turnos.map((t) => {
      let startStr = '2026-09-20 09:00';
      let endStr = '2026-09-20 09:40';

      if (t.fecha_hora_inicio) {
        const d = new Date(t.fecha_hora_inicio);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        startStr = `${y}-${m}-${day} ${h}:${min}`;
      }

      if (t.fecha_hora_fin) {
        const d = new Date(t.fecha_hora_fin);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        endStr = `${y}-${m}-${day} ${h}:${min}`;
      }

      const pacienteNombre = t.Paciente 
        ? `${t.Paciente.nombre} ${t.Paciente.apellido}`
        : `Turno #${t.id_turno}`;

      const estado = t.EstadoTurno ? t.EstadoTurno.estado : 'Programado';

      return {
        id: String(t.id_turno),
        title: `${pacienteNombre} (${estado})`,
        start: startStr,
        end: endStr,
        description: t.notas_consulta || '',
      };
    });
  }, [turnos]);

  const defaultView = viewMode === 'diaria' ? 'day' : 'week';

  const calendar = useCalendarApp(
    {
      views: [createViewDay(), createViewWeek()],
      defaultView: defaultView,
      selectedDate: selectedDate || '2026-09-20',
      locale: 'es-ES',
      events: formattedEvents,
      dayBoundaries: {
        start: '08:00',
        end: '20:00',
      },
    },
    [defaultView, formattedEvents, selectedDate]
  );

  return (
    <div className="w-full bg-white rounded-xl shadow-xs overflow-hidden border border-gray-200 p-2 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-teal-800">
          Visualización Schedule-X: {viewMode === 'diaria' ? 'Vista Diaria Detallada' : 'Vista Semanal por Horas'}
        </div>
        <div className="text-xs text-gray-500">
          Mostrando {formattedEvents.length} turnos registrados
        </div>
      </div>
      <div className="sx-custom-theme min-h-[500px]">
        <ScheduleXCalendar calendarApp={calendar} />
      </div>
    </div>
  );
}
