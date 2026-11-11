/** @format */
//* useState y useMemo
import { useState, useMemo } from "react";
import ModalBalancePaciente from "../cobros/components/ModalBalancePaciente";

//* ICONOS
import { Wallet, Plus, Minus, Search } from "lucide-react";

//* COMPONENTES COMUNES
import Header from "../../components/common/Header";
import PageLayout from "../../components/layout/PageLayout";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";

//* COMPONENTES DE VISTA Y PERIODO
import { VistaCronologica, VistaLibroMayor, VistaPendientes } from "./components/Vistas";
import { SelectorPeriodo } from "./components/SelectorPeriodo";
import { Kpis } from "./components/Kpis";

//* HOOKS
import { useMovimientosCaja } from "./hooks/useMovimientosCaja";
import { useCajaSearchPagination } from "./hooks/useCajaSearchPagination";

//* HOOKS Y FORMULARIOS GASTOS
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { useCategoriasGastosCatalogo } from "../gastos/hooks/useCategoriasGastosCatalogo";
import { useGastoActions } from "../gastos/hooks/useGastoActions";
import { FormularioCrearEditar as FormularioGasto } from "../gastos/components/FormulariosGasto";

//* HOOKS Y FORMULARIOS COBROS
import { FormularioCrearEditarCobro as FormularioCobro } from "../cobros/components/FormulariosCobro";
import FormularioCuotas from "../cobros/components/FormulariosCuota";
import { useCobroActions } from "../cobros/hooks/useCobroActions";

//* CONSTANTES
import { ESTADO_INICIAL_COBRO, ESTADO_INICIAL_GASTO } from "./constants/cajaConstants";

