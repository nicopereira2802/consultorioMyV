import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Eye, Phone } from 'lucide-react';
import HeaderVolver from '../components/header';
import logoClinica from '../assets/logo.png';
import ModalRegistrarCobro from '../components/ModalRegistrarCobro';
import FichaCuentaPaciente from '../components/FichaCuentaPaciente';
import { getSaldosPacientes } from '../services/cobros.service';
import './GestionCobros.css';

/**
 * Formatea un valor numérico a moneda argentina ($ XX.XXX,XX)
 */
const formatearMoneda = (valor) => {
  const num = Number(valor) || 0;
  return `$ ${num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Pastillas de filtrado por estado de cuenta corriente
 */
const PILLS_FILTRO = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'CON_DEUDA', label: 'Con Saldo Pendiente' },
  { id: 'AL_DIA', label: 'Al Día' },
];

/**
 * Pantalla Oficial: Cuentas de Pacientes y Cobros (M&V Turnos)
 */
export const GestionCobros = () => {
  const navigate = useNavigate();

  // Estados de datos
  const [pacientesSaldos, setPacientesSaldos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados de filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 10;

  // Estados de modales
  const [pacienteSeleccionadoId, setPacienteSeleccionadoId] = useState(null);
  const [fichaCuentaAbierta, setFichaCuentaAbierta] = useState(false);

  const [modalNuevoCobroOpen, setModalNuevoCobroOpen] = useState(false);
  const [pacienteSeleccionadoCobro, setPacienteSeleccionadoCobro] = useState(null);

  // Carga de saldos de pacientes desde el backend
  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const res = await getSaldosPacientes();
      const lista = Array.isArray(res) ? res : [];
      setPacientesSaldos(lista);
    } catch (err) {
      console.error('Error al obtener saldos de pacientes:', err);
      setError('No se pudieron cargar los saldos de pacientes desde el servidor.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Acción del botón Volver
  const handleVolver = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/agenda');
    }
  };

  // Abrir ficha de cuenta corriente
  const handleVerCuenta = (idOrPaciente) => {
    const id = typeof idOrPaciente === 'object' && idOrPaciente !== null
      ? (idOrPaciente.id_paciente || idOrPaciente.id)
      : idOrPaciente;
    setPacienteSeleccionadoId(id);
    setFichaCuentaAbierta(true);
  };

  // Abrir modal registrar cobro con paciente preseleccionado
  const handleAbrirRegistrarCobro = (paciente = null) => {
    setPacienteSeleccionadoCobro(paciente);
    setModalNuevoCobroOpen(true);
  };

  // Conteos para las pastillas (pills)
  const conteos = useMemo(() => {
    return {
      TODOS: pacientesSaldos.length,
      CON_DEUDA: pacientesSaldos.filter((p) => Number(p.saldo_pendiente) > 0).length,
      AL_DIA: pacientesSaldos.filter((p) => Number(p.saldo_pendiente) <= 0).length,
    };
  }, [pacientesSaldos]);

  // Filtrado reactivo en tiempo real
  const pacientesFiltrados = useMemo(() => {
    return pacientesSaldos.filter((p) => {
      // 1. Filtro por pastilla seleccionada
      if (filtroEstado === 'CON_DEUDA' && Number(p.saldo_pendiente) <= 0) return false;
      if (filtroEstado === 'AL_DIA' && Number(p.saldo_pendiente) > 0) return false;

      // 2. Filtro por término de búsqueda (Nombre, Apellido, DNI o Teléfono)
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase().trim();
        const nombreComp = String(p.nombre_completo || `${p.apellido} ${p.nombre}`).toLowerCase();
        const dniStr = String(p.dni || '').toLowerCase();
        const telStr = String(p.telefono || '').toLowerCase();
        return nombreComp.includes(q) || dniStr.includes(q) || telStr.includes(q);
      }

      return true;
    });
  }, [pacientesSaldos, filtroEstado, searchTerm]);

  // Paginación
  const totalPaginas = Math.ceil(pacientesFiltrados.length / ITEMS_POR_PAGINA) || 1;
  const pacientesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    return pacientesFiltrados.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [pacientesFiltrados, paginaActual]);

  const handleSeleccionarFiltro = (filtro) => {
    setFiltroEstado(filtro);
    setPaginaActual(1);
  };

  const logoHeader = (
    <div
      className="logo-header-wrapper w-10 h-10 min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] rounded-full border border-slate-200 overflow-hidden flex items-center justify-center bg-white shrink-0"
      style={{
        width: '40px',
        height: '40px',
        minWidth: '40px',
        minHeight: '40px',
        maxWidth: '40px',
        maxHeight: '40px',
        borderRadius: '50%',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      <img
        src={logoClinica}
        alt="Consultorio M&V"
        className="logo-header w-full h-full object-contain p-1"
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          padding: '4px',
          display: 'block',
        }}
      />
    </div>
  );

  const headerActions = (
    <button
      type="button"
      onClick={() => handleAbrirRegistrarCobro(null)}
      className="btn-registrar-cobro"
      aria-label="Registrar un cobro o plan"
    >
      + Registrar Cobro
    </button>
  );

  return (
    <div className="gestion-cobros-page app-page-wrapper">
      <div className="gestion-cobros-card cobros-container app-view-container">
        <HeaderVolver
          title="Cuentas Corrientes y Cobros"
          onBack={handleVolver}
          backText="Volver"
          showBack={true}
          logo={logoHeader}
          actions={headerActions}
        />

        <main className="gestion-cobros-content main-content">

        {/* ==========================================================
            2. Barra de Búsqueda y Filtros Rápidos (Pills)
            ========================================================== */}
        <section className="cobros-filters-section" aria-label="Filtros de búsqueda">
          <div className="cobros-search-container">
            <span className="cobros-search-icon" aria-hidden="true">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="cobros-search-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar paciente por Nombre, Apellido, DNI o Teléfono..."
              aria-label="Buscar pacientes"
            />
          </div>

          <div className="cobros-pills-row" role="group" aria-label="Filtrar por estado de saldo">
            <span className="cobros-pills-label">Filtrar:</span>

            {PILLS_FILTRO.map(({ id, label }) => {
              const isActive = filtroEstado === id;
              const count = conteos[id] ?? 0;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSeleccionarFiltro(id)}
                  className={`cobros-pill-btn ${isActive ? 'active' : ''}`}
                >
                  <span>{label}</span>
                  <span className="cobros-pill-count">{count}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ==========================================================
            3. Tabla Maestro para Escritorio (> 768px)
            ========================================================== */}
        <div className="hidden md:block overflow-x-auto w-full tabla-cobros-desktop">
          <div className="cobros-table-wrapper w-full">
            <div className="cobros-table-scroll w-full overflow-x-auto select-none pb-2">
              <table className="cobros-table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '28%' }}>Paciente</th>
                    <th scope="col" style={{ width: '15%' }}>Costo Acordado</th>
                    <th scope="col" style={{ width: '15%' }}>Total Pagado</th>
                    <th scope="col" style={{ width: '16%' }}>Saldo Pendiente</th>
                    <th scope="col" style={{ width: '12%' }}>Estado</th>
                    <th scope="col" className="th-acciones" style={{ width: '14%' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr>
                      <td colSpan={6} className="cobros-empty-state">
                        <p>Cargando saldos y cuentas de pacientes...</p>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="cobros-empty-state">
                        <p style={{ color: '#ef4444' }}>{error}</p>
                      </td>
                    </tr>
                  ) : pacientesPaginados.length > 0 ? (
                    pacientesPaginados.map((item) => {
                      const saldo = Number(item.saldo_pendiente) || 0;
                      const tieneDeuda = saldo > 0;

                      return (
                        <tr key={item.id_paciente}>
                          <td>
                            <div className="td-nombre-col">
                              <span className="paciente-nombre-principal">{item.nombre_completo}</span>
                              <span className="paciente-tratamiento-sub">
                                DNI: {item.dni || 'Sin DNI'} {item.telefono ? `| Tel: ${item.telefono}` : ''}
                              </span>
                            </div>
                          </td>
                          <td className="td-costo">{formatearMoneda(item.costo_acordado)}</td>
                          <td className="td-pagado">{formatearMoneda(item.total_pagado)}</td>
                          <td className={`td-saldo-pendiente ${tieneDeuda ? 'deuda' : 'al-dia'}`}>
                            {formatearMoneda(item.saldo_pendiente)}
                          </td>
                          <td>
                            <span className={`badge-forma-pago ${tieneDeuda ? 'badge-con-deuda' : 'badge-al-dia'}`}>
                              {tieneDeuda ? 'Con Deuda' : 'Al Día'}
                            </span>
                          </td>
                          <td className="td-acciones">
                            <div className="cobros-acciones-cell">
                              <button
                                type="button"
                                className="btn-ver-cobro"
                                onClick={() => handleVerCuenta(item.id_paciente)}
                                aria-label={`Ver cuenta corriente de ${item.nombre_completo}`}
                                title="Ver ficha y cuenta corriente del paciente"
                              >
                                <Eye size={14} />
                                <span>Ver Cuenta</span>
                              </button>

                              {tieneDeuda && (
                                <button
                                  type="button"
                                  className="btn-pago-rapido"
                                  onClick={() => handleAbrirRegistrarCobro(item)}
                                  aria-label={`Registrar cobro para ${item.nombre_completo}`}
                                  title="Registrar cobro"
                                >
                                  <span>+ Pago</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : pacientesSaldos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="cobros-empty-state">
                        <p>No hay pacientes registrados en el sistema.</p>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={6} className="cobros-empty-state">
                        <p>No se encontraron pacientes para el filtro o búsqueda seleccionada.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ==========================================================
            3.1. Lista de Tarjetas para Móvil (<= 768px)
            ========================================================== */}
        <div className="block md:hidden w-full lista-cobros-mobile">
          {cargando ? (
            <div className="cobros-empty-state">
              <p>Cargando saldos y cuentas de pacientes...</p>
            </div>
          ) : error ? (
            <div className="cobros-empty-state">
              <p style={{ color: '#ef4444' }}>{error}</p>
            </div>
          ) : pacientesPaginados.length > 0 ? (
            pacientesPaginados.map((paciente) => {
              const saldo = Number(paciente.saldo_pendiente) || 0;
              const tieneDeuda = saldo > 0;
              const nombreDisplay = paciente.apellido && paciente.nombre
                ? `${paciente.apellido}, ${paciente.nombre}`
                : (paciente.nombre_completo || paciente.nombre || 'Paciente');

              return (
                <div key={paciente.id_paciente} className="cobro-card-mobile bg-white border border-slate-200 rounded-2xl p-4 mb-3.5 shadow-sm">
                  {/* Cabecera */}
                  <div className="flex items-center justify-between cobro-card-header">
                    <h3 className="font-bold text-slate-800 text-base cobro-card-nombre">{nombreDisplay}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border badge-card-estado ${
                      tieneDeuda 
                        ? 'bg-rose-50 text-rose-600 border-rose-200 badge-con-deuda' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 badge-al-dia'
                    }`}>
                      {tieneDeuda ? 'Con Deuda' : 'Al Día'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 cobro-card-subinfo">
                    DNI: <strong>{paciente.dni || 'Sin DNI'}</strong> · <span className="flex items-center gap-1"><Phone size={12} aria-hidden="true" /> {paciente.telefono || 'Sin teléfono'}</span>
                  </p>

                  {/* Métricas */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 my-3 grid grid-cols-3 text-center gap-1 cobro-card-metrics">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider metric-label">Costo Acordado</span>
                      <span className="text-sm font-bold text-slate-800 metric-val-costo">{formatearMoneda(paciente.costo_acordado)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider metric-label-pagado">Total Pagado</span>
                      <span className="text-sm font-bold text-emerald-600 metric-val-pagado">{formatearMoneda(paciente.total_pagado)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-rose-500 uppercase tracking-wider metric-label-deuda">Saldo Pendiente</span>
                      <span className="text-sm font-bold text-rose-600 metric-val-deuda">{formatearMoneda(paciente.saldo_pendiente)}</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="grid grid-cols-2 gap-3 mt-1 cobro-card-actions">
                    <button
                      type="button"
                      onClick={() => handleVerCuenta(paciente)}
                      className="w-full py-2 px-3 bg-white border border-emerald-400 text-emerald-700 font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition-colors btn-card-ver-cuenta"
                    >
                      <Eye size={16} /> Ver Cuenta
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAbrirRegistrarCobro(paciente)}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors shadow-sm btn-card-pago"
                    >
                      + Pago
                    </button>
                  </div>
                </div>
              );
            })
          ) : pacientesSaldos.length === 0 ? (
            <div className="cobros-empty-state">
              <p>No hay pacientes registrados en el sistema.</p>
            </div>
          ) : (
            <div className="cobros-empty-state">
              <p>No se encontraron pacientes para el filtro o búsqueda seleccionada.</p>
            </div>
          )}
        </div>

        {/* ==========================================================
            4. Paginador Inferior
            ========================================================== */}
        {!cargando && totalPaginas > 1 && (
          <nav className="cobros-pagination" aria-label="Paginación de cobros">
            <button
              type="button"
              className="btn-paginador"
              onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
              aria-label="Página anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="texto-paginador">
              Página {paginaActual} de {totalPaginas}
            </span>

            <button
              type="button"
              className="btn-paginador"
              onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              aria-label="Página siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        )}
        </main>
      </div>

      {/* Modal 1: Ficha y Cuenta Corriente del Paciente */}
      {fichaCuentaAbierta && pacienteSeleccionadoId && (
        <FichaCuentaPaciente
          isOpen={fichaCuentaAbierta}
          onClose={() => {
            setFichaCuentaAbierta(false);
            setPacienteSeleccionadoId(null);
          }}
          idPaciente={pacienteSeleccionadoId}
          onActualizar={cargarDatos}
        />
      )}

      {/* Modal 2: Registrar Cobro Unificado (Pago Total, Cuotas Fijas, o Acuerdo Informal) */}
      {modalNuevoCobroOpen && (
        <ModalRegistrarCobro
          isOpen={modalNuevoCobroOpen}
          onClose={() => {
            setModalNuevoCobroOpen(false);
            setPacienteSeleccionadoCobro(null);
          }}
          pacienteInicial={pacienteSeleccionadoCobro}
          onCobroRegistrado={cargarDatos}
        />
      )}

      {/* Botón flotante exclusivo para mobile */}
      <button
        type="button"
        onClick={() => handleAbrirRegistrarCobro(null)}
        className="btn-flotante-agregar"
        aria-label="Registrar Cobro"
      >
        +
      </button>
    </div>
  );
};

export default GestionCobros;
