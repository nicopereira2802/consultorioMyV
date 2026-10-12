/** @format */

export default function Header({ icono: Icono, titulo, subtitulo, badge, botonAccion }) { // bg-[#89b8cd]
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border-b border-gray-100 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Ícono dinámico con contenedor estilizado */}
        {Icono && (
          <div className="w-12 h-12 rounded-2xl bg-[#e8f7f1] text-[#2eb086] flex items-center justify-center shrink-0 shadow-sm">
            <Icono size={24} />
          </div>
        )}

        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              {titulo}
            </h1>
            {/* Badge opcional (ej: fecha o total de registros) */}
            {badge && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f7f1] text-[#2eb086] border border-[#2eb086]/20">
                {badge}
              </span>
            )}
          </div>
          {subtitulo && (
            <p className="text-sm text-gray-500 font-medium">{subtitulo}</p>
          )}
        </div>
      </div>

      {/* Botón de Acción Rápida opcional */}
      {botonAccion && <div>{botonAccion}</div>}
    </div>
  );
}