import './SplashScreen.css';

/**
 * SplashScreen - Pantalla de Carga / Splash Screen Oficial
 * Cobertura 100% blanca del viewport con tipografía 'Satisfy' para M&V,
 * logo original estático y spinner sutil tradicional como indicador de carga.
 *
 * @param {boolean} [visible=true] - Controla la visibilidad
 * @param {string} [mensaje] - Mensaje opcional debajo de la marca
 */
export const SplashScreen = ({ visible = true, mensaje }) => {
  if (!visible) return null;

  return (
    <div
      className="splash-container pantalla-carga"
      role="status"
      aria-live="polite"
      aria-label="Cargando M&V"
    >
      <div className="splash-logo-container">
        <img src="/logo.png" alt="M&V" className="splash-logo" />
        <h1 className="splash-titulo loading-brand-text">M&V</h1>
        {mensaje && <p className="splash-mensaje">{mensaje}</p>}
        <div className="splash-spinner" aria-hidden="true"></div>
      </div>
    </div>
  );
};

export default SplashScreen;

