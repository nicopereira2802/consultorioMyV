/** @format */

import {
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Tag,
  Ban,
  FileText,
} from "lucide-react";

//* COMPONENTES COMUNES
import Header from "../components/common/Header";
import Tabla from "../components/common/Tabla/Tabla";
import TablaHeader from "../components/common/Tabla/TablaHeader";
import TablaPaginacion from "../components/common/Tabla/TablaPaginacion";
import PageLayout from "../components/layout/PageLayout";

//* HOOKS
import { useCRUDModal } from "../hooks/useCRUDModal";
import { usePaginationSearch } from "../hooks/usePaginationSearch";
import { useGastoActions } from "../features/gastos/hooks/useGastoActions";
import { useCategoriasGastosCatalogo } from "../features/gastos/hooks/useCategoriasGastosCatalogo";

//* UTILS
import { formatFechaTabla } from "../utils/index";
import { formatearGastoParaEditar } from "../features/gastos/utils/formatearGastoParaEditar";

//* FORMULARIOS
import { FormularioCrearEditar, FormularioEliminar, FormularioToggle } from "../features/gastos/components/FormulariosGasto";

const ESTADO_INICIAL = {
  id_categoria_gasto: "",
  monto: "",
  concepto: "",
  fecha_gasto: new Date().toISOString().split("T")[0],
  metodo_pago: "Efectivo",
  comprobante: "",
  notas: "",
};

export default function GestionGastos() {
  //* HOOK DE PAGINACIÓN Y BÚSQUEDA
  const {
    datos: gastos,
    cargando,
    page,
    setPage,
    total,
    totalPages,
    search,
    setSearch,
    inicioRegistro,
    finRegistro,
    recargar,
  } = usePaginationSearch("/gastos");

  //* HOOK DE CATEGORÍAS
  const { categorias, cargandoCategorias, recargarCategorias } = useCategoriasGastosCatalogo();

  //* HOOK DE CRUD MODAL
  const {
    modalAbierto,
    modalToggle,
    modalEliminar,
    editando,
    itemSeleccionado: gastoSeleccionado,
    datosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaToggle,
    abrirParaEliminar,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL);

  //* HOOK DE ACCIONES API
  const { guardarGasto, toggleGasto, eliminarGasto } = useGastoActions(recargar, cerrarModal);

  return (
    <PageLayout onAdd={abrirParaCrear}>
      <div className="w-full flex-1 flex flex-col gap-4 pb-24">
        {/* HEADER */}
        <Header
          icono={TrendingDown}
          titulo="Control de Gastos"
          subtitulo="Registro y administración de egresos, compras y costos operativos"
          badge={`${total} Registrados`}
          botonAccion={
            <button
              type="button"
              onClick={abrirParaCrear}
              className="hidden sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm shrink-0"
            >
              <Plus size={18} />
              <span>Nuevo Gasto</span>
            </button>
          }
        />

        {/* TABLA */}
        <div className="flex-1 w-full min-h-0 p-4 pt-0 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <TablaHeader
              inicioRegistro={inicioRegistro}
              finRegistro={finRegistro}
              total={total}
              search={search}
              setSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Buscar gasto por concepto o comprobante..."
            />

            <div className="overflow-x-auto flex-1">
              <Tabla
                cargando={cargando}
                search={search}
                sinDatosText="No se encontraron gastos registrados."
                columnas={[
                  { label: "Concepto" },
                  { label: "Categoría" },
                  { label: "Fecha" },
                  { label: "Monto" },
                  { label: "Método de Pago", className: "hidden md:table-cell" },
                  { label: "Estado" },
                  { label: "Acciones", align: "center" },
                ]}
              >
                {gastos.map((gasto) => (
                  <tr key={gasto.id_gasto} className="hover:bg-gray-50/60 transition-colors">
                    {/* CONCEPTO & COMPROBANTE */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 text-sm">{gasto.concepto}</span>
                        {gasto.comprobante && (
                          <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <FileText size={12} />
                            {gasto.comprobante}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* CATEGORÍA */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200">
                        <Tag size={12} className="text-[#2eb086]" />
                        {gasto.CategoriaGasto?.nombre || `Categoría #${gasto.id_categoria_gasto}`}
                      </span>
                    </td>

                    {/* FECHA */}
                    <td className="px-6 py-4 text-gray-600 text-sm whitespace-nowrap">
                      {formatFechaTabla(gasto.fecha_gasto)}
                    </td>

                    {/* MONTO */}
                    <td className="px-6 py-4 font-bold text-rose-600 text-sm">
                      -${Number(gasto.monto).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>

                    {/* MÉTODO PAGO */}
                    <td className="hidden md:table-cell px-6 py-4 text-gray-600 text-sm">
                      {gasto.metodo_pago}
                    </td>

                    {/* ESTADO */}
                    <td className="px-6 py-4">
                      {gasto.activo ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <CheckCircle2 size={14} />
                          <span>Activo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                          <XCircle size={14} />
                          <span>Inactivo</span>
                        </span>
                      )}
                    </td>

                    {/* ACCIONES */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => abrirParaEditar(gasto, formatearGastoParaEditar)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar Gasto"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirParaToggle(gasto)}
                          className={`p-2 rounded-lg transition-colors ${
                            gasto.activo
                              ? "text-red-500 hover:bg-red-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {gasto.activo ? <Ban size={18} /> : <RotateCcw size={18} />}
                        </button>
                        {!gasto.activo && (
                          <button
                            type="button"
                            onClick={() => abrirParaEliminar(gasto)}
                            className="p-2 rounded-lg transition-colors text-red-500 hover:bg-red-50"
                            title="Eliminar Gasto"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </Tabla>
            </div>

            {/* PAGINACIÓN */}
            <TablaPaginacion page={page} setPage={setPage} totalPages={totalPages} />
          </div>
        </div>

        {/* MODALES CREAR Y EDITAR */}
        {modalAbierto && (
          <FormularioCrearEditar
            guardarGasto={(e) => {
              e.preventDefault();
              guardarGasto(datosFormulario, editando, gastoSeleccionado);
            }}
            modalAbierto={modalAbierto}
            cerrarModal={cerrarModal}
            editando={editando}
            datosFormulario={datosFormulario}
            actualizarDatos={actualizarDatos}
            categorias={categorias}
            recargarCategorias={recargarCategorias}
          />
        )}

        {/* MODAL TOGGLE */}
        {modalToggle && (
          <FormularioToggle
            modalToggle={modalToggle}
            cerrarModal={cerrarModal}
            gastoSeleccionado={gastoSeleccionado}
            toggleGasto={() => toggleGasto(gastoSeleccionado)}
          />
        )}

        {/* MODAL ELIMINAR */}
        {modalEliminar && (
          <FormularioEliminar
            modalEliminar={modalEliminar}
            cerrarModal={cerrarModal}
            gastoSeleccionado={gastoSeleccionado}
            eliminarGasto={() => eliminarGasto(gastoSeleccionado)}
          />
        )}
      </div>
    </PageLayout>
  );
}
