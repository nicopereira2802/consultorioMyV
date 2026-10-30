/** @format */

import { Plus, Minus, Tag, ChevronDown, ChevronUp, Banknote, Scale, Layers } from "lucide-react";
import { formatFechaHoraTabla } from "../../../utils";

export function VistaCronologica({ movimientosUnificados, onVerCuotas }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
      <div className="divide-y divide-gray-100">
        {movimientosUnificados.length === 0 ? (
          <p className="text-xs text-gray-400 italic text-center py-8">Sin movimientos registrados.</p>
        ) : (
          movimientosUnificados.map((m) => {
            const esIngreso = m.tipo === "ingreso";
            return (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50/60 transition-colors">
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

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-sm font-black ${esIngreso ? "text-emerald-600" : "text-rose-600"}`}>
                      {esIngreso ? "+" : "-"}${m.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="block text-[10px] text-gray-400">{m.comprobante}</span>
                  </div>

                  {esIngreso && m.cobroOriginal && onVerCuotas && (
                    <button
                      type="button"
                      onClick={() => onVerCuotas(m.cobroOriginal)}
                      className="px-2.5 py-1.5 text-xs font-bold text-[#2eb086] hover:bg-[#e8f7f1] rounded-xl transition-colors cursor-pointer border border-[#2eb086]/30 flex items-center gap-1"
                      title="Ver detalle del cobro y cuotas"
                    >
                      <Layers size={14} />
                      <span>Cuotas</span>
                    </button>
                  )}
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

export function VistaPendientes({
  turnosPendientes,
  abrirCobroParaTurno,
  abrirGestionCuotas,
  onVerBalance,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden divide-y divide-gray-100">
      {turnosPendientes.length === 0 ? (
        <p className="text-xs text-gray-400 italic text-center py-8">
          ¡Genial! No hay atenciones pendientes de cobro.
        </p>
      ) : (
        turnosPendientes.map((t) => {
          const tieneCobro = Boolean(t.Cobro);
          const totalDeuda = t.total_deuda !== undefined ? t.total_deuda : (t.precio_final || 0);
          const saldoPendiente = t.saldo_pendiente !== undefined ? t.saldo_pendiente : totalDeuda;
          const totalPagado = t.total_pagado !== undefined ? t.total_pagado : 0;
          const cantCuotas = t.Cobro?.cant_cuotas || 1;
          const esPlanCuotas = cantCuotas > 1;

          return (
            <div
              key={t.id_turno}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-gray-800 text-sm">
                    {t.Paciente ? `${t.Paciente.apellido}, ${t.Paciente.nombre}` : `Paciente #${t.id_paciente}`}
                  </span>
                  {tieneCobro && (
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        esPlanCuotas
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {esPlanCuotas ? `Plan ${cantCuotas} Cuotas` : "Pago Parcial / En Cuenta"}
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-400 flex flex-wrap items-center gap-1.5">
                  <span>{formatFechaHoraTabla(t.fecha_hora_inicio)}</span>
                  <span>•</span>
                  <span>{t.notas_consulta || "Consulta de atención"}</span>
                </div>

                {totalPagado > 0 && (
                  <div className="text-[11px] text-gray-500 font-medium">
                    Abonado hasta ahora:{" "}
                    <strong className="text-emerald-600">
                      ${totalPagado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </strong>{" "}
                    de ${Number(totalDeuda).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                    Saldo Pendiente
                  </span>
                  <span className="font-black text-rose-500 text-base">
                    ${Number(saldoPendiente).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* BOTÓN DE BALANCE DE CUENTA CORRIENTE */}
                <button
                  type="button"
                  onClick={() => onVerBalance && onVerBalance(t.id_paciente || t.Paciente?.id_paciente)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer border border-blue-100"
                  title="Consultar Balance de Cuenta Corriente"
                >
                  <Scale size={16} />
                </button>

                {tieneCobro ? (
                  <button
                    type="button"
                    onClick={() =>
                      abrirGestionCuotas && abrirGestionCuotas({ ...t.Cobro, Paciente: t.Paciente })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    title="Gestionar cuotas y registrar nuevos abonos"
                  >
                    <Layers size={14} />
                    <span>Gestionar Cuotas</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => abrirCobroParaTurno(t)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2eb086] hover:bg-[#259370] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    title="Registrar cobro para este turno"
                  >
                    <Plus size={14} />
                    <span>Registrar Cobro</span>
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
