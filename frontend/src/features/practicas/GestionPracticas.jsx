/** @format */

//* IMPORTACION DE ICONOS Y useEffect
import { useEffect } from "react";
import { FileText, Plus, Edit, Trash2, CheckCircle2, XCircle, RotateCcw, Tag, Ban } from "lucide-react";

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
  FormularioEliminar,
  FormularioToggle,
} from "./components/FormulariosPractica";

const ESTADO_INICIAL = {
  codigo_nomenclador: "",
  nombre_nomenclador: "",
  nombre_referencia: "",
  especialidad: "",
  precio_referencia: 0,
};

export default function GestionPracticas() {
  //* MOSTRAMOS EL BOTON FLOTANTE
  const { setFloatingAction } = useFloatingButton();

  //* CARGAMOS CON DATOS LOS HOOKS
  const {
    datos: practicas,
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
  } = usePaginationSearch("/practicas");

  const {
    modalAbierto,
    modalToggle,
    modalEliminar,
    editando,
    itemSeleccionado: practicaSeleccionada,
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

  // * FUNCION QUE REALIZA LA PETICION AL BACK PARA CREAR O EDITAR LA PRACTICA
  // TODO: FUNCION REUTILIZABLE PARA LAS ALERTS Y MEJORAR SU ESTILO
  const crearOEditarPractica = async (e) => {
    e.preventDefault();
    /*  if (!datosFormulario.codigo_nomenclador.trim()) return alert("Ingrese el codigo_nomenclador");
    if (!datosFormulario.nombre_nomenclador.trim()) return alert("Ingrese el nombre_nomenclador");
    if (!datosFormulario.nombre_referencia.trim()) return alert("Ingrese el nombre_referencia");
    if (!datosFormulario.especialidad.trim()) return alert("Ingrese el especialidad");
    if (!datosFormulario.precio_referencia) return alert("Ingrese el precio_referencia"); */

    try {
      const payload = {
        codigo_nomenclador: datosFormulario.codigo_nomenclador.trim(),
        nombre_nomenclador: datosFormulario.nombre_nomenclador.trim(),
        nombre_referencia: datosFormulario.nombre_referencia.trim(),
        especialidad: datosFormulario.especialidad.trim(),
        precio_referencia: parseFloat(datosFormulario.precio_referencia),
      };

      if (editando) {
        await api.put(`/practicas/${practicaSeleccionada.id_practica}`, payload);
      } else {
        await api.post("/practicas", payload);
      }

      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar la práctica:", error);
      alert("Ocurrió un error al intentar guardar la práctica.");
    }
  };

  // * FUNCION QUE REALIZA LA PETICION AL BACK PARA LA BAJA LOGICA LA PRACTICA
  const togglePractica = async () => {
    if (!practicaSeleccionada) return;
    try {
      await api.patch(`/practicas/${practicaSeleccionada.id_practica}/delete`);
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al cambiar estado de la práctica:", error);
      alert("No se pudo actualizar el estado de la práctica.");
    }
  };

  // * FUNCION QUE REALIZA LA PETICION AL BACK PARA LA ELIMINACION DE LA PRACTICA
  const eliminarPractica = async () => {
    if (!practicaSeleccionada) return;
    try {
      await api.delete(`/practicas/${practicaSeleccionada.id_practica}/delete`);
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al cambiar estado de la práctica:", error);
      alert("No se pudo actualizar el estado de la práctica.");
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-4 pb-24">
      {/* //* HEADER CON TITULO Y BOTON */}
      <Header
        icono={FileText}
        titulo="Catálogo de Prácticas"
        subtitulo="Nomenclador de tratamientos, prestaciones y aranceles"
        badge={`${total} Registradas`}
        botonAccion={
          <button
            type="button"
            onClick={abrirParaCrear}
            className="hidden sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0"
          >
            <Plus size={18} />
            <span>Nueva Práctica</span>
          </button>
        }
      />

      {/* //* BODY: TABLA */}
      <div className="flex-1 w-full min-h-0 p-4 pt-0 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {/* //* TABLA: BARRA SUPERIOR REUTILIZABLE */}
          {/* //? PLACEHOLDER EN BUSCAR PRACTICA? O LE AGREGAMOS LOS CAMPOS? */}
          <TablaHeader
            inicioRegistro={inicioRegistro}
            finRegistro={finRegistro}
            total={total}
            search={search}
            setSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Buscar practica..."
          />

          {/* //* TABLA: TABLA */}
          <div className="overflow-x-auto flex-1">
            <Tabla
              cargando={cargando}
              sinDatosText="No se encontraron prácticas registradas."
              columnas={[
                { label: "Código" },
                { label: "Tratamiento" },
                { label: "Especialidad", className: "hidden md:table-cell" },
                { label: "Precio Ref." },
                { label: "Estado" },
                { label: "Acciones", align: "center" },
              ]}
            >
              {practicas.map((practica) => (
                <tr key={practica.id_practica} className="hover:bg-gray-50/60 transition-colors">
                  {/* //* COLUMNAS: CODIGO NOMENCLADOR */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200">
                      <Tag size={12} className="text-[#2eb086]" />
                      {practica.codigo_nomenclador}
                    </span>
                  </td>

                  {/* //* COLUMNAS: NOMBRE REFERENCIA */}
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-800 text-sm">{practica.nombre_nomenclador}</span>
                    <br className="hidden md:block" />
                    <span className="hidden md:block texs-xs text-gray-400 text-sm">
                      {practica.nombre_referencia}
                    </span>
                  </td>

                  {/* //* COLUMNAS: ESPECIALIDAD */}
                  <td className="hidden md:table-cell px-6 py-4 text-gray-600 font-medium text-sm">
                    {practica.especialidad}
                  </td>

                  {/* //* COLUMNAS: PRECIO DE REFERENCIA */}
                  <td className="px-6 py-4 font-semibold text-gray-800 text-sm">
                    $
                    {Number(practica.precio_referencia).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  {/* //* COLUMNAS: ESTADO */}
                  <td className="px-6 py-4">
                    {practica.activo ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <CheckCircle2 size={14} />
                        <span>Activa</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                        <XCircle size={14} />
                        <span>Inactiva</span>
                      </span>
                    )}
                  </td>

                  {/* //* COLUMNAS: ACCIONES */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          abrirParaEditar(practica, (item) => ({
                            codigo_nomenclador: item.codigo_nomenclador,
                            nombre_nomenclador: item.nombre_nomenclador,
                            nombre_referencia: item.nombre_referencia,
                            especialidad: item.especialidad,
                            precio_referencia: item.precio_referencia,
                          }))
                        }
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Editar Práctica"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirParaToggle(practica)}
                        className={`p-2 rounded-lg transition-colors ${
                          practica.activo
                            ? "text-red-500 hover:bg-red-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {practica.activo ? <Ban size={18} /> : <RotateCcw size={18} />}
                      </button>
                      {!practica.activo && (
                        <button
                          type="button"
                          onClick={() => abrirParaEliminar(practica)}
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
          crearOEditarPractica={crearOEditarPractica}
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
          practicaSeleccionada={practicaSeleccionada}
          togglePractica={togglePractica}
        />
      )}

      {/* //* MODALES: ELIMINAR */}
      {modalEliminar && (
        <FormularioEliminar
          modalEliminar={modalEliminar}
          cerrarModal={cerrarModal}
          practicaSeleccionada={practicaSeleccionada}
          eliminarPractica={eliminarPractica}
        />
      )}
    </div>
  );
}
