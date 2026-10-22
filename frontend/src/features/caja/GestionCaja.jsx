/** @format */

import { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import { formatFechaTabla, formatFechaHoraTabla } from "../../utils/index";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  Minus,
  Search,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Tag,
  Banknote,
} from "lucide-react";

import Header from "../../components/common/Header";
import PageLayout from "../../components/layout/PageLayout";

// HOOKS Y FORMULARIOS DE GASTOS
import { useCategoriasGastosCatalogo } from "../gastos/hooks/useCategoriasGastosCatalogo";
import { useGastoActions } from "../gastos/hooks/useGastoActions";
import { FormularioCrearEditar as FormularioGasto } from "../gastos/components/FormulariosGasto";

// HOOKS Y FORMULARIOS DE COBROS
import { FormularioCrearEditarCobro as FormularioCobro } from "../cobros/components/FormulariosCobro";
import { useCobroActions } from "../cobros/hooks/useCobroActions";

const ESTADO_INICIAL_GASTO = {
  id_categoria_gasto: "",
  monto: "",
  concepto: "",
  fecha_gasto: new Date().toISOString().split("T")[0],
  metodo_pago: "Efectivo",
  comprobante: "",
  notas: "",
};

const ESTADO_INICIAL_COBRO = {
  id_paciente: "",
  id_turno: "",
  monto_a_cobrar: "",
  modalidad: "Contado",
  cant_cuotas: 1,
  metodo_pago: "Efectivo",
  notas: "",
};

