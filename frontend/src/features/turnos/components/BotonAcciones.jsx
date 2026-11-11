/** @format */
import { useState, useEffect, useRef } from "react";
import { MoreVertical, CheckSquare, CalendarDays, X, UserRoundX } from "lucide-react";
import MenuFlotantePortal from "../../../components/common/MenuFlotantePortal";
import { formatearTurnoParaReprogramar } from "../utils/formatTurnoParaReprogramar";

export function BotonAccionesTurno({
  turno,
  abrirParaAtender,
  abrirParaReprogramar,
  abrirParaCancelar,
  abrirParaInasistente,
}) {
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);
  const botonRef = useRef(null);

  // Saber si este menú específico está abierto
  const estaAbierto = menuAbiertoId === turno.id_turno;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuAbiertoId !== null && !event.target.closest(".menu-acciones-container")) {
        setMenuAbiertoId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuAbiertoId]);

  const ejecutarAccion = (e, callback) => {
    e.stopPropagation();
    setMenuAbiertoId(null);
    setTimeout(() => {
      if (typeof callback === "function") {
        callback(turno);
      }
    }, 0);
  };

  return (
    <div className="relative menu-acciones-container">
      <button
        ref={botonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setMenuAbiertoId(estaAbierto ? null : turno.id_turno);
        }}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={18} />
      </button>

      <MenuFlotantePortal targetRef={botonRef} isOpen={estaAbierto}>
        <button
          type="button"
          onClick={(e) => ejecutarAccion(e, abrirParaAtender)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 text-left transition-colors"
        >
          <CheckSquare size={16} />
          <span>Atender Turno</span>
        </button>

        <button
          type="button"
          onClick={(e) => ejecutarAccion(e, (t) => abrirParaReprogramar(t, formatearTurnoParaReprogramar))}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#3B7A94] hover:bg-[#f0f6f9] text-left transition-colors"
        >
          <CalendarDays size={16} />
          <span>Reprogramar</span>
        </button>

        <button
          type="button"
          onClick={(e) => ejecutarAccion(e, abrirParaCancelar)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 text-left transition-colors"
        >
          <X size={16} />
          <span>Cancelar Turno</span>
        </button>

        <button
          type="button"
          onClick={(e) => ejecutarAccion(e, abrirParaInasistente)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#2b5d73] hover:bg-[#f0f6f9] text-left transition-colors"
        >
          <UserRoundX size={16} />
          <span>Inasistente</span>
        </button>
      </MenuFlotantePortal>
    </div>
  );
}
