/** @format */

import { Search } from "lucide-react";

// TODO: A futuro (o si notas que la API sufre peticiones de más), sería ideal implementar un pequeño debounce para esperar que termine de escribir

export default function TablaHeader({
  inicioRegistro,
  finRegistro,
  total,
  search,
  setSearch,
  placeholder = "Buscar...",
  children,
}) {
  return (
    <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
      <div className="text-sm font-medium text-gray-500">
        Mostrando {inicioRegistro} a {finRegistro} de {total} registros
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {children} {/* Aquí puedes renderizar selects o filtros adicionales si los hay */}
        <div className="relative flex-1 sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all"
          />
        </div>
      </div>
    </div>
  );
}