export default function GestionCaja() {
  const [cargando, setCargando] = useState(false);
  const [gastos, setGastos] = useState([]);
  const [cobros, setCobros] = useState([]);
  const [turnosPendientes, setTurnosPendientes] = useState([]);

  // Estados de Modales Rápidos desde Caja
  const [modalGastoAbierto, setModalGastoAbierto] = useState(false);
  const [modalCobroAbierto, setModalCobroAbierto] = useState(false);

  const [datosGasto, setDatosGasto] = useState(ESTADO_INICIAL_GASTO);
  const [datosCobro, setDatosCobro] = useState(ESTADO_INICIAL_COBRO);

  // Catalogo de Categorías de Gastos
  const { categorias, recargarCategorias } = useCategoriasGastosCatalogo();

  // Filtros de Vista
  const [busqueda, setBusqueda] = useState("");
  const [vistaActiva, setVistaActiva] = useState("cronologico"); // 'cronologico' | 'mayor' | 'pendientes'
  const [categoriaAbierta, setCategoriaAbierta] = useState(null);

  useEffect(() => {
    cargarDatosCaja();
  }, []);

  const cargarDatosCaja = async () => {
    setCargando(true);
    try {
      const resGastos = await api.get("/gastos?limit=1000");
      setGastos(resGastos.data.data || []);

      const resCobros = await api.get("/cobros?limit=1000");
      setCobros(resCobros.data.data || []);

      const resTurnos = await api.get("/turnos/atendidos");
      setTurnosPendientes(resTurnos.data.data || []);
    } catch (error) {
      console.error("Error al cargar los datos de caja:", error);
    } finally {
      setCargando(false);
    }
  };

  // ACCIONES API (GASTOS Y COBROS)
  const { guardarGasto } = useGastoActions(cargarDatosCaja, () => setModalGastoAbierto(false));
  const { guardarCobro } = useCobroActions(cargarDatosCaja, () => setModalCobroAbierto(false));

  // Abrir Cobro para un Turno Específico de la lista de Pendientes
  const abrirCobroParaTurno = (turno) => {
    setDatosCobro({
      ...ESTADO_INICIAL_COBRO,
      id_paciente: turno.id_paciente,
      id_turno: turno.id_turno,
      monto_a_cobrar: turno.precio_final || "",
    });
    setModalCobroAbierto(true);
  };

  // ─── CÁLCULOS FINANCIEROS KPI ───
  const kpis = useMemo(() => {
    let totalIngresos = 0;
    cobros.forEach((c) => {
      const pagado = (c.Cuotas || c.Cuota || []).reduce((acc, q) => acc + (Number(q.monto_cobrado) || 0), 0);
      totalIngresos += pagado;
    });

    const totalEgresos = gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
    const totalPendienteCobro = turnosPendientes.reduce((acc, t) => acc + (Number(t.precio_final) || 0), 0);

    return {
      totalIngresos,
      totalEgresos,
      balanceNeto: totalIngresos - totalEgresos,
      totalPendienteCobro,
    };
  }, [gastos, cobros, turnosPendientes]);

  // ─── UNIFICACIÓN DE MOVIMIENTOS ───
  const movimientosUnificados = useMemo(() => {
    const listaIngresos = cobros.map((c) => ({
      id: `ingreso-${c.id_cobro}`,
      tipo: "ingreso",
      concepto: `Cobro a ${c.Paciente ? `${c.Paciente.apellido}, ${c.Paciente.nombre}` : "Paciente"}`,
      categoria: "Cobro de Atención",
      monto: (c.Cuotas || c.Cuota || []).reduce((acc, q) => acc + (Number(q.monto_cobrado) || 0), 0),
      fecha: c.fecha_cobro || c.createdAt,
      metodo_pago: c.modalidad || "Efectivo",
      comprobante: `Cobro #${c.id_cobro}`,
    }));

    const listaEgresos = gastos.map((g) => ({
      id: `egreso-${g.id_gasto}`,
      tipo: "egreso",
      concepto: g.concepto,
      categoria: g.CategoriaGasto?.nombre || "Gasto General",
      monto: Number(g.monto) || 0,
      fecha: g.fecha_gasto,
      metodo_pago: g.metodo_pago,
      comprobante: g.comprobante || `Gasto #${g.id_gasto}`,
    }));

    const unificados = [...listaIngresos, ...listaEgresos].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha),
    );

    if (busqueda.trim() === "") return unificados;

    const query = busqueda.toLowerCase();
    return unificados.filter(
      (m) =>
        m.concepto.toLowerCase().includes(query) ||
        m.categoria.toLowerCase().includes(query) ||
        m.comprobante.toLowerCase().includes(query),
    );
  }, [cobros, gastos, busqueda]);

  // ─── AGRUPACIÓN LIBRO MAYOR DE EGRESOS ───
  const egresosPorCategoria = useMemo(() => {
    const mapa = {};
    gastos.forEach((g) => {
      const catNombre = g.CategoriaGasto?.nombre || "Sin Categoría";
      if (!mapa[catNombre]) {
        mapa[catNombre] = { nombre: catNombre, total: 0, items: [] };
      }
      mapa[catNombre].total += Number(g.monto) || 0;
      mapa[catNombre].items.push(g);
    });
    return Object.values(mapa);
  }, [gastos]);

  return (
    <PageLayout>
      <div className="w-full flex-1 flex flex-col gap-4 pb-24">
        {/* HEADER CON BOTONES DE ACCIÓN RÁPIDA */}
        <Header
          icono={Wallet}
          titulo="Caja y Balance Financiero"
          subtitulo="Consolidado de ingresos, egresos operativos y cuentas por cobrar"
          badge="En línea"
          botonAccion={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setDatosGasto(ESTADO_INICIAL_GASTO);
                  setModalGastoAbierto(true);
                }}
                className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                <Minus size={16} />
                <span>+ Nuevo Gasto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDatosCobro(ESTADO_INICIAL_COBRO);
                  setModalCobroAbierto(true);
                }}
                className="flex items-center gap-1.5 bg-[#2eb086] hover:bg-[#259370] text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                <Plus size={16} />
                <span>+ Registrar Cobro</span>
              </button>
            </div>
          }
        />

        <div className="w-full px-4 flex flex-col gap-4">
          {/* BLOQUE DE KPIS */}
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

          {/* BARRA DE VISTAS Y BÚSQUEDA */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-2xs flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
              <button
                type="button"
                onClick={() => setVistaActiva("cronologico")}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  vistaActiva === "cronologico" ? "bg-white text-gray-800 shadow-2xs" : "text-gray-500"
                }`}
              >
                Movimientos Unificados
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva("mayor")}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  vistaActiva === "mayor" ? "bg-white text-gray-800 shadow-2xs" : "text-gray-500"
                }`}
              >
                Libro Mayor (Gastos)
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva("pendientes")}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  vistaActiva === "pendientes" ? "bg-white text-gray-800 shadow-2xs" : "text-gray-500"
                }`}
              >
                Por Cobrar ({turnosPendientes.length})
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar movimiento..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2eb086]/40 focus:outline-none"
              />
            </div>
          </div>

          {/* VISTAS */}
          {vistaActiva === "cronologico" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
              <div className="divide-y divide-gray-100">
                {movimientosUnificados.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-8">
                    Sin movimientos registrados.
                  </p>
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
                          <span
                            className={`text-sm font-black ${
                              esIngreso ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {esIngreso ? "+" : "-"}$
                            {m.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="block text-[10px] text-gray-400">{m.comprobante}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {vistaActiva === "pendientes" && (
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
                        {t.Paciente
                          ? `${t.Paciente.apellido}, ${t.Paciente.nombre}`
                          : `Paciente #${t.id_paciente}`}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatFechaHoraTabla(t.fecha_hora_inicio)} • {t.notas_consulta || "Sin notas"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-amber-600 text-sm">
                        ${Number(t.precio_final || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </span>
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
          )}
        </div>

        {/* MODAL PARA CREAR GASTO DESDE CAJA */}
        {modalGastoAbierto && (
          <FormularioGasto
            modalAbierto={modalGastoAbierto}
            cerrarModal={() => setModalGastoAbierto(false)}
            datosFormulario={datosGasto}
            actualizarDatos={(e) => setDatosGasto((prev) => ({ ...prev, [e.target.name]: e.target.value }))}
            categorias={categorias}
            recargarCategorias={recargarCategorias}
            guardarGasto={(e) => {
              e.preventDefault();
              guardarGasto(datosGasto, false, null);
            }}
          />
        )}

        {/* MODAL PARA REGISTRAR COBRO DESDE CAJA */}
        {modalCobroAbierto && (
          <FormularioCobro
            modalAbierto={modalCobroAbierto}
            cerrarModal={() => setModalCobroAbierto(false)}
            datosFormulario={datosCobro}
            actualizarDatos={(e) => setDatosCobro((prev) => ({ ...prev, [e.target.name]: e.target.value }))}
            turnosAtendidos={turnosPendientes} // 👈 PASAMOS LA LISTA DE TURNOS ATENDIDOS
            guardarCobro={(e) => {
              e.preventDefault();
              guardarCobro(datosCobro, false, null);
            }}
          />
        )}
      </div>
    </PageLayout>
  );
}
