import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import HeaderVolver from '../components/header';
import ModalRegistrarCobro from '../components/ModalRegistrarCobro';
import FichaCuentaPaciente from '../components/FichaCuentaPaciente';
import ModalRegistrarEntrega from '../components/ModalRegistrarEntrega';
import { getSaldosPacientes, getCuentaPaciente } from '../services/cobros.service';
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

  // Modal rápido de entrega directa desde la fila
  const [acuerdoParaEntregaDirecta, setAcuerdoParaEntregaDirecta] = useState(null);
  const [cargandoEntregaDirecta, setCargandoEntregaDirecta] = useState(false);

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
  const handleVerCuenta = (idPaciente) => {
    setPacienteSeleccionadoId(idPaciente);
    setFichaCuentaAbierta(true);
  };

  // Botón rápido "+ Pago / Entrega" desde la fila de la tabla
  const handleAbrirPagoEntrega = async (paciente) => {
    try {
      setCargandoEntregaDirecta(true);
      const cuenta = await getCuentaPaciente(paciente.id_paciente);
      const acuerdos = cuenta?.acuerdos || [];

      // Buscar el acuerdo activo que tenga saldo pendiente
      const acuerdoConSaldo = acuerdos.find((a) => Number(a.saldo_pendiente) > 0);

      if (acuerdoConSaldo) {
        setAcuerdoParaEntregaDirecta({
          ...acuerdoConSaldo,
          pacienteNombre: paciente.nombre_completo,
        });
      } else if (acuerdos.length > 0) {
        // Si todos están al día, abrir el primero o abrir la ficha completa
        handleVerCuenta(paciente.id_paciente);
      } else {
        // Si no tiene acuerdos, sugerir crear uno o abrir modal registrar cobro
        setModalNuevoCobroOpen(true);
      }
    } catch (err) {
      console.error('Error al obtener cuenta para pago rápido:', err);
      handleVerCuenta(paciente.id_paciente);
    } finally {
      setCargandoEntregaDirecta(false);
    }
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

  const headerActions = (
    <button
      type="button"
      onClick={() => setModalNuevoCobroOpen(true)}
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
            <span className="cobros-counter-badge">
              {pacientesFiltrados.length} de {pacientesSaldos.length} pacientes
            </span>
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
            3. Tabla Maestro de Saldos y Cuentas de Pacientes
            ========================================================== */}
        <div className="cobros-table-wrapper">
          <div className="cobros-table-scroll">
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
                                onClick={() => handleAbrirPagoEntrega(item)}
                                aria-label={`Registrar entrega para ${item.nombre_completo}`}
                                title="Registrar pago parcial o entrega"
                                disabled={cargandoEntregaDirecta}
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

      {/* Modal 2: Entrega Rápida desde la Fila de la Tabla */}
      {acuerdoParaEntregaDirecta && (
        <ModalRegistrarEntrega
          isOpen={Boolean(acuerdoParaEntregaDirecta)}
          onClose={() => setAcuerdoParaEntregaDirecta(null)}
          acuerdo={acuerdoParaEntregaDirecta}
          onSuccess={cargarDatos}
        />
      )}

      {/* Modal 3: Registrar Cobro Unificado (Pago Total, Cuotas Fijas, o Acuerdo Informal) */}
      {modalNuevoCobroOpen && (
        <ModalRegistrarCobro
          isOpen={modalNuevoCobroOpen}
          onClose={() => setModalNuevoCobroOpen(false)}
          onCobroRegistrado={cargarDatos}
        />
      )}
    </div>
  );
};

export default GestionCobros;
