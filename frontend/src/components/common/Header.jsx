/** @format */

export default function Header({
  icono: Icono,
  titulo,
  subtitulo,
  badge,
  botonAccion,
}) {
  return (
    <div className="flex flex-row items-center justify-between gap-3 bg-white px-5 py-3.5 border-b border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        {/* Ícono de cada pantalla (se mantiene en mobile y desktop) */}
        {Icono && (
          <div className="w-10 h-10 rounded-xl bg-[#e8f7f1] text-[#2eb086] flex items-center justify-center shrink-0 shadow-sm">
            <Icono size={20} />
          </div>
        )}

        <div className="flex flex-col items-start min-w-0">
          {/* Renglón 1: título / Renglón 2: badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2.5">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 tracking-tight leading-snug">
              {titulo}
            </h1>
            {badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f7f1] text-[#2eb086] border border-[#2eb086]/20 shrink-0">
                {badge}
              </span>
            )}
          </div>

          {/* Renglón 3: descripción */}
          {subtitulo && (
            <p className="text-xs text-gray-500 font-medium leading-tight mt-1 sm:mt-0.5 line-clamp-1 sm:line-clamp-none">
              {subtitulo}
            </p>
          )}
        </div>
      </div>

      {/* Botón o elemento de acción rápida a la derecha */}
      {botonAccion && <div className="flex items-center shrink-0">{botonAccion}</div>}
    </div>
  );
}
