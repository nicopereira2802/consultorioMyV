/** @format */

/**
 * Componente unificado para avatares / badges circulares con inicial.
 * Aplica diseño estilizado con relieve nítido, borde esmeralda y fondo verde menta suave.
 */
export default function BadgeInicial({ inicial, className = "" }) {
  const texto = (inicial || "S").toString().trim().toUpperCase();
  const valor = texto.length > 2 ? texto.charAt(0) : texto;
  const tamanoLetra = valor.length > 1 ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm";

  return (
    <div
      className={`w-8 h-8 min-w-[2rem] rounded-full border-2 border-emerald-300 bg-emerald-100/70 flex items-center justify-center font-bold ${tamanoLetra} text-teal-900 select-none shrink-0 ${className}`}
    >
      {valor}
    </div>
  );
}
