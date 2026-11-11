/** @format */
import { useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export function SelectorPeriodo({ fechaMes, onCambiarMes }) {
  const nombreMes = useMemo(() => {
    return fechaMes.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });
  }, [fechaMes]);

  const mesAnterior = () => {
    const nueva = new Date(fechaMes);
    nueva.setMonth(nueva.getMonth() - 1);
    onCambiarMes(nueva);
  };

  const mesSiguiente = () => {
    const nueva = new Date(fechaMes);
    nueva.setMonth(nueva.getMonth() + 1);
    onCambiarMes(nueva);
  };

  const mesActual = () => {
    onCambiarMes(new Date());
  };

  const esMesActual = useMemo(() => {
    const hoy = new Date();
    return (
      hoy.getMonth() === fechaMes.getMonth() &&
      hoy.getFullYear() === fechaMes.getFullYear()
    );
  }, [fechaMes]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-2xs flex flex-col sm:flex-row justify-between items-center gap-3">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-emerald-50 text-[#2eb086] rounded-xl">
          <Calendar size={18} />
        </div>
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Período de caja
          </span>
          <span className="text-sm sm:text-base font-extrabold text-gray-800 capitalize">
            {nombreMes}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl w-full sm:w-auto justify-between sm:justify-end">
        <button
          type="button"
          onClick={mesAnterior}
          className="p-1.5 hover:bg-white text-gray-600 hover:text-gray-900 rounded-lg transition-all cursor-pointer"
          title="Mes anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          type="button"
          onClick={mesActual}
          disabled={esMesActual}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            esMesActual
              ? "bg-white text-[#2eb086] shadow-2xs cursor-default"
              : "text-gray-500 hover:text-gray-800 hover:bg-white"
          }`}
        >
          Mes Actual
        </button>

        <button
          type="button"
          onClick={mesSiguiente}
          className="p-1.5 hover:bg-white text-gray-600 hover:text-gray-900 rounded-lg transition-all cursor-pointer"
          title="Mes siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}