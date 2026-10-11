import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import ToothLogo from '../components/ToothLogo';
import ModalDetalleCobro from '../components/ModalDetalleCobro';
import ModalRegistrarCobro from '../components/ModalRegistrarCobro';
import { getCobros } from '../services/cobros.service';
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
 * Formatea una fecha a formato legible DD/MM/YYYY HH:mm hs
 */
const formatearFecha = (raw) => {
  if (!raw) return '-';
  if (typeof raw === 'string' && raw.includes('hs')) return raw;
  try {
    const cleaned = typeof raw === 'string' ? raw.replace(' ', 'T') : raw;
    const d = new Date(cleaned);
    if (isNaN(d.getTime())) return String(raw);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hora}:${min} hs`;
  } catch {
    return String(raw);
  }
};

/**
 * Normaliza un registro de cobro proveniente del backend o base de datos
 */
const normalizarCobro = (item) => {
  // 1. Paciente
  const pac = item.Paciente || item.paciente;
  let nombrePaciente = 'Paciente sin asignar';
  if (pac?.apellido && pac?.nombre) {
    nombrePaciente = `${pac.apellido}, ${pac.nombre}`;
  } else if (pac?.nombre) {
    nombrePaciente = pac.nombre;
  } else if (item.nombre) {
    nombrePaciente = item.nombre;
  }

  // 2. DNI
  const dniPaciente = pac?.dni || item.dni || '-';

  // 3. Tratamiento / Práctica / Motivo
  const turno = item.Turno || item.turno;
  let tratamiento = 'Consulta Odontológica';
  if (turno?.Practicas && Array.isArray(turno.Practicas) && turno.Practicas.length > 0) {
    tratamiento = turno.Practicas
      .map((p) => p.nombre_referencia || p.nombre_nomenclador)
      .filter(Boolean)
      .join(', ');
  } else if (turno?.notas_consulta) {
    tratamiento = turno.notas_consulta;
  } else if (item.tratamiento) {
    tratamiento = item.tratamiento;
  } else if (!turno) {
    tratamiento = 'Pago a cuenta / Sin turno';
  }

  // 4. Forma de Pago
  const cuotas = item.Cuota || item.Cuotas || item.cuotas || [];
  const primeraCuota = Array.isArray(cuotas) && cuotas.length > 0 ? cuotas[0] : null;
  const rawMetodo = primeraCuota?.metodo_pago || item.forma_pago || item.metodo_pago || 'Efectivo';

  let formaPago = 'Efectivo';
  const mLower = String(rawMetodo).toLowerCase();
  if (mLower.includes('transferencia')) {
    formaPago = 'Transferencia';
  } else if (mLower.includes('crédito') || mLower.includes('credito')) {
    formaPago = 'Tarjeta Crédito';
  } else if (mLower.includes('débito') || mLower.includes('debito')) {
    formaPago = 'Tarjeta Débito';
  } else if (mLower.includes('tarjeta')) {
    formaPago = 'Tarjeta Débito';
  } else if (mLower.includes('efectivo')) {
    formaPago = 'Efectivo';
  } else {
    formaPago = rawMetodo;
  }

  // 5. Monto
  const monto = Number(item.monto_a_cobrar ?? item.monto ?? primeraCuota?.monto_cuota ?? 0);

  // 6. Fecha
  const rawFecha = item.fecha_emision || primeraCuota?.fecha_cobro || primeraCuota?.fecha_vencimiento || item.fecha;
  const fecha = formatearFecha(rawFecha);

  return {
    id: item.id_cobro || item.id || Math.random(),
    id_cobro: item.id_cobro || item.id,
    nombre: nombrePaciente,
    tratamiento,
    dni: dniPaciente,
    forma_pago: formaPago,
    monto,
    fecha,
    Cuota: cuotas,
    cant_cuotas: item.cant_cuotas || (cuotas.length > 0 ? cuotas.length : 1),
    _raw: item,
  };
};

/**
 * Determina la clase CSS del badge según la forma de pago (sin Mercado Pago)
 */
const getBadgeClase = (formaPago) => {
  const fp = String(formaPago || '').toLowerCase();
  if (fp.includes('transferencia')) return 'badge-transferencia';
  if (fp.includes('efectivo')) return 'badge-efectivo';
  if (fp.includes('crédito') || fp.includes('credito')) return 'badge-credito';
  if (fp.includes('débito') || fp.includes('debito') || fp.includes('tarjeta')) return 'badge-debito';
  return 'badge-default';
};

/**
 * Pastillas de filtrado oficial (sin Mercado Pago)
 */
const PILLS_FILTRO = [
  { id: 'Todos', label: 'Todos' },
  { id: 'Efectivo', label: 'Efectivo' },
  { id: 'Transferencia', label: 'Transferencia' },
  { id: 'Débito', label: 'Débito' },
  { id: 'Crédito', label: 'Crédito' },
];

/**
 * Pantalla Oficial: Registro de Cobros (M&V Turnos)
 */
export const GestionCobros = () => {
  const navigate = useNavigate();

  // Estados de datos
  const [cobros, setCobros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados de filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('Todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 10;

  // Estado del modal de detalle de cuotas
  const [cobroSeleccionado, setCobroSeleccionado] = useState(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  // Estado del modal de registrar nuevo cobro
  const [modalNuevoCobroOpen, setModalNuevoCobroOpen] = useState(false);

  // Carga reactiva de datos desde el backend
  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const res = await getCobros();

      const rawData = Array.isArray(res) ? res : (res?.data || []);
      const listaNormalizada = Array.isArray(rawData)
        ? rawData.map(normalizarCobro)
        : [];

      setCobros(listaNormalizada);
    } catch (err) {
      console.error('Error al obtener cobros desde la API:', err);
      setError('No se pudieron cargar los cobros desde el servidor.');
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

  // Abrir y cerrar modal de cuotas
  const handleAbrirDetalle = (item) => {
    setCobroSeleccionado(item);
    setModalDetalleAbierto(true);
  };

  const handleCerrarDetalle = () => {
    setModalDetalleAbierto(false);
    setCobroSeleccionado(null);
  };

  // Cálculo de conteos dinámicos para las pastillas (pills)
  const conteos = useMemo(() => {
    return {
      Todos: cobros.length,
      Efectivo: cobros.filter((c) =>
        c.forma_pago.toLowerCase().includes('efectivo')
      ).length,
      Transferencia: cobros.filter((c) =>
        c.forma_pago.toLowerCase().includes('transferencia')
      ).length,
      Débito: cobros.filter((c) => {
        const fp = c.forma_pago.toLowerCase();
        return fp.includes('débito') || fp.includes('debito') || fp === 'tarjeta';
      }).length,
      Crédito: cobros.filter((c) => {
        const fp = c.forma_pago.toLowerCase();
        return fp.includes('crédito') || fp.includes('credito');
      }).length,
    };
  }, [cobros]);

  // Filtrado reactivo en tiempo real
  const cobrosFiltrados = useMemo(() => {
    return cobros.filter((item) => {
      // 1. Filtro por pastilla seleccionada
      if (filtroMetodo !== 'Todos') {
        const fp = item.forma_pago.toLowerCase();
        if (filtroMetodo === 'Efectivo' && !fp.includes('efectivo')) return false;
        if (filtroMetodo === 'Transferencia' && !fp.includes('transferencia')) return false;
        if (filtroMetodo === 'Débito' && !(fp.includes('débito') || fp.includes('debito') || fp === 'tarjeta')) return false;
        if (filtroMetodo === 'Crédito' && !(fp.includes('crédito') || fp.includes('credito'))) return false;
      }

      // 2. Filtro por término de búsqueda (Nombre, DNI o Forma de Pago)
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase().trim();
        const matchNombre = item.nombre.toLowerCase().includes(q);
        const matchDni = String(item.dni).toLowerCase().includes(q);
        const matchForma = item.forma_pago.toLowerCase().includes(q);
        const matchTratamiento = item.tratamiento?.toLowerCase().includes(q);
        return matchNombre || matchDni || matchForma || matchTratamiento;
      }

      return true;
    });
  }, [cobros, filtroMetodo, searchTerm]);

  // Paginación
  const totalPaginas = Math.ceil(cobrosFiltrados.length / ITEMS_POR_PAGINA) || 1;
  const cobrosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    return cobrosFiltrados.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [cobrosFiltrados, paginaActual]);

  // Cambio de filtro pill
  const handleSeleccionarFiltro = (metodo) => {
    setFiltroMetodo(metodo);
    setPaginaActual(1);
  };

  return (
    <div className="gestion-cobros-page">
      <div className="gestion-cobros-card">
        {/* ==========================================================
            1. Cabecera Superior
            ========================================================== */}
        <header className="cobros-header">
          <div className="cobros-header-left">
            <button
              type="button"
              className="cobros-hamburger-btn"
              aria-label="Menú principal"
              title="Menú"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Isotipo oficial del diente con contorno circular verde del sistema */}
            <div className="cobros-logo-circle" aria-hidden="true">
              <ToothLogo size={32} />
            </div>

            <h1 className="cobros-titulo">Registro de Cobros</h1>
          </div>

          <div className="cobros-header-actions">
            <button
              type="button"
              onClick={handleVolver}
              className="btn-volver-cobros"
              aria-label="Volver a la pantalla anterior"
            >
              <span>←</span> Volver
            </button>

            <button
              type="button"
              onClick={() => setModalNuevoCobroOpen(true)}
              className="btn-registrar-cobro"
              aria-label="Registrar un nuevo cobro"
            >
              + Registrar Cobro
            </button>
          </div>
        </header>

        {/* ==========================================================
            2. Barra de Búsqueda y Filtros Rápidos
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
              placeholder="Buscar por Nombre, DNI o Forma de Pago..."
              aria-label="Buscar cobros"
            />
            <span className="cobros-counter-badge">
              {cobrosFiltrados.length} de {cobros.length} cobros
            </span>
          </div>

          <div className="cobros-pills-row" role="group" aria-label="Filtrar por método de pago">
            <span className="cobros-pills-label">Filtrar:</span>

            {PILLS_FILTRO.map(({ id, label }) => {
              const isActive = filtroMetodo === id;
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
            3. Tabla Principal de Cobros
            ========================================================== */}
        <div className="cobros-table-wrapper">
          <div className="cobros-table-scroll">
            <table className="cobros-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '28%' }}>Nombre</th>
                  <th scope="col" style={{ width: '14%' }}>DNI</th>
                  <th scope="col" style={{ width: '16%' }}>Forma de Pago</th>
                  <th scope="col" style={{ width: '16%' }}>Monto</th>
                  <th scope="col" style={{ width: '14%' }}>Fecha</th>
                  <th scope="col" className="th-acciones" style={{ width: '12%' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={6} className="cobros-empty-state">
                      <p>Cargando registros de cobros...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="cobros-empty-state">
                      <p style={{ color: '#ef4444' }}>{error}</p>
                    </td>
                  </tr>
                ) : cobrosPaginados.length > 0 ? (
                  cobrosPaginados.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="td-nombre-col">
                          <span className="paciente-nombre-principal">{item.nombre}</span>
                          <span className="paciente-tratamiento-sub">{item.tratamiento}</span>
                        </div>
                      </td>
                      <td className="td-dni">{item.dni}</td>
                      <td>
                        <span className={`badge-forma-pago ${getBadgeClase(item.forma_pago)}`}>
                          {item.forma_pago}
                        </span>
                      </td>
                      <td className="td-monto">{formatearMoneda(item.monto)}</td>
                      <td className="td-fecha">{item.fecha}</td>
                      <td className="td-acciones">
                        <button
                          type="button"
                          className="btn-ver-cobro"
                          onClick={() => handleAbrirDetalle(item)}
                          aria-label={`Ver desglose de cuotas de ${item.nombre}`}
                          title="Ver desglose de cuotas y formas de pago"
                        >
                          <Eye size={14} />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : cobros.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="cobros-empty-state">
                      <p>No hay cobros registrados en el sistema.</p>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={6} className="cobros-empty-state">
                      <p>No se encontraron cobros para el criterio de búsqueda seleccionado.</p>
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
        <div className="cobros-pagination">
          <button
            type="button"
            className="btn-paginador"
            disabled={paginaActual === 1}
            onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
            aria-label="Página anterior"
            title="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="texto-paginador">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            type="button"
            className="btn-paginador"
            disabled={paginaActual === totalPaginas || cobrosFiltrados.length === 0}
            onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
            aria-label="Página siguiente"
            title="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ==========================================================
          5. Modal de Detalle de Cobro y Cuotas
          ========================================================== */}
      <ModalDetalleCobro
        isOpen={modalDetalleAbierto}
        onClose={handleCerrarDetalle}
        cobro={cobroSeleccionado}
      />

      {/* ==========================================================
          6. Modal de Registro de Cobro
          ========================================================== */}
      <ModalRegistrarCobro
        isOpen={modalNuevoCobroOpen}
        onClose={() => setModalNuevoCobroOpen(false)}
        onCobroRegistrado={cargarDatos}
      />
    </div>
  );
};

export default GestionCobros;
