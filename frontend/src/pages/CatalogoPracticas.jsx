import { useState, useEffect, useMemo } from 'react';
import HeaderVolver from '../components/header';
import ModalNuevaPractica from '../components/ModalNuevaPractica';
import ModalConfirmarEliminacion from '../components/ModalConfirmarEliminacion';
import {
  getPracticas,
  crearPractica,
  actualizarPractica,
  eliminarPractica
} from '../services/practicas.service';
import './CatalogoPracticas.css';

/**
 * CatalogoPracticas - Gestión de Prácticas Odontológicas
 * Sincronizado con el esquema relacional PRACTICA:
 * id_practica, codigo_nomenclador, nombre_nomenclador, nombre_referencia, especialidad, precio_referencia, activo
 */
export const CatalogoPracticas = () => {
  const [practicas, setPracticas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [practicaEditando, setPracticaEditando] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const [practicaAEliminar, setPracticaAEliminar] = useState(null);
  const [isEliminando, setIsEliminando] = useState(false);

  const cargarPracticas = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await getPracticas();
      setPracticas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar catálogo de prácticas:', err);
      setError(err?.userMessage || err?.message || 'Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarPracticas();
  }, []);

  const recargarPracticas = cargarPracticas;

  const handleAbrirNuevo = () => {
    setPracticaEditando(null);
    setIsModalOpen(true);
  };

  const handleAbrirEditar = (practica) => {
    setPracticaEditando(practica);
    setIsModalOpen(true);
  };

  const handleCerrarModal = () => {
    setIsModalOpen(false);
    setPracticaEditando(null);
  };

  const handleGuardarPractica = async (datosPractica) => {
    if (!datosPractica.codigo_nomenclador?.trim()) {
      throw new Error('El código del nomenclador es obligatorio.');
    }

    if (!datosPractica.nombre_referencia?.trim()) {
      throw new Error('El nombre de referencia es obligatorio.');
    }

    if (
      datosPractica.precio_referencia === undefined ||
      datosPractica.precio_referencia === null ||
      datosPractica.precio_referencia === '' ||
      isNaN(Number(datosPractica.precio_referencia))
    ) {
      throw new Error('El precio de referencia es obligatorio.');
    }

    try {
      if (practicaEditando) {
        const actualizada = await actualizarPractica(practicaEditando.id_practica, datosPractica);
        mostrarFeedback(`Práctica "${actualizada.nombre_referencia}" actualizada.`);
      } else {
        const nueva = await crearPractica(datosPractica);
        mostrarFeedback(`Práctica "${nueva.nombre_referencia}" registrada con éxito.`);
      }

      handleCerrarModal();
      await recargarPracticas();
    } catch (err) {
      console.error('Error al guardar práctica:', err);
      throw err;
    }
  };

  const handleSolicitarEliminacion = (practica) => {
    setPracticaAEliminar(practica);
  };

  const handleConfirmarEliminacion = async () => {
    if (practicaAEliminar) {
      try {
        setIsEliminando(true);
        await eliminarPractica(practicaAEliminar.id_practica);
        const nombre = practicaAEliminar.nombre_referencia;
        setPracticas((prev) => prev.filter((p) => p.id_practica !== practicaAEliminar.id_practica));
        mostrarFeedback(`Práctica "${nombre}" eliminada.`);
        setPracticaAEliminar(null);
      } catch (err) {
        console.error('Error al eliminar práctica:', err);
        mostrarFeedback(err?.userMessage || err?.message || 'Error al eliminar la práctica.');
        setPracticaAEliminar(null);
      } finally {
        setIsEliminando(false);
      }
    }
  };

  const mostrarFeedback = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  };

  const practicasFiltradas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return practicas;

    return practicas.filter((p) =>
      p.nombre_referencia.toLowerCase().includes(q) ||
      p.codigo_nomenclador.toLowerCase().includes(q) ||
      p.especialidad.toLowerCase().includes(q) ||
      (p.nombre_nomenclador && p.nombre_nomenclador.toLowerCase().includes(q))
    );
  }, [practicas, searchQuery]);

  const headerActions = (
    <button
      type="button"
      className="btn-nueva-practica"
      onClick={handleAbrirNuevo}
      aria-label="Agregar nueva práctica odontológica"
    >
      <span>+</span>
      <span>Nueva Práctica</span>
    </button>
  );

  return (
    <div className="catalogo-page app-page-wrapper">
      <div className="catalogo-card vista-contenedor app-view-container">
        <HeaderVolver
          title="Catálogo de Prácticas"
          backPath="/agenda"
          actions={headerActions}
        />

        <main className="catalogo-content main-content">
          {feedbackMessage && (
            <div className="catalogo-feedback-banner success" role="alert">
              <span>{feedbackMessage}</span>
            </div>
          )}

          <div className="catalogo-toolbar">
            <div className="catalogo-search-wrapper">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="catalogo-search-input"
                placeholder="Buscar por Nombre, Código o Especialidad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar prácticas odontológicas"
              />
            </div>

            <div className="catalogo-stats">
              {cargando ? (
                <span>Cargando catálogo...</span>
              ) : (
                <span>{practicasFiltradas.length} de {practicas.length} prácticas</span>
              )}
            </div>
          </div>

          {cargando && (
            <div className="catalogo-feedback-banner info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <div className="gestion-spinner" style={{ width: '20px', height: '20px' }}></div>
              <p>Consultando base de prácticas odontológicas...</p>
            </div>
          )}

          {error && !cargando && (
            <div className="catalogo-feedback-banner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px' }}>
              <div className="agenda-empty-state-icon" aria-hidden="true" style={{ fontSize: '2rem' }}>⚠️</div>
              <p style={{ color: '#ef4444', fontWeight: 600, margin: 0 }}>{error}</p>
              <button
                type="button"
                className="btn-state-action"
                onClick={cargarPracticas}
                style={{ padding: '6px 16px', fontSize: '0.85rem' }}
              >
                Reintentar
              </button>
            </div>
          )}

          {!cargando && !error && practicasFiltradas.length === 0 && (
            <div className="catalogo-feedback-banner info">
              <p>
                {searchQuery.trim()
                  ? `No se encontraron prácticas que coincidan con "${searchQuery}".`
                  : "No hay prácticas registradas en el catálogo. Utiliza el botón '+' para incorporar una."}
              </p>
            </div>
          )}

          {!cargando && !error && practicasFiltradas.length > 0 && (
            <div className="practicas-table-container">
              <table className="practicas-table">
                <thead>
                  <tr>
                    <th>Nombre de la Práctica</th>
                    <th>Código Nomenclador</th>
                    <th>Especialidad</th>
                    <th>Precio Referencia</th>
                    <th className="th-acciones">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {practicasFiltradas.map((p) => (
                    <tr key={p.id_practica}>
                      <td className="practica-nombre-cell">
                        <span className="practica-nombre-texto">{p.nombre_referencia}</span>
                        {p.nombre_nomenclador && p.nombre_nomenclador !== p.nombre_referencia && (
                          <span className="practica-desc-texto">{p.nombre_nomenclador}</span>
                        )}
                      </td>
                      <td>
                        <span className="badge-codigo">{p.codigo_nomenclador}</span>
                      </td>
                      <td>
                        <span className="badge-modulo">{p.especialidad}</span>
                      </td>
                      <td>
                        <span className="arancel-texto">
                          $ {Number(p.precio_referencia).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="td-acciones">
                        <div className="practicas-actions-group">
                          <button
                            type="button"
                            className="practica-btn-action practica-btn-editar"
                            onClick={() => handleAbrirEditar(p)}
                            aria-label={`Editar práctica ${p.nombre_referencia}`}
                            title="Editar Práctica"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            className="practica-btn-action practica-btn-eliminar bg-[#f87171] hover:bg-[#ef4444] text-white font-medium rounded-xl transition-all shadow-sm"
                            onClick={() => handleSolicitarEliminacion(p)}
                            aria-label={`Eliminar práctica ${p.nombre_referencia}`}
                            title="Eliminar Práctica"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!cargando && !error && practicasFiltradas.length > 0 && (
            <div className="practicas-cards-mobile">
              {practicasFiltradas.map((p) => (
                <article key={p.id_practica} className="practica-card-item">
                  <div className="practica-card-header">
                    <h3 className="practica-card-titulo">{p.nombre_referencia}</h3>
                    <span className="badge-codigo">{p.codigo_nomenclador}</span>
                  </div>

                  <div className="practica-card-meta-row">
                    <span className="badge-modulo">{p.especialidad}</span>
                    <span className="arancel-texto">
                      $ {Number(p.precio_referencia).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {p.nombre_nomenclador && p.nombre_nomenclador !== p.nombre_referencia && (
                    <p className="practica-card-desc">{p.nombre_nomenclador}</p>
                  )}

                  <div className="practica-card-actions">
                    <button
                      type="button"
                      className="btn-card-edit"
                      onClick={() => handleAbrirEditar(p)}
                      aria-label={`Editar ${p.nombre_referencia}`}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-card-delete bg-[#f87171] hover:bg-[#ef4444] text-white font-medium rounded-xl transition-all shadow-sm"
                      onClick={() => handleSolicitarEliminacion(p)}
                      aria-label={`Eliminar ${p.nombre_referencia}`}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      <button
        type="button"
        className="btn-flotante-agregar"
        onClick={handleAbrirNuevo}
        aria-label="Agregar nueva práctica"
      >
        +
      </button>

      {isModalOpen && (
        <ModalNuevaPractica
          isOpen={isModalOpen}
          onClose={handleCerrarModal}
          onGuardar={handleGuardarPractica}
          practica={practicaEditando}
        />
      )}

      <ModalConfirmarEliminacion
        isOpen={Boolean(practicaAEliminar)}
        onClose={() => !isEliminando && setPracticaAEliminar(null)}
        onConfirm={handleConfirmarEliminacion}
        nombrePractica={practicaAEliminar?.nombre_referencia}
        isLoading={isEliminando}
      />
    </div>
  );
};

export default CatalogoPracticas;
