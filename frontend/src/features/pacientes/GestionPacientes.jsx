/** @format */
// ! NO FUNCIONA LO DE OBRAS SOCIALES

//* IMPORTACION DE ICONOS Y useEffect
import { useState, useEffect } from "react";
import { Users, Plus, Edit, Trash2, X, Phone, Ban, RotateCcw } from "lucide-react";

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

//* IMPORTACION DE FUNCIONES PARA FORMATEAR FECHAS
import { formatFechaTabla } from "../../utils/index";

//* IMPORTACION DE FORMULARIOS
import {
  FormularioCrearEditar,
  FormularioEliminar,
  FormularioToggle,
} from "./components/FormulariosPaciente";

//* IMPORTACION DE FUNCION PARA COMPLETAR PACIENTE DESDE AGENDA DIARIA
import { useSearchParams } from "react-router-dom";
import C from "@fullcalendar/react";

const ESTADO_INICIAL = {
  nombre: "",
  apellido: "",
  dni: "",
  fecha_nacimiento: "",
  telefono: "",
  domicilio: "",
  obrasSociales: [],
  obrasSocialesEliminadas: [],
};

export default function GestionPacientes() {
  //* MOSTRAMOS EL BOTON FLOTANTE
  const { setFloatingAction } = useFloatingButton();

  //* CARGAMOS SEARCHPARAMS PARA COMPLETAR PACIENTE
  const [searchParams, setSearchParams] = useSearchParams();

  //* CARGAMOS CON DATOS LOS HOOKS
  const {
    datos: pacientes,
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
  } = usePaginationSearch("/pacientes");

  const {
    modalAbierto,
    modalToggle,
    modalEliminar,
    editando,
    itemSeleccionado: pacienteSeleccionado,
    datosFormulario,
    setDatosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaToggle,
    abrirParaEliminar,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL);

  //* VARIABLES PARA LAS OBRAS SOCIALES
  const [obrasSocialesLista, setObrasSocialesLista] = useState([]);

  // * useEffect PARA CARGAR OBRAS SOCIALES
  useEffect(() => {
    buscarObrasSociales();
  }, []);

  // * useEffect PARA QUE AL TOCAR EL BOTON SE ABRA EL MODAL
  // ? NO ENTIENDO MUY BIEN QUE HACE
  // ! DEBERIAMOS CORREGIR ESTO, NO ES UNA BUENA PRACTICA
  useEffect(() => {
    setFloatingAction(() => abrirParaCrear);

    return () => setFloatingAction(null);
  }, [abrirParaCrear, setFloatingAction]);

  // * useEffect PARA QUE AL TOCAR EL BOTON COMPLETAR PACIETE ABRA MODAL
  useEffect(() => {
    const idParaEditar = searchParams.get("editarId");

    if (idParaEditar && pacientes.length > 0) {
      const pacienteEncontrado = pacientes.find((p) => String(p.id_paciente) === String(idParaEditar));

      if (pacienteEncontrado) {
        modalEditando(pacienteEncontrado);
        setSearchParams({});
      }
    }
  }, [searchParams, pacientes]);

  // * FUNCIONES DE LAS OBRAS SOCIALES
  // ? SE PUEDE MEJORAR ESTO???

  // * FUNCION QUE REALIZA LA PETICION AL BACK PARA BUSCAR OBRAS SOCIALES
  const buscarObrasSociales = async () => {
    try {
      const respuesta = await api.get("/obras-sociales");
      setObrasSocialesLista(respuesta.data.data || []);
    } catch (error) {
      console.error("Error al cargar catálogo de obras sociales:", error);
    }
  };

  // * FUNCION QUE AGREGA OBRAS SOCIALES AL PACIENTE
  const agregarObraSocialForm = () => {
    setDatosFormulario((prev) => ({
      // 👈 CAMBIADO A setDatosFormulario
      ...prev,
      obrasSociales: [...prev.obrasSociales, { id_obra_social: "", nro_afiliado: "" }],
    }));
  };

  // * FUNCION QUE ACTUALIZA OBRAS SOCIALES AL PACIENTE
  const actualizarObraSocialForm = (index, campo, valor) => {
    setDatosFormulario((prev) => {
      // 👈 CAMBIADO A setDatosFormulario
      const nuevasOS = [...prev.obrasSociales];
      nuevasOS[index][campo] = valor;
      return { ...prev, obrasSociales: nuevasOS };
    });
  };

  // * FUNCION QUE ELIMINA OBRAS SOCIALES AL PACIENTE
  const eliminarObraSocialForm = (index) => {
    const osAEliminar = datosFormulario.obrasSociales[index];

    setDatosFormulario((prev) => {
      // 👈 CAMBIADO A setDatosFormulario
      const nuevasOS = prev.obrasSociales.filter((_, i) => i !== index);
      const eliminadas = [...(prev.obrasSocialesEliminadas || [])];

      if (osAEliminar && osAEliminar.guardadoEnBD && osAEliminar.id_relacion) {
        eliminadas.push(osAEliminar.id_relacion);
      }

      return {
        ...prev,
        obrasSociales: nuevasOS,
        obrasSocialesEliminadas: eliminadas,
      };
    });
  };

  // * FUNCION QUE REALIZA LA PETICION AL BACK PARA CREAR O EDITAR LA OBRA SOCIAL
  // ? SE PUEDE MEJORAR ESTO?
  const crearOEditarPaciente = async (e) => {
    e.preventDefault();
    // TODO: AGREGAR LOS ALERT CON FUNCION REUTILIZABLE

    try {
      const payloadPaciente = {
        nombre: datosFormulario.nombre.trim(),
        apellido: datosFormulario.apellido.trim(),
        dni: datosFormulario.dni ? datosFormulario.dni.trim() : null,
        fecha_nacimiento: datosFormulario.fecha_nacimiento || null,
        telefono: datosFormulario.telefono.trim(),
        domicilio: datosFormulario.domicilio ? datosFormulario.domicilio.trim() : null,
      };

      // 1. Guardar o actualizar datos principales del paciente...

      if (editando) {
        await api.put(`/pacientes/${pacienteSeleccionado.id_paciente}`, payloadPaciente);
      } else {
        await api.post("/pacientes", payloadPaciente);
      }

      // 2. Procesar obras sociales (crear/actualizar)...
      if (datosFormulario.obrasSociales.length > 0 && pacienteSeleccionado.id_paciente) {
        for (const os of datosFormulario.obrasSociales) {
          if (os.id_obra_social && os.nro_afiliado) {
            try {
              if (os.guardadoEnBD && os.id_relacion) {
                await api.put(`/pacientes-por-obras-sociales/${os.id_relacion}`, {
                  id_paciente: Number(pacienteSeleccionado.id_paciente),
                  id_obra_social: Number(os.id_obra_social),
                  nro_afiliado: os.nro_afiliado.trim(),
                });
              } else if (!os.guardadoEnBD) {
                await api.post("/pacientes-por-obras-sociales", {
                  id_paciente: Number(pacienteSeleccionado.id_paciente),
                  id_obra_social: Number(os.id_obra_social),
                  nro_afiliado: os.nro_afiliado.trim(),
                });
              }
            } catch (errOS) {
              console.warn("Aviso al guardar/actualizar obra social:", errOS);
            }
          }
        }
      }

      // 3. NUEVO: Ejecutar las eliminaciones pendientes solo al guardar
      if (datosFormulario.obrasSocialesEliminadas && datosFormulario.obrasSocialesEliminadas.length > 0) {
        for (const idRelacion of datosFormulario.obrasSocialesEliminadas) {
          try {
            await api.delete(`/pacientes-por-obras-sociales/${idRelacion}`);
          } catch (errDel) {
            console.error("Error al eliminar obra social en backend:", errDel);
          }
        }
      }

      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al guardar el paciente:", error);
      alert("Ocurrió un error al intentar guardar los datos del paciente.");
    }
  };

  // * FUNCION QUE REALIZA LA PETICION AL BACK PARA LA BAJA LOGICA DEL PACIENTE
  const togglePaciente = async () => {
    if (!pacienteSeleccionado) return;
    try {
      await api.patch(`/pacientes/${pacienteSeleccionado.id_paciente}/delete`);
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al borrar paciente:", error);
      alert("No se pudo desactivar el paciente.");
    }
  };

  // * FUNCION QUE REALIZA LA PETICION AL BACK PARA LA BAJA LOGICA DEL PACIENTE
  /* const eliminarPaciente = async () => {
    if (!pacienteSeleccionado) return;
    try {
      await api.delete(`/pacientes/${pacienteSeleccionado.id_paciente}/delete`);
      recargar();
      cerrarModal();
    } catch (error) {
      console.error("Error al borrar paciente:", error);
      alert("No se pudo desactivar el paciente.");
    }
  }; */

  return (
    <div className="w-full flex-1 flex flex-col gap-4 pb-24">
      {/* //* HEADER CON TITULO Y BOTON */}
      <Header
        icono={Users}
        titulo="Gestión de Pacientes"
        subtitulo="Administración de historias clínicas, datos personales y coberturas"
        badge={`${total} Registrados`}
        botonAccion={
          <button
            type="button"
            onClick={abrirParaCrear}
            className="hidden sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-95 shrink-0"
          >
            <Plus size={18} />
            <span>Nuevo Paciente</span>
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
            placeholder="Buscar pacientes..."
          />
          {/* //* TABLA: TABLA */}
          <div className="overflow-x-auto flex-1">
            <Tabla
              cargando={cargando}
              sinDatosText="No se encontraron pacientes registrados."
              columnas={[
                { label: "Paciente" },
                { label: "DNI" },
                { label: "Teléfono" },
                { label: "F. Nac." },
                { label: "Domicilio" },
                { label: "Acciones", align: "center" },
              ]}
            >
              {pacientes.map((paciente) => (
                <tr key={paciente.id_paciente} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4">
                    {/* //* COLUMNAS: NOMBRE Y APELLIDO */}
                    <div className="flex items-center gap-3">
                      <div className="hidden md:flex w-9 h-9 rounded-full bg-[#e8f7f1] text-[#2eb086] items-center justify-center font-bold text-sm shrink-0">
                        {paciente.nombre?.charAt(0)}
                        {paciente.apellido?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">
                          {paciente.nombre} {paciente.apellido}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* //* COLUMNAS: DNI */}
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {paciente.dni || <span className="text-gray-400 italic">S/D</span>}
                  </td>

                  {/* //* COLUMNAS: TELEFONO */}
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Phone size={14} className="text-gray-400" />
                      <span>{paciente.telefono}</span>
                    </div>
                  </td>

                  {/* //* COLUMNAS: FECHA NACIMIENTO */}
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                    {formatFechaTabla(paciente.fecha_nacimiento)}
                  </td>

                  {/* //* COLUMNAS: DOMICILIO */}
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                    {paciente.domicilio || <span className="text-gray-400 italic">S/D</span>}
                  </td>

                  {/* //* COLUMNAS: ACCIONES */}
                  {/* // ?! OBRASOCIALS??? */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          abrirParaEditar(paciente, (item) => ({
                            nombre: item.nombre,
                            apellido: item.apellido,
                            dni: item.dni,
                            fecha_nacimiento: item.fecha_nacimiento,
                            telefono: item.telefono,
                            domicilio: item.domicilio,
                            obrasSociales:
                              item.PacienteObraSocials?.map((relacion) => ({
                                id_obra_social: relacion.id_obra_social,
                                nro_afiliado: relacion.nro_afiliado || "",
                                guardadoEnBD: true,
                                id_relacion: relacion.id_paciente_obra_social,
                              })) || [],
                            obrasSocialesEliminadas: [],
                          }))
                        }
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Editar Paciente"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirParaToggle(paciente)}
                        className={`p-2 rounded-lg transition-colors ${
                          paciente.activo
                            ? "text-red-500 hover:bg-red-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {paciente.activo ? <Ban size={18} /> : <RotateCcw size={18} />}
                      </button>
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
          crearOEditarPaciente={crearOEditarPaciente}
          modalAbierto={modalAbierto}
          cerrarModal={cerrarModal}
          editando={editando}
          datosFormulario={datosFormulario}
          actualizarDatos={actualizarDatos}
          agregarObraSocialForm={agregarObraSocialForm}
          obrasSocialesLista={obrasSocialesLista}
          actualizarObraSocialForm={actualizarObraSocialForm}
          eliminarObraSocialForm={eliminarObraSocialForm}
        />
      )}

      {/* //* MODALES: TOGGLE */}
      {/* // TODO: PARA QUE FUNCIONE HAY QUE BORRAR WHERE ACTIVO: TRUE */}
      {modalToggle && (
        <FormularioToggle
          modalToggle={modalToggle}
          cerrarModal={cerrarModal}
          pacienteSeleccionado={pacienteSeleccionado}
          togglePaciente={togglePaciente}
        />
      )}

      {/* //* MODALES: ELIMINAR */}
      {/* {modalEliminar && (
        <FormularioEliminar
          modalEliminar={modalEliminar}
          cerrarModal={cerrarModal}
          pacienteSeleccionado={pacienteSeleccionado}
          eliminarPaciente={eliminarPaciente}
        />
      )} */}
    </div>
  );
}
