import { TrendingUp, TrendingDown, DollarSign, Clock  } from "lucide-react";

export function Kpis({ kpis }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Ingresos Totales
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-600 mt-0.5 block">
              +${kpis.totalIngresos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Egresos Totales
            </span>
            <span className="text-lg sm:text-xl font-black text-rose-600 mt-0.5 block">
              -${kpis.totalEgresos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
            <TrendingDown size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Balance en Caja
            </span>
            <span
              className={`text-lg sm:text-xl font-black mt-0.5 block ${
                kpis.balanceNeto >= 0 ? "text-gray-800" : "text-rose-600"
              }`}
            >
              ${kpis.balanceNeto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#e8f7f1] text-[#2eb086] border border-[#2eb086]/20">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Pendiente por Cobrar
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-600 mt-0.5 block">
              ${kpis.totalPendienteCobro.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <Clock size={22} />
          </div>
        </div>
      </div>
    </>
  );
}
