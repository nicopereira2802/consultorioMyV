/** @format */

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/api";
import { DollarSign, Plus, Trash2, Wallet } from "lucide-react";

import Header from "../../components/common/Header";
import Tabla from "../../components/common/Tabla/Tabla";
import TablaHeader from "../../components/common/Tabla/TablaHeader";
import TablaPaginacion from "../../components/common/Tabla/TablaPaginacion";
import PageLayout from "../../components/layout/PageLayout";

//* HOOKS Y UTILS
import { usePaginationSearch } from "../../hooks/usePaginationSearch";
import { useCRUDModal } from "../../hooks/useCRUDModal";
import { useCobroActions } from "./hooks/useCobroActions";
import { calcularEstadoYSaldo } from "./utils/calcularEstadoYSaldo";
import { formatFechaTabla, formatSoloHora } from "../../utils/index";

//* FORMULARIOS
import { FormularioCrearEditarCobro, FormularioEliminarCobro } from "./components/FormulariosCobro";
import FormularioCuotas from "./components/FormulariosCuota";

const ESTADO_INICIAL_COBRO = {
  id_turno: "",
  id_paciente: "",
  monto_a_cobrar: "",
  entrega_inicial: "",
  cant_cuotas: 1,
  fecha_primer_vencimiento: new Date().toISOString().split("T")[0],
  modalidad: "inmediato",
  metodo_pago: "Efectivo",
};

export default function GestionCobros() {
  const location = useLocation();
  const [turnosAtendidos, setTurnosAtendidos] = useState([]);
  const [modalCuotas, setModalCuotas] = useState(false);
  const [cobroVerCuotas, setCobroVerCuotas] = useState(null);

  // 1. Paginación
  const {
    datos: cobros,
    cargando,
    page,
    setPage,
    total: totalCobros,
    totalPages,
    search,
    setSearch,
    inicioRegistro,
    finRegistro,
    recargar,
  } = usePaginationSearch("/cobros", 10);

  // 2. ÚNICO Hook de CRUD Modal reutilizado (reemplaza a useCobroModal)
  const {
    modalAbierto: modalCobroAbierto,
    modalEliminar,
    editando,
    itemSeleccionado: cobroSeleccionado,
    datosFormulario: datosCobro,
    abrirParaCrear,
    abrirParaEditar,
    abrirParaEliminar,
    cerrarModal,
    actualizarDatos: actualizarDatosCobro,
  } = useCRUDModal(ESTADO_INICIAL_COBRO);

  // 3. Acciones API
  const { guardarCobro, ejecutarEliminacion } = useCobroActions(recargar, cerrarModal);

  // Cargar catálogo de turnos atendidos
  useEffect(() => {
    const buscarTurnosAtendidos = async () => {
      try {
        const res = await api.get("/turnos/atendidos");
        setTurnosAtendidos(res.data.data || res.data || []);
      } catch (error) {
        console.error("Error al cargar turnos atendidos:", error);
      }
    };
    buscarTurnosAtendidos();
  }, []);

  // Manejo de la navegación directa desde Turnos/Agenda
  useEffect(() => {
    const idTurnoNavegado = location.state?.id_turno_cobrar;

    if (idTurnoNavegado && turnosAtendidos.length > 0) {
      const turnoEncontrado = turnosAtendidos.find((t) => String(t.id_turno) === String(idTurnoNavegado));

      abrirParaCrear({
        id_turno: String(idTurnoNavegado),
        id_paciente: turnoEncontrado?.id_paciente || "",
        monto_a_cobrar: turnoEncontrado?.precio_final || "",
      });

      window.history.replaceState({}, document.title);
    }
  }, [location.state, turnosAtendidos, abrirParaCrear]);

  const abrirModalCuotas = (cobro) => {
    setCobroVerCuotas(cobro);
    setModalCuotas(true);
  };

  const cerrarTodoModalCuotas = () => {
    setModalCuotas(false);
    setCobroVerCuotas(null);
  };

  return (
    <PageLayout onAdd={() => abrirParaCrear()}>
      <div className="w-full flex-1 flex flex-col gap-4 pb-24">
        <Header
          icono={DollarSign}
          titulo="Gestión de Cobros"
          subtitulo="Administración de cobranzas, modalidades de pago y registro de cuotas"
          badge={`${totalCobros} Registrados`}
          botonAccion={
            <button
              type="button"
              onClick={() => abrirParaCrear()}
              className="hidden sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm shrink-0"
            >
              <Plus size={18} />
              <span>Registrar Cobro</span>
            </button>
          }
        />

        <div className="flex-1 w-full min-h-0 p-4 pt-0 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <TablaHeader
              inicioRegistro={inicioRegistro}
              finRegistro={finRegistro}
              total={totalCobros}
              search={search}
              setSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Buscar cobros por paciente..."
            />

            <div className="overflow-x-auto flex-1">
              <Tabla
                cargando={cargando}
                search={search}
                sinDatosText="No se encontraron registros de cobros."
                columnas={[
                  { label: "Paciente" },
                  { label: "Turno / Fecha" },
                  { label: "Monto Acordado" },
                  { label: "Saldo Pendiente" },
                  { label: "Estado" },
                  { label: "Acciones", align: "center" },
                ]}
              >
                {cobros.map((cobro) => {
                  const { saldo, estado } = calcularEstadoYSaldo(cobro);

                  return (
                    <tr key={cobro.id_cobro} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="hidden md:flex w-9 h-9 rounded-full bg-[#e8f7f1] text-[#2eb086] items-center justify-center font-bold text-sm shrink-0">
                            {cobro.Paciente?.nombre?.charAt(0) || "P"}
                            {cobro.Paciente?.apellido?.charAt(0) || ""}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800 text-sm">
                              {cobro.Paciente
                                ? `${cobro.Paciente.nombre}${cobro.Paciente.apellido}`
                                : `Paciente #${cobro.id_paciente}`}
                            </span>
                            {cobro.Paciente?.dni && (
                              <span className="text-xs text-gray-400">DNI: {cobro.Paciente.dni}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-0.5">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatFechaTabla(cobro.Turno?.fecha_hora_inicio || cobro.fecha_emision)}
                          </span>
                          {cobro.Turno && (
                            <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                              {formatSoloHora(cobro.Turno.fecha_hora_inicio)} -{" "}
                              {formatSoloHora(cobro.Turno.fecha_hora_fin)} hs
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-bold text-gray-800 text-sm">
                        ${Number(cobro.monto_a_cobrar).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-6 py-4 font-bold text-sm">
                        <span className={saldo > 0 ? "text-rose-600" : "text-emerald-600"}>
                          ${saldo.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            estado === "Pagada"
                              ? "bg-emerald-100 text-emerald-800"
                              : estado === "Parcial"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {estado === "Pagada" ? "Pagado" : estado === "Parcial" ? "Parcial" : "Pendiente"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirModalCuotas(cobro)}
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Registrar Entrega / Ver Cuenta"
                          >
                            <Wallet size={18} />
                          </button>

                          <button
                            type="button"
                            onClick={() => abrirParaEliminar(cobro)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Desactivar Cobro"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </Tabla>
            </div>

            <TablaPaginacion page={page} setPage={setPage} totalPages={totalPages} />
          </div>
        </div>

        {/* MODALES */}
        {modalCobroAbierto && (
          <FormularioCrearEditarCobro
            procesarFormulario={(e) => {
              e.preventDefault();
              guardarCobro(datosCobro, editando, cobroSeleccionado);
            }}
            modalAbierto={modalCobroAbierto}
            cerrarModal={cerrarModal}
            editando={editando}
            datosFormulario={datosCobro}
            actualizarDatos={actualizarDatosCobro}
            turnosAtendidos={turnosAtendidos}
          />
        )}

        {modalCuotas && (
          <FormularioCuotas
            modalCuotas={modalCuotas}
            cerrarModal={cerrarTodoModalCuotas}
            cobroSeleccionado={cobroVerCuotas}
            recarcarCobros={recargar}
          />
        )}

        {modalEliminar && (
          <FormularioEliminarCobro
            modalEliminar={modalEliminar}
            cerrarModal={cerrarModal}
            cobroSeleccionado={cobroSeleccionado}
            ejecutarEliminacion={() => ejecutarEliminacion(cobroSeleccionado)}
          />
        )}
      </div>
    </PageLayout>
  );
}
