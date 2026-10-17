/** @format */

//* IMPORTACION DE ICONOS Y useEffect
import { useEffect } from "react";
import { Shield, Plus, Edit, Trash2, CheckCircle2, XCircle, RotateCcw, Ban } from "lucide-react";

//* IMPORTACION DE API
import api from "../../services/api";

//* IMPORTACION DE COMPONENTES COMUNES REUTILIZABLES
import Header from "../../components/common/Header";
import Tabla from "../../components/common/Tabla/Tabla";
import TablaHeader from "../../components/common/Tabla/TablaHeader";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";

//* IMPORTACION DE HOOKS (para modales y paginacion) Y CONTEXT (para el boton flotante para telefono)
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { usePaginationSearch } from "../../hooks/usePaginationSearch";
import { useFloatingButton } from "../../context/BotonFlotanteContext";

//* IMPORTACION DE FORMULARIOS
import {
  FormularioCrearEditar,
  FormularioToggle,
  FormularioEliminar,
} from "./components/FormularioObraSocial";

const ESTADO_INICIAL = { nombre: "" };

export default function GestionObrasSociales() {
  //* MOSTRAMOS EL BOTON FLOTANTE
  const { setFloatingAction } = useFloatingButton();

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

  // * useEffect PARA QUE AL TOCAR EL BOTON SE ABRA EL MODAL
  // ? NO ENTIENDO MUY BIEN QUE HACE
  // ! DEBERIAMOS CORREGIR ESTO, NO ES UNA BUENA PRACTICA
  useEffect(() => {
    setFloatingAction(() => abrirParaCrear);

    return () => setFloatingAction(null);
  }, [abrirParaCrear, setFloatingAction]);

  // * FUNCION QUE REALIZA LA PETICION AL BACK PARA CREAR O EDITAR LA OBRA SOCIAL
  const crearOEditarObraSocial = async (e) => {
    e.preventDefault();
    if (!datosFormulario.nombre.trim()) return alert("Ingrese el nombre");

    try {
      const payload = { nombre: datosFormulario.nombre.trim() };
      if (editando) {
        await api.put(`/obras-sociales/${obraSocialSeleccionada.id_obra_social}`, payload);
      } else {
        await api.post("/obras-sociales", payload);
      }
      recargar();
      cerrarModal();
    } catch (error) {
      alert("Ocurrió un error al guardar.");
    }
  };

  // * FUNCION QUE REALIZA LA PETICION AL BACK PARA LA BAJA LOGICA LA OBRA SOCIAL
  const toggleObraSocial = async () => {
    if (!obraSocialSeleccionada) return;
    try {
      await api.patch(`/obras-sociales/${obraSocialSeleccionada.id_obra_social}/delete`);
      recargar();
      cerrarModal();
    } catch (error) {
      alert("No se pudo actualizar el estado.");
    }
  };

  // * FUNCION QUE REALIZA LA PETICION AL BACK PARA LA ELIMINACION DE LA OBRA SOCIAL
  const eliminarObraSocial = async () => {
    if (!obraSocialSeleccionada) return;
    try {
      await api.delete(`/obras-sociales/${obraSocialSeleccionada.id_obra_social}/delete`);
      recargar();
      cerrarModal();
    } catch (error) {
      alert("No se pudo actualizar el estado.");
    }
  };

  return (
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
              cargando={cargando}
              sinDatosText="No se encontraron obras sociales registradas."
              columnas={[
                { label: "ID", className: "hidden md:table-cell" },
                { label: "Obra Social" },
                { label: "Estado" },
                { label: "Acciones", align: "center" },
              ]}
            >
              {obrasSociales.map((os) => (
                <tr key={os.id_obra_social} className="hover:bg-gray-50/60 transition-colors">
                  {/* //* COLUMNAS: ID OBRA SOCIAL */}
                  <td className="hidden md:table-cell px-6 py-4 font-semibold text-gray-500 w-24 text-xs">
                    #{os.id_obra_social}
                  </td>

                  {/* //* COLUMNAS: NOMBRE */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="hidden md:flex w-9 h-9 rounded-full bg-[#e8f7f1] text-[#2eb086] items-center justify-center font-bold text-sm shrink-0">
                        {os.nombre?.charAt(0)}
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">{os.nombre}</span>
                    </div>
                  </td>

                  {/* //* COLUMNAS: ESTADO */}
                  <td className="px-6 py-4">
                    {os.activo ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <CheckCircle2 size={14} /> Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                        <XCircle size={14} /> Inactiva
                      </span>
                    )}
                  </td>

                  {/* //* COLUMNAS: ACCIONES */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => abrirParaEditar(os, (item) => ({ nombre: item.nombre }))}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirParaToggle(os)}
                        className={`p-2 rounded-lg transition-colors ${
                          os.activo ? "text-red-500 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
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
          crearOEditarObraSocial={crearOEditarObraSocial}
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
          toggleObraSocial={toggleObraSocial}
        />
      )}

      {/* //* MODALES: ELIMINAR */}
      {modalEliminar && (
        <FormularioEliminar
          modalEliminar={modalEliminar}
          cerrarModal={cerrarModal}
          obraSocialSeleccionada={obraSocialSeleccionada}
          eliminarObraSocial={eliminarObraSocial}
        />
      )}
    </div>
  );
}
