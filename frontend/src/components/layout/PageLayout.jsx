import React from "react";
import { Plus } from "lucide-react";

export default function PageLayout({ children, onAdd }) {
  return (
    <div>
      {/* Contenido principal de la página */}
      <main>{children}</main>

      {/* Botón flotante condicional (FAB) posicionado arriba del bottom bar */}
      {onAdd && (
        <button
          onClick={onAdd}
          className="fixed sm:hidden right-4 bottom-18 z-40 bg-blue-600 hover:bg-blue-700 text-white w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 focus:outline-none"
          aria-label="Crear nuevo registro"
        >
          <span className="text-2xl font-light leading-none">
            <Plus size={20} />
          </span>
        </button>
      )}
    </div>
  );
}
