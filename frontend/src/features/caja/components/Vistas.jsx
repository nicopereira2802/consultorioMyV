import { Plus, Minus, Tag, ChevronDown, ChevronUp, Banknote,Scale} from "lucide-react";
import { formatFechaHoraTabla } from "../../../utils";


export function VistaCronologica({ movimientosUnificados }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
      <div className="divide-y divide-gray-100">
        {movimientosUnificados.length === 0 ? (
          <p className="text-xs text-gray-400 italic text-center py-8">Sin movimientos registrados.</p>
        ) : (
          movimientosUnificados.map((m) => {
            const esIngreso = m.tipo === "ingreso";
            return (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50/60">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl text-xs font-bold ${
                      esIngreso ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {esIngreso ? <Plus size={18} /> : <Minus size={18} />}
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 text-sm block">{m.concepto}</span>
                    <span className="text-xs text-gray-400">
                      {formatFechaHoraTabla(m.fecha)} • {m.metodo_pago}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-sm font-black ${esIngreso ? "text-emerald-600" : "text-rose-600"}`}>
                    {esIngreso ? "+" : "-"}${m.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="block text-[10px] text-gray-400">{m.comprobante}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function VistaLibroMayor({ egresosPorCategoria, categoriaAbierta, setCategoriaAbierta }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden divide-y divide-gray-100">
      {egresosPorCategoria.length === 0 ? (
        <p className="text-xs text-gray-400 italic text-center py-8">
          Sin egresos registrados para agrupar por categoría.
        </p>
      ) : (
        egresosPorCategoria.map((cat) => {
          const estaAbierta = categoriaAbierta === cat.nombre;
          return (
            <div key={cat.nombre} className="flex flex-col">
              {/* Cabecera de la categoría (Acordeon) */}
              <button
                type="button"
                onClick={() => setCategoriaAbierta(estaAbierta ? null : cat.nombre)}
                className="p-4 flex items-center justify-between hover:bg-gray-50/60 w-full text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs">
                    <Tag size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 text-sm block">{cat.nombre}</span>
                    <span className="text-xs text-gray-400">{cat.items.length} movimientos</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-rose-600">
                    -${cat.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                  {estaAbierta ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </button>

              {/* Detalle interno de los gastos de esa categoría (al abrir el acordeón) */}
              {estaAbierta && (
                <div className="bg-gray-50/50 px-6 py-3 divide-y divide-gray-100">
                  {cat.items.map((g) => (
                    <div key={g.id_gasto} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-gray-700 block">{g.concepto}</span>
                        <span className="text-gray-400">
                          {formatFechaHoraTabla(g.fecha_gasto)} • {g.metodo_pago}
                        </span>
                      </div>
                      <span className="font-bold text-rose-600">
                        -${Number(g.monto).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export function VistaPendientes({ turnosPendientes, abrirCobroParaTurno, onVerBalance }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden divide-y divide-gray-100">
      {turnosPendientes.length === 0 ? (
        <p className="text-xs text-gray-400 italic text-center py-8">
          ¡Genial! No hay atenciones pendientes de cobro.
        </p>
      ) : (
        turnosPendientes.map((t) => (
          <div key={t.id_turno} className="p-4 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-gray-800 text-sm block">
                {t.Paciente ? `${t.Paciente.apellido}, ${t.Paciente.nombre}` : `Paciente #${t.id_paciente}`}
              </span>
              <span className="text-xs text-gray-400">
                {formatFechaHoraTabla(t.fecha_hora_inicio)} • {t.notas_consulta || "Sin notas"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-black text-amber-600 text-sm mr-1">
                ${Number(t.precio_final || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>

              {/* 👈 BOTÓN DE BALANCE DE CUENTA CORRIENTE */}
              <button
                type="button"
                onClick={() => onVerBalance && onVerBalance(t.id_paciente || t.Paciente?.id_paciente)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                title="Consultar Balance de Cuenta Corriente"
              >
                <Scale size={16} />
              </button>

              <button
                type="button"
                onClick={() => abrirCobroParaTurno(t)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2eb086] hover:bg-[#259370] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Banknote size={14} />
                <span>Cobrar Ahora</span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
