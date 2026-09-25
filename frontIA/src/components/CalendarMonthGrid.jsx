import React from 'react';

export default function CalendarMonthGrid({ 
  turnos = [], 
  selectedDate, 
  onSelectDate, 
  interactive = true 
}) {
  // Days of the week as in screenshots: Lun, Mar, Mié, Jue, Vie, Sáb, Dom
  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Cells structure replicating Image 1 and Image 2
  // We compute dynamic status from real turnos, with default visual states matching the images
  const defaultGrid = [
    // Row 1
    { dateStr: '2026-08-31', displayDate: '31/08', defaultStatus: 'Libre', defaultColor: 'gray' },
    { dateStr: '2026-09-01', displayDate: '01/09', defaultStatus: 'Libre', defaultColor: 'gray' },
    { dateStr: '2026-09-02', displayDate: '02/09', defaultStatus: 'Libre', defaultColor: 'gray' },
    { dateStr: '2026-09-03', displayDate: '03/09', defaultStatus: 'Libre', defaultColor: 'gray' },
    { dateStr: '2026-09-04', displayDate: '04/09', defaultStatus: 'Libre', defaultColor: 'gray' },
    { dateStr: '2026-09-05', displayDate: '05/09', defaultStatus: 'Libre', defaultColor: 'gray' },
    { dateStr: '2026-09-06', displayDate: '06/09', defaultStatus: 'Libre', defaultColor: 'gray' },

    // Row 2
    { dateStr: '2026-09-07', displayDate: '07/09', defaultStatus: 'Libre', defaultColor: 'gray' },
    { dateStr: '2026-09-08', displayDate: '08/09', defaultStatus: 'Libre', defaultColor: 'gray' },
    { dateStr: '2026-09-09', displayDate: '09/09', defaultStatus: 'Libre', defaultColor: 'gray' },
    { dateStr: '2026-09-10', displayDate: '10/09', defaultStatus: 'Libre', defaultColor: 'gray' },
    { dateStr: '2026-09-11', displayDate: '11/09', defaultStatus: 'Libre', defaultColor: 'gray' },
    { dateStr: '2026-09-12', displayDate: '12/09', defaultStatus: 'Libre', defaultColor: 'gray' },
    { dateStr: '2026-09-13', displayDate: '13/09', defaultStatus: 'Libre', defaultColor: 'gray' },

    // Row 3
    { dateStr: '2026-09-14', displayDate: '14/09', defaultStatus: 'Libre', defaultColor: 'green' },
    { dateStr: '2026-09-15', displayDate: '15/09', defaultStatus: 'Ocupado', defaultColor: 'yellow' },
    { dateStr: '2026-09-16', displayDate: '16/09', defaultStatus: 'Libre', defaultColor: 'green' },
    { dateStr: '2026-09-17', displayDate: '17/09', defaultStatus: 'Lleno', defaultColor: 'red' },
    { dateStr: '2026-09-18', displayDate: '18/09', defaultStatus: 'Ocupado', defaultColor: 'yellow' },
    { dateStr: '2026-09-19', displayDate: '19/09', defaultStatus: 'Libre', defaultColor: 'green' },
    { dateStr: '2026-09-20', displayDate: '20/09', defaultStatus: 'Libre', defaultColor: 'green' },

    // Row 4
    { dateStr: '2026-09-21', displayDate: '21/09', defaultStatus: 'Ocupado', defaultColor: 'yellow' },
    { dateStr: '2026-09-22', displayDate: '22/09', defaultStatus: 'Ocupado', defaultColor: 'yellow' },
    { dateStr: '2026-09-23', displayDate: '22/09', defaultStatus: 'Lleno', defaultColor: 'red' },
    { dateStr: '2026-09-24', displayDate: '23/09', defaultStatus: 'Lleno', defaultColor: 'red' },
    { dateStr: '2026-09-25', displayDate: '24/09', defaultStatus: 'Libre', defaultColor: 'green' },
    { dateStr: '2026-09-26', displayDate: '25/09', defaultStatus: 'Libre', defaultColor: 'green' },
    { dateStr: '2026-09-27', displayDate: '26/09', defaultStatus: 'Libre', defaultColor: 'green' },
  ];

  // Helper to determine status and color based on real turnos
  const getCellData = (item) => {
    // Count real turnos for this day
    const dayTurnos = turnos.filter(t => {
      const inicio = t.fecha_hora_inicio || '';
      return inicio.startsWith(item.dateStr);
    });

    let status = item.defaultStatus;
    let color = item.defaultColor;

    if (dayTurnos.length > 0) {
      if (dayTurnos.length >= 3) {
        status = 'Lleno';
        color = 'red';
      } else {
        status = 'Ocupado';
        color = 'yellow';
      }
    }

    return { ...item, status, color, turnosCount: dayTurnos.length };
  };

  const getColorClasses = (color, isSelected) => {
    let base = '';
    switch (color) {
      case 'green':
        base = 'bg-[#A7F3D0] hover:bg-[#86EFAC] text-gray-900';
        break;
      case 'yellow':
        base = 'bg-[#FDE047] hover:bg-[#FACC15] text-gray-900';
        break;
      case 'red':
        base = 'bg-[#F87171] hover:bg-[#EF4444] text-gray-900';
        break;
      case 'gray':
      default:
        base = 'bg-[#D1D5DB] hover:bg-[#9CA3AF] text-gray-900';
        break;
    }

    if (isSelected) {
      base += ' ring-4 ring-teal-600 scale-[1.02] shadow-md z-10';
    }

    return base;
  };

  return (
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
        {defaultGrid.map((item, index) => {
          const cell = getCellData(item);
          const isSelected = selectedDate === cell.dateStr;
          const colorClasses = getColorClasses(cell.color, isSelected);

          return (
            <div
              key={`${cell.dateStr}-${index}`}
              onClick={() => {
                if (interactive && onSelectDate) {
                  onSelectDate(cell.dateStr);
                }
              }}
              className={`
                h-16 sm:h-20 md:h-24 p-2 sm:p-2.5 rounded-xl border border-gray-900/80 flex flex-col justify-between
                transition-all duration-150 ${colorClasses}
                ${interactive ? 'cursor-pointer' : ''}
              `}
            >
              {/* Date (e.g. "15/09") */}
              <div className="text-xs sm:text-sm md:text-base font-bold text-left text-gray-900 tracking-tight">
                {cell.displayDate}
              </div>

              {/* Status label (e.g. "Libre", "Ocupado", "Lleno") */}
              <div className="text-[11px] sm:text-xs md:text-sm font-medium text-left text-gray-800">
                {cell.status}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
