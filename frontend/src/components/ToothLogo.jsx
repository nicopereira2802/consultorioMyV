import logoImg from '../assets/logo.png';

/**
 * ToothLogo - Logotipo oficial de M&V Turnos
 * Representa el molar estilizado con el calendario y la flecha circular de turnos
 *
 * @param {number|string} size - Tamaño en píxeles (ancho y alto)
 * @param {string} className - Clases CSS adicionales
 * @param {string} alt - Texto alternativo accesible
 */
export const ToothLogo = ({ size = 36, className = '', alt = 'M&V Turnos Odontológicos' }) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <img
      src={logoImg}
      alt={alt}
      width={size}
      height={size}
      className={`app-brand-logo ${className}`.trim()}
      style={{
        width: pixelSize,
        height: pixelSize,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        borderRadius: '50%'
      }}
    />
  );
};

export const Logo = ToothLogo;
export default ToothLogo;
