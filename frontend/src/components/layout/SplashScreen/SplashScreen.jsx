import React from "react";

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
      className="fixed inset-0 top-0 left-0 w-screen h-screen m-0 p-0 border-none rounded-none bg-white flex flex-col items-center justify-center z-[99999] transition-all duration-400 ease-in-out"
      role="status"
      aria-live="polite"
      aria-label="Cargando M&V"
    >
      <div className="flex flex-col items-center gap-0">
        {/* Logo original estático sin distorsiones */}
        <img src="/logo.png" alt="M&V" className="w-[95px] h-[95px] object-contain block" />

        <h1 className="font-['Satisfy',cursive] text-[3.2rem] text-[#2eb086] tracking-[2px] mt-4 mb-2 mx-0 leading-[1.1] text-center">
          M&V
        </h1>

        {mensaje && <p className="text-[0.95rem] text-slate-500 mt-0 mb-2 mx-0 font-medium">{mensaje}</p>}

        {/* Indicador de carga: spinner circular tradicional y sutil en verde institucional */}
        <div
          className="w-8 h-8 border-[3px] border-[#2eb086]/20 border-t-[#2eb086] rounded-full animate-spin mt-2"
          aria-hidden="true"
        ></div>
      </div>
    </div>
  );
};

export default SplashScreen;
