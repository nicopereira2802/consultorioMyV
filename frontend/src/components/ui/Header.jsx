/** @format */

export default function Header({
  icono: Icono,
  titulo,
  subtitulo,
  badge,
  botonAccion,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3.5 border-b border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Ícono dinámico más compacto */}
        {Icono && (
          <div className="w-10 h-10 rounded-xl bg-[#e8f7f1] text-[#2eb086] flex items-center justify-center shrink-0 shadow-sm">
            <Icono size={20} />
          </div>
        )}

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold text-gray-800 tracking-tight leading-snug">
              {titulo}
            </h1>
            {/* Badge opcional */}
            {badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f7f1] text-[#2eb086] border border-[#2eb086]/20">
                {badge}
              </span>
            )}
          </div>
          {subtitulo && (
            <p className="text-xs text-gray-500 font-medium leading-tight mt-0.5">
              {subtitulo}
            </p>
          )}
        </div>
      </div>

      {/* Botón de Acción Rápida opcional */}
      {botonAccion && <div className="hidden sm:flex">{botonAccion}</div>}
    </div>
  );
}
