/** @format */

import { Plus } from "lucide-react";
import { useFloatingButton } from "../../../context/BotonFlotanteContext"; 
export function BotonFlotanteGlobal() {
  const { floatingAction } = useFloatingButton();

  // Si la vista actual no definió ninguna acción, no muestra el botón
  if (!floatingAction) return null;

  return (
    <button
      type="button"
      onClick={floatingAction}
      className="fixed bottom-20 right-4 z-40 flex md:hidden items-center justify-center gap-2 bg-[#2eb086] hover:bg-[#259370] text-white px-3 py-3 rounded-full font-semibold text-sm shadow-2xl transition-all duration-300 active:scale-95 group"
      title="Nuevo registro"
    >
      <Plus size={20} className="transition-transform group-hover:rotate-90 duration-300" />
    </button>
  );
}
