/** @format */

import { useState, useEffect } from "react";
import api from "../../services/api";
import { formatFechaTabla, formatSoloHora } from "../../utils/index";
import { DollarSign, Plus, Edit, Trash2, Search, Wallet } from "lucide-react";
import Header from "../../components/common/Header";
import Tabla from "../../components/common/Tabla/Tabla";
import { FormularioCrearEditarCobro, FormularioEliminarCobro } from "./components/FormulariosCobro";
import FormularioCuotas from "./components/FormulariosCuota";

export default function GestionCobros() {
  const [cobros, setCobros] = useState([]);
  const [turnosAtendidos, setTurnosAtendidos] = useState([]);
  const [cargando, setCargando] = useState(false);

  /* Paginación, Búsqueda y Orden */
  const [page, setPage] = useState(1);
  const [totalCobros, setTotalCobros] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState({
    column: "id_cobro",
    direction: "ASC",
  });

  /* Modales y Formularios */
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [modalCuotas, setModalCuotas] = useState(false);
  const [editando, setEditando] = useState(false);
  const [cobroSeleccionado, setCobroSeleccionado] = useState(null);

  const [datosFormulario, setDatosFormulario] = useState({
    id_turno: "",
    id_paciente: "",
    monto_a_cobrar: "",
    entrega_inicial: "",
    cant_cuotas: 1,
    fecha_primer_vencimiento: new Date().toISOString().split("T")[0],
    modalidad: "inmediato",
    metodo_pago: "Efectivo",
  });

  useEffect(() => {
    buscarTurnosAtendidos();
  }, []);

  useEffect(() => {
    buscarCobros();
  }, [page, search, order]);

  const buscarCobros = async () => {
    setCargando(true);
    try {
      const respuesta = await api.get("/cobros", {
        params: {
          page: page,
          search: search,
          sortField: order.column,
          sortOrder: order.direction,
        },
      });
      setCobros(respuesta.data.data || []);
      setPage(respuesta.data.meta?.page || page);
      setTotalPages(respuesta.data.meta?.totalPages || 1);
      setTotalCobros(respuesta.data.meta?.total || 0);
    } catch (error) {
      console.error("Error al cargar cobros:", error);
    } finally {
      setCargando(false);
    }
  };

  const buscarTurnosAtendidos = async () => {
    try {
      const res = await api.get("/turnos/atendidos");
      setTurnosAtendidos(res.data.data || res.data || []);
    } catch (error) {
      console.error("Error al cargar turnos atendidos:", error);
    }
  };

  const modalCreando = () => {
    setEditando(false);
    setDatosFormulario({
      id_turno: "",
      id_paciente: "",
      monto_a_cobrar: "",
      entrega_inicial: "",
      cant_cuotas: 1,
      fecha_primer_vencimiento: new Date().toISOString().split("T")[0],
      modalidad: "inmediato",
      metodo_pago: "Efectivo",
    });
    setModalAbierto(true);
  };

  const modalEditando = (cobro) => {
    setEditando(true);
    setCobroSeleccionado(cobro);
    setDatosFormulario({
      ...cobro,
      modalidad: cobro.cant_cuotas > 1 ? "cuotas" : "inmediato",
      entrega_inicial: "",
      fecha_primer_vencimiento: new Date().toISOString().split("T")[0],
      metodo_pago: "Efectivo",
    });
    setModalAbierto(true);
  };

  const abrirModalCuotas = (cobro) => {
    setCobroSeleccionado(cobro);
    setModalCuotas(true);
  };

  const confirmarEliminar = (cobro) => {
    setCobroSeleccionado(cobro);
    setModalEliminar(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModalEliminar(false);
    setModalCuotas(false);
    setCobroSeleccionado(null);
    buscarCobros();
  };

  const actualizarDatos = (e) => {
    const { name, value } = e.target;
    setDatosFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const procesarFormulario = async (e) => {
    e.preventDefault();
    try {
      const payloadCobro = {
        id_turno: Number(datosFormulario.id_turno),
        id_paciente: Number(datosFormulario.id_paciente),
        monto_a_cobrar: Number(datosFormulario.monto_a_cobrar),
        cant_cuotas: datosFormulario.modalidad === "cuotas" ? Number(datosFormulario.cant_cuotas) : 1,
      };

      let idCobroGenerado;

      if (editando) {
        await api.put(`/cobros/${cobroSeleccionado.id_cobro}`, payloadCobro);
        idCobroGenerado = cobroSeleccionado.id_cobro;
      } else {
        const resCobro = await api.post("/cobros", payloadCobro);
        idCobroGenerado = resCobro.data.data?.id_cobro || resCobro.data.id_cobro;
      }

      if (datosFormulario.modalidad === "inmediato" && idCobroGenerado) {
        await api.post("/cuotas", {
          id_cobro: idCobroGenerado,
          nro_cuota: 1,
          monto_cuota: Number(datosFormulario.monto_a_cobrar),
          monto_cobrado: Number(datosFormulario.monto_a_cobrar),
          fecha_vencimiento: new Date().toISOString().split("T")[0],
          fecha_cobro: new Date().toISOString(),
          metodo_pago: datosFormulario.metodo_pago,
          estado: "Pagada",
        });
      }

      buscarCobros();
      cerrarModal();
    } catch (error) {
      console.error("Error al registrar el cobro:", error);
      alert("Ocurrió un error al procesar el cobro.");
    }
  };

  const ejecutarEliminacion = async () => {
    if (!cobroSeleccionado) return;
    try {
      await api.patch(`/cobros/${cobroSeleccionado.id_cobro}/delete`);
      buscarCobros();
      cerrarModal();
    } catch (error) {
      console.error("Error al desactivar cobro:", error);
      alert("No se pudo desactivar el cobro.");
    }
  };

  const calcularEstadoYSaldo = (cobro) => {
    const total = Number(cobro.monto_a_cobrar) || 0;
    const pagado = (cobro.Cuota || []).reduce((acc, c) => acc + (Number(c.monto_cobrado) || 0), 0);

    const saldo = Math.max(0, total - pagado);

    let estado = "Pendiente";
    if (saldo === 0 && total > 0) {
      estado = "Pagada";
    } else if (pagado > 0) {
      estado = "Parcial";
    }

    return { saldo, estado };
  };

  const inicioRegistro = totalCobros === 0 ? 0 : (page - 1) * 10 + 1;
  const finRegistro = Math.min(page * 10, totalCobros);

  return (
    <div className="w-full flex-1 flex flex-col gap-4 pb-24">
      <Header
        icono={DollarSign}
        titulo="Gestión de Cobros"
        subtitulo="Administración de cobranzas, modalidades de pago y registro de cuotas"
        badge={`${totalCobros} Registrados`}
        botonAccion={
          <button
            type="button"
            onClick={modalCreando}
            className="hidden sm:flex items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm shrink-0"
          >
            <Plus size={18} />
            <span>Registrar Cobro</span>
          </button>
        }
      />

      <div className="flex-1 w-full min-h-0 p-4 pt-0 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-medium text-gray-500">
              Mostrando {inicioRegistro} a {finRegistro} de {totalCobros} registros
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="relative flex-1 sm:w-80">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cobros por paciente..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <Tabla
              cargando={cargando}
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
                    {/* Paciente */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="hidden md:flex w-9 h-9 rounded-full bg-[#e8f7f1] text-[#2eb086] items-center justify-center font-bold text-sm shrink-0">
                          {cobro.Paciente?.nombre?.charAt(0) || "P"}
                          {cobro.Paciente?.apellido?.charAt(0) || ""}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 text-sm">
                            {cobro.Paciente
                              ? `${cobro.Paciente.nombre} ${cobro.Paciente.apellido}`
                              : `Paciente #${cobro.id_paciente}`}
                          </span>
                          {cobro.Paciente?.dni && (
                            <span className="text-xs text-gray-400">DNI: {cobro.Paciente.dni}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Turno */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatFechaTabla(cobro.Turno?.fecha_hora_inicio || cobro.fecha_emision)}
                        </span>
                        {cobro.Turno && (
                          <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                            <svg
                              className="w-3.5 h-3.5 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {formatSoloHora(cobro.Turno.fecha_hora_inicio)} -{" "}
                            {formatSoloHora(cobro.Turno.fecha_hora_fin)} hs
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Monto Acordado */}
                    <td className="px-6 py-4 font-bold text-gray-800 text-sm">
                      $
                      {Number(cobro.monto_a_cobrar).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    {/* Saldo Pendiente */}
                    <td className="px-6 py-4 font-bold text-sm">
                      <span className={saldo > 0 ? "text-rose-600" : "text-emerald-600"}>
                        $
                        {saldo.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {/* Estado del Cobro */}
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

                    {/* ACCIONES DE LA TABLA */}
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
                          onClick={() => modalEditando(cobro)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar Cobro"
                        >
                          <Edit size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => confirmarEliminar(cobro)}
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

          <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-white">
            <div className="text-xs text-gray-500">
              Página {page} de {totalPages || 1}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 transition-all"
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </button>

              <select
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="px-3 py-1.5 bg-[#2eb086] text-white rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {Array.from({ length: totalPages }, (_, index) => (
                  <option key={index + 1} value={index + 1} className="bg-white text-gray-800">
                    {index + 1}
                  </option>
                ))}
              </select>

              <button
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 transition-all"
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTÓN FLOTANTE INFERIOR DERECHO (EXCLUSIVO PARA MÓVIL) ─── */}
      <button
        type="button"
        onClick={modalCreando}
        className="fixed bottom-20 right-4 z-40 flex md:hidden items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-3 py-3 rounded-full font-semibold text-sm shadow-2xl transition-all duration-300 active:scale-95 group"
        title="Registrar Cobro"
      >
        <Plus size={20} className="transition-transform group-hover:rotate-90 duration-300" />
      </button>

      {modalAbierto && (
        <FormularioCrearEditarCobro
          procesarFormulario={procesarFormulario}
          modalAbierto={modalAbierto}
          cerrarModal={cerrarModal}
          editando={editando}
          datosFormulario={datosFormulario}
          actualizarDatos={actualizarDatos}
          turnosAtendidos={turnosAtendidos}
          setDatosFormulario={setDatosFormulario}
        />
      )}

      {modalCuotas && (
        <FormularioCuotas
          modalCuotas={modalCuotas}
          cerrarModal={cerrarModal}
          cobroSeleccionado={cobroSeleccionado}
          recarcarCobros={buscarCobros}
        />
      )}

      {modalEliminar && (
        <FormularioEliminarCobro
          modalEliminar={modalEliminar}
          cerrarModal={cerrarModal}
          cobroSeleccionado={cobroSeleccionado}
          ejecutarEliminacion={ejecutarEliminacion}
        />
      )}
    </div>
  );
}
