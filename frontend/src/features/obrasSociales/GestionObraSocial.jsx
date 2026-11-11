/** @format */

//* IMPORTACION DE ICONOS Y useEffect
import { Shield, Plus, Edit, Trash2, CheckCircle2, XCircle, RotateCcw, Ban } from "lucide-react";

//* IMPORTACION DE COMPONENTES COMUNES REUTILIZABLES
import Header from "../../components/common/Header";
import BadgeInicial from "../../components/common/BadgeInicial";
import Tabla from "../../components/common/Tabla/Tabla";
import TablaHeader from "../../components/common/Tabla/TablaHeader";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";

// * PAGELAYOUT (PARA EL BOTON)
import PageLayout from "../../components/layout/PageLayout";

//* HOOKS
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { usePaginationSearch } from "../../hooks/usePaginationSearch";

// * FUNCIONES PARA FORMATEAR FECHAS
import { formatearObraSocialParaEditar } from "./utils/formatearObraSocialParaEditar";

//* IMPORTACION DE FORMULARIOS
import {
  FormularioCrearEditar,
  FormularioToggle,
  FormularioEliminar,
} from "./components/FormularioObraSocial";
import { useObraSocialActions } from "./hooks/useObraSocialActions";

const ESTADO_INICIAL = { nombre: "" };

export default function GestionObrasSociales() {
  //* CARGAMOS CON DATOS LOS HOOKS
  const {
    datos: obrasSociales,
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
  } = usePaginationSearch("/obras-sociales");

  const {
    modalAbierto,
    modalToggle,
    modalEliminar,
    editando,
    itemSeleccionado: obraSocialSeleccionada,
    datosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaToggle,
    abrirParaEliminar,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL);

  const { guardarObraSocial, toggleObraSocial, eliminarObraSocial } = useObraSocialActions(
    recargar,
    cerrarModal,
  );

  return (
    <PageLayout onAdd={abrirParaCrear}>
      <div className="w-full flex-1 flex flex-col gap-4 pb-24">
        {/* //* HEADER CON TITULO Y BOTON */}
        <Header
          icono={Shield}
          titulo="Catálogo de Obras Sociales"
          subtitulo="Gestión de coberturas médicas y mutuales del consultorio"
          badge={`${total} Registradas`}
          botonAccion={
            <button
              type="button"
              onClick={abrirParaCrear}
              className="hidden sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
            >
              <Plus size={18} />
              <span>Nueva Obra Social</span>
            </button>
          }
        />

        {/* //* BODY: TABLA */}
        <div className="flex-1 w-full min-h-0 p-4 pt-0 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            {/* //* TABLA: BARRA SUPERIOR REUTILIZABLE */}
            <TablaHeader
              inicioRegistro={inicioRegistro}
              finRegistro={finRegistro}
              total={total}
              search={search}
              setSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Buscar por nombre de obra social..."
            />

            {/* //* TABLA: TABLA */}
            <div className="overflow-x-auto flex-1">
              <Tabla
                layoutFijo
                cargando={cargando}
                sinDatosText="No se encontraron obras sociales registradas."
                columnas={[
                  { label: "ID", className: "hidden md:table-cell" },
                  { label: "Obra Social", className: "w-[34%] md:w-auto" },
                  { label: "Estado", align: "center", className: "w-[18%] md:w-auto" },
                  { label: "Acciones", align: "center", className: "w-[48%] md:w-auto" },
                ]}
              >
                {obrasSociales.map((os) => (
                  <tr key={os.id_obra_social} className="hover:bg-gray-50/60 transition-colors">
                    {/* //* COLUMNAS: ID OBRA SOCIAL */}
                    <td className="hidden md:table-cell px-6 py-4 font-semibold text-gray-500 w-24 text-xs">
                      #{os.id_obra_social}
                    </td>

                    {/* //* COLUMNAS: NOMBRE */}
                    <td className="px-3 md:px-6 py-4">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <BadgeInicial
                          inicial={(os.nombre || "O").charAt(0).toUpperCase()}
                          className="hidden md:flex"
                        />
                        <span className="font-semibold text-gray-800 text-sm break-words min-w-0">{os.nombre}</span>
                      </div>
                    </td>

                    {/* //* COLUMNAS: ESTADO */}
                    <td className="px-3 md:px-6 py-4 text-center">
                      {os.activo ? (
                        <span
                          title="Activa"
                          className="inline-flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        >
                          <CheckCircle2 size={14} /> <span className="hidden md:inline">Activa</span>
                        </span>
                      ) : (
                        <span
                          title="Inactiva"
                          className="inline-flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200"
                        >
                          <XCircle size={14} /> <span className="hidden md:inline">Inactiva</span>
                        </span>
                      )}
                    </td>

                    {/* //* COLUMNAS: ACCIONES */}
                    <td className="px-3 md:px-6 py-4">
                      <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2">
                        <button
                          type="button"
                          onClick={() => abrirParaEditar(os, formatearObraSocialParaEditar)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirParaToggle(os)}
                          className={`p-2 rounded-lg transition-colors ${
                            os.activo
                              ? "text-red-500 hover:bg-red-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {os.activo ? <Ban size={18} /> : <RotateCcw size={18} />}
                        </button>
                        {!os.activo && (
                          <button
                            type="button"
                            onClick={() => abrirParaEliminar(os)}
                            className="p-2 rounded-lg transition-colors text-red-500 hover:bg-red-50"
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

            {/* //* PAGINACION */}
            <TablaPaginacion page={page} setPage={setPage} totalPages={totalPages} />
          </div>
        </div>

        {/* //* MODALES: CREAR Y EDITAR */}
        {modalAbierto && (
          <FormularioCrearEditar
            guardarObraSocial={(e) => {
              e.preventDefault();
              guardarObraSocial(datosFormulario, editando, obraSocialSeleccionada);
            }}
            modalAbierto={modalAbierto}
            cerrarModal={cerrarModal}
            editando={editando}
            datosFormulario={datosFormulario}
            actualizarDatos={actualizarDatos}
          />
        )}

        {/* //* MODALES: TOGGLE */}
        {modalToggle && (
          <FormularioToggle
            modalToggle={modalToggle}
            cerrarModal={cerrarModal}
            obraSocialSeleccionada={obraSocialSeleccionada}
            toggleObraSocial={() => toggleObraSocial(obraSocialSeleccionada)}
          />
        )}

        {/* //* MODALES: ELIMINAR */}
        {modalEliminar && (
          <FormularioEliminar
            modalEliminar={modalEliminar}
            cerrarModal={cerrarModal}
            obraSocialSeleccionada={obraSocialSeleccionada}
            eliminarObraSocial={() => eliminarObraSocial(obraSocialSeleccionada)}
          />
        )}
      </div>
    </PageLayout>
  );
}
