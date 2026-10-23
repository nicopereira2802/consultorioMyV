/** @format */
//* useState y useMemo
import { useState, useMemo } from "react";

//* ICONOS
import { Wallet, TrendingUp, TrendingDown, Clock, Plus, Minus, Search, DollarSign } from "lucide-react";

//* COMPONENTES COMUNES
import Header from "../../components/common/Header";
import PageLayout from "../../components/layout/PageLayout";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";

//* COMPONENTES DE VISTA
import { VistaCronologica, VistaLibroMayor, VistaPendientes } from "./components/Vistas";

//* HOOKS
import { useMovimientosCaja } from "./hooks/useMovimientosCaja";

//* HOOKS Y FORMULARIOS GASTOS
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { useCategoriasGastosCatalogo } from "../gastos/hooks/useCategoriasGastosCatalogo";
import { useGastoActions } from "../gastos/hooks/useGastoActions";
import { FormularioCrearEditar as FormularioGasto } from "../gastos/components/FormulariosGasto";

//* HOOKS Y FORMULARIOS COBROS
import { FormularioCrearEditarCobro as FormularioCobro } from "../cobros/components/FormulariosCobro";
import { useCobroActions } from "../cobros/hooks/useCobroActions";
import { useCajaSearchPagination } from "./hooks/useCajaSearchPagination";

//* CONSTANTES
import { ESTADO_INICIAL_COBRO, ESTADO_INICIAL_GASTO } from "./constants/cajaConstants";
import { Kpis } from "./components/Kpis";

export default function GestionCaja() {
  //* VARIABLES GENERALES
  const [vistaActiva, setVistaActiva] = useState("cronologico"); // 'cronologico' | 'mayor' | 'pendientes'
  const [categoriaAbierta, setCategoriaAbierta] = useState(null);

  //* HOOK DE PAGINACIÓN
  const {
    cobros,
    gastos,
    turnosPendientes,
    cargando,

    pageCobro,
    setPageCobro,
    totalCobro,
    totalPagesCobro,
    pageGasto,
    setPageGasto,
    totalGasto,
    totalPagesGasto,

    search,
    setSearch,
    order,
    setOrder,

    inicioRegistroCobro,
    finRegistroCobro,
    inicioRegistroGasto,
    finRegistroGasto,
    recargar,
  } = useCajaSearchPagination();

  //* HOOK DE CRUD MODAL GASTO
  const {
    modalAbierto: modalGastoAbierto,
    modalEliminar: modalGastoEliminar,
    editando: editandoGasto,
    itemSeleccionado: gastoSeleccionado,
    datosFormulario: datosGasto,
    abrirParaCrear: abrirParaCrearGasto,
    abrirParaEditar: abrirParaEditarGasto,
    abrirParaEliminar: abrirParaEliminarGasto,
    cerrarModal: cerrarModalGasto,
    actualizarDatos: actualizarDatosGasto,
  } = useCRUDModal(ESTADO_INICIAL_GASTO);

  //* HOOK DE CRUD MODAL COBRO
  const {
    modalAbierto: modalCobroAbierto,
    modalEliminar: modalCobroEliminar,
    editando: editandoCobro,
    itemSeleccionado: cobroSeleccionado,
    datosFormulario: datosCobro,
    abrirParaCrear: abrirParaCrearCobro,
    abrirParaEditar: abrirParaEditarCobro,
    abrirParaEliminar: abrirParaEliminarCobro,
    cerrarModal: cerrarModalCobro,
    actualizarDatos: actualizarDatosCobro,
  } = useCRUDModal(ESTADO_INICIAL_COBRO);

  //* HOOK DE CATEGORIAS PARA GASTOS
  const { categorias, recargarCategorias } = useCategoriasGastosCatalogo();

  //* HOOK DE CALCULOS
  const { kpis, movimientosUnificados } = useMovimientosCaja(cobros, gastos, turnosPendientes, search);

  //* HOOK DE PETICIONES API
  const { guardarGasto } = useGastoActions(recargar, () => cerrarModalGasto());
  const { guardarCobro } = useCobroActions(recargar, () => cerrarModalCobro());

  //* ABRIR MODAL PARA COBRAR UN TURNO
  const abrirCobroParaTurno = (turno) => {
    actualizarDatosCobro({
      ...ESTADO_INICIAL_COBRO,
      id_paciente: turno.id_paciente,
      id_turno: turno.id_turno,
      monto_a_cobrar: turno.precio_final || "",
    });
    abrirParaCrearCobro(turno);
  };

  //* MAPEA LOS EGRESOS POR CATEGORIAS
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
        {/* //* HEADER PRINCIPAL */}
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
                  abrirParaCrearGasto();
                }}
                className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                <Minus size={16} />
                <span>+ Nuevo Gasto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  abrirParaCrearCobro();
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
          {/* //* BODY: KPIS (METRICAS PARA VER EL RENDIMINETO) */}
          <Kpis kpis={kpis} />

          {/* //* VISTAS: BARRA DE VISTAS */}
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2eb086]/40 focus:outline-none"
              />
            </div>
          </div>

          {/* //* VISTAS: CRONOLOGICA */}
          {vistaActiva === "cronologico" && (
            <div className="flex flex-col gap-4">
              <VistaCronologica movimientosUnificados={movimientosUnificados} />

              {/* Si el cronológico maneja cobros/gastos combinados, 
                  puedes elegir qué paginación mostrar o extender tu hook */}
              <TablaPaginacion page={pageCobro} setPage={setPageCobro} totalPages={totalPagesCobro} />
            </div>
          )}

          {/* //* VISTA: LIBRO MAYOR (EGRESOS POR CATEGORÍA) */}
          {vistaActiva === "mayor" && (
            <div className="flex flex-col gap-4">
              <VistaLibroMayor
                egresosPorCategoria={egresosPorCategoria}
                categoriaAbierta={categoriaAbierta}
                setCategoriaAbierta={setCategoriaAbierta}
              />

              {/* Paginación específica para Gastos */}
              <TablaPaginacion page={pageGasto} setPage={setPageGasto} totalPages={totalPagesGasto} />
            </div>
          )}

          {/* //* VISTAS: PENDIENTES */}
          {vistaActiva === "pendientes" && (
            <div className="flex flex-col gap-4">
              <VistaPendientes
                turnosPendientes={turnosPendientes}
                abrirCobroParaTurno={abrirCobroParaTurno}
              />
              {/* Agregar paginación de pendientes si el hook la soporta */}
            </div>
          )}
        </div>

        {/* //* MODALES: CREAR GASTO */}
        {modalGastoAbierto && (
          <FormularioGasto
            modalAbierto={modalGastoAbierto}
            cerrarModal={cerrarModalGasto}
            datosFormulario={datosGasto}
            actualizarDatos={actualizarDatosGasto}
            categorias={categorias}
            recargarCategorias={recargarCategorias}
            guardarGasto={(e) => {
              e.preventDefault();
              guardarGasto(datosGasto, false, null);
            }}
          />
        )}

        {/* //* MODALES: CREAR COBRO */}
        {modalCobroAbierto && (
          <FormularioCobro
            modalAbierto={modalCobroAbierto}
            cerrarModal={cerrarModalCobro}
            datosFormulario={datosCobro}
            actualizarDatos={actualizarDatosCobro}
            turnosAtendidos={turnosPendientes}
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