export default function GestionCaja() {
  //* VARIABLES GENERALES
  const [vistaActiva, setVistaActiva] = useState("cronologico"); // 'cronologico' | 'ingresos' | 'mayor' | 'pendientes'
  const [categoriaAbierta, setCategoriaAbierta] = useState(null);
  const [pacienteBalanceId, setPacienteBalanceId] = useState(null);
  const [cobroParaCuotas, setCobroParaCuotas] = useState(null);

  //* HOOK DE PAGINACIÓN Y FILTRO POR MES
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

    fechaMes,
    setFechaMes,
    resumenPeriodo,

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

  //* HOOK DE CÁLCULOS Y KPIS (Ahora sincronizados con el mes)
  const { kpis, movimientosUnificados, turnosFiltrados } = useMovimientosCaja(
    cobros,
    gastos,
    turnosPendientes,
    search,
    resumenPeriodo
  );

  //* RECARGA CONJUNTA
  const recargarTodo = () => {
    if (typeof recargar === "function") recargar();
  };

  //* HOOK DE PETICIONES API
  const { guardarGasto } = useGastoActions(recargarTodo, () => cerrarModalGasto());
  const { guardarCobro } = useCobroActions(recargarTodo, () => cerrarModalCobro());

  //* ABRIR MODAL PARA COBRAR UN TURNO
  const abrirCobroParaTurno = (turno) => {
    const idPaciente = turno.id_paciente || turno.Paciente?.id_paciente || "";
    const idTurno = turno.id_turno;
    const precio = turno.saldo_pendiente !== undefined ? turno.saldo_pendiente : (turno.precio_final || turno.total || "");

    abrirParaCrearCobro({
      ...ESTADO_INICIAL_COBRO,
      id_turno: String(idTurno),
      id_paciente: String(idPaciente),
      monto_a_cobrar: String(precio),
      monto_abonado: String(precio),
      modalidad: "",
      metodo_pago: "Efectivo",
      cobrar_primera_cuota: true,
    });
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
        {/* HEADER PRINCIPAL */}
        <Header
          icono={Wallet}
          titulo="Caja y Balance Financiero"
          subtitulo="Consolidado de ingresos, egresos operativos y cuentas por cobrar"
          badge="En línea"
          botonAccion={
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => abrirParaCrearGasto()}
                className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                <Minus size={16} />
                <span>Nuevo Gasto</span>
              </button>

              <button
                type="button"
                onClick={() => abrirParaCrearCobro()}
                className="flex items-center gap-1.5 bg-[#2eb086] hover:bg-[#259370] text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                <Plus size={16} />
                <span>Registrar Cobro</span>
              </button>
            </div>
          }
        />

        <div className="w-full px-4 flex flex-col gap-4">
          {/* SELECTOR DE MES / PERÍODO */}
          <SelectorPeriodo fechaMes={fechaMes} onCambiarMes={setFechaMes} />

          {/* BODY: KPIS DEL PERÍODO */}
          <Kpis kpis={kpis} />

          {/* BARRA DE VISTAS */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-2xs flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
              <button
                type="button"
                onClick={() => setVistaActiva("cronologico")}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  vistaActiva === "cronologico" ? "bg-white text-gray-800 shadow-2xs" : "text-gray-500"
                }`}
              >
                Detalle de Operaciones
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva("ingresos")}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  vistaActiva === "ingresos" ? "bg-white text-gray-800 shadow-2xs" : "text-gray-500"
                }`}
              >
                Detalle Ingresos
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva("mayor")}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  vistaActiva === "mayor" ? "bg-white text-gray-800 shadow-2xs" : "text-gray-500"
                }`}
              >
                Detalle Egresos
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva("pendientes")}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  vistaActiva === "pendientes" ? "bg-white text-gray-800 shadow-2xs" : "text-gray-500"
                }`}
              >
                Por Cobrar ({(turnosFiltrados || []).length})
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

          {/* VISTA: CRONOLÓGICA */}
          {vistaActiva === "cronologico" && (
            <div className="flex flex-col gap-4">
              <VistaCronologica
                movimientosUnificados={movimientosUnificados}
                onVerCuotas={(cobro) => setCobroParaCuotas(cobro)}
              />
              <TablaPaginacion page={pageCobro} setPage={setPageCobro} totalPages={totalPagesCobro} />
            </div>
          )}

          {/* VISTA: DETALLE INGRESOS */}
          {vistaActiva === "ingresos" && (
            <div className="flex flex-col gap-4">
              <VistaCronologica
                movimientosUnificados={movimientosUnificados.filter((m) => m.tipo === "ingreso")}
                onVerCuotas={(cobro) => setCobroParaCuotas(cobro)}
              />
              <TablaPaginacion page={pageCobro} setPage={setPageCobro} totalPages={totalPagesCobro} />
            </div>
          )}

          {/* VISTA: LIBRO MAYOR */}
          {vistaActiva === "mayor" && (
            <div className="flex flex-col gap-4">
              <VistaLibroMayor
                egresosPorCategoria={egresosPorCategoria}
                categoriaAbierta={categoriaAbierta}
                setCategoriaAbierta={setCategoriaAbierta}
              />
              <TablaPaginacion page={pageGasto} setPage={setPageGasto} totalPages={totalPagesGasto} />
            </div>
          )}

          {/* VISTA: PENDIENTES */}
          {vistaActiva === "pendientes" && (
            <div className="flex flex-col gap-4">
              <VistaPendientes
                turnosPendientes={turnosFiltrados}
                abrirCobroParaTurno={abrirCobroParaTurno}
                abrirGestionCuotas={(cobro) => setCobroParaCuotas(cobro)}
                onVerBalance={(id) => setPacienteBalanceId(id)}
              />
            </div>
          )}
        </div>

        {/* MODAL: CREAR / EDITAR GASTO */}
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
              guardarGasto(datosGasto, editandoGasto, gastoSeleccionado);
            }}
          />
        )}

        {/* MODAL: CREAR / EDITAR COBRO */}
        {modalCobroAbierto && (
          <FormularioCobro
            modalAbierto={modalCobroAbierto}
            cerrarModal={cerrarModalCobro}
            editando={editandoCobro}
            datosFormulario={datosCobro}
            actualizarDatos={actualizarDatosCobro}
            turnosAtendidos={turnosFiltrados}
            procesarFormulario={(e) => {
              e.preventDefault();
              guardarCobro(datosCobro, editandoCobro, cobroSeleccionado);
            }}
          />
        )}

        {/* MODAL: GESTIÓN DE CUOTAS Y PAGOS */}
        {cobroParaCuotas && (
          <FormularioCuotas
            modalCuotas={Boolean(cobroParaCuotas)}
            cerrarModal={() => {
              setCobroParaCuotas(null);
              recargarTodo();
            }}
            cobroSeleccionado={cobroParaCuotas}
            recarcarCobros={recargarTodo}
          />
        )}

        {/* MODAL: BALANCE DE CUENTA CORRIENTE */}
        {pacienteBalanceId && (
          <ModalBalancePaciente
            isOpen={Boolean(pacienteBalanceId)}
            onClose={() => setPacienteBalanceId(null)}
            idPaciente={pacienteBalanceId}
          />
        )}
      </div>
            {/* BOTONES FLOTANTES (SOLO MOBILE): "−" nuevo gasto y "+" registrar cobro */}
      <button
        type="button"
        onClick={() => abrirParaCrearGasto()}
        aria-label="Nuevo gasto"
        className="fixed sm:hidden right-4 bottom-[8.25rem] z-40 bg-rose-500 hover:bg-rose-600 text-white w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 focus:outline-none"
      >
        <Minus size={20} />
      </button>

      <button
        type="button"
        onClick={() => abrirParaCrearCobro()}
        aria-label="Registrar cobro"
        className="fixed sm:hidden right-4 bottom-18 z-40 bg-[#2eb086] hover:bg-[#259370] text-white w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 focus:outline-none"
      >
        <Plus size={20} />
      </button>
    </PageLayout>
  );
}