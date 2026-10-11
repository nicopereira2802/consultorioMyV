/** @format */

import React from "react";

/**
 * Componente reutilizable para mostrar un modal con contenido personalizado.
 * @param {Object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Determina si el modal está visible.
 * @param {Function} props.onClose - Función para cerrar el modal.
 * @param {string} props.title - Título del modal.
 * @param {React.ReactNode} props.children - Contenido del modal.
 * @param {string} props.width - Ancho del modal (ej. 'max-w-lg' para formularios).
 * @param {boolean} props.showBackdrop - Si true, muestra un fondo oscurecido.
 * @param {string} props.backdropColor - Color del fondo (por defecto rgba(0,0,0,0.5)).
 * @param {boolean} props.showCloseButton - Si true, muestra un botón de cierre en la esquina.
 * @param {string} props.customClass - Clases CSS adicionales para personalizar el modal.
 */

const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  width = "max-w-lg",
  showBackdrop = true,
  backdropColor = "rgba(0, 0, 0, 0.5)",
  showCloseButton = true,
  customClass = "",
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4" // p-4 da un margen mínimo
      style={{
        backgroundColor: showBackdrop ? backdropColor : "transparent",
      }}
    >
      <div
        className={`bg-oliva rounded-lg shadow-xl w-full ${width} 
              flex flex-col max-h-[90vh] overflow-hidden relative ${customClass}`} // max-h-[90vh] es la clave
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white hover:text-gray-400 z-10"
            aria-label="Cerrar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {title && (
          <div className="p-4 border-b border-b-green-500 shrink-0 bg-[#2eb086]">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </div>
        )}

        {/* El contenedor de abajo es el que permite el scroll */}
        <div className="p-6 bg-white overflow-y-auto grow">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
