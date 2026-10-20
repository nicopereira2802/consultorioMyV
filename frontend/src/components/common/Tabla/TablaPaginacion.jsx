/** @format */

export default function TablaPaginacion({ page, setPage, totalPages }) {
  return (
    <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-white">
      <div className="text-xs text-gray-500">
        Página {page} de {totalPages || 1}
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 transition-all"
          onClick={() => setPage(page - 1)}
        >
          Anterior
        </button>

        <select
          value={page}
          onChange={(e) => setPage(Number(e.target.value))}
          className="px-3 py-1.5 bg-[#2eb086] text-white rounded-xl text-xs font-semibold shadow-sm focus:outline-none cursor-pointer"
        >
          {Array.from({ length: totalPages || 1 }, (_, index) => (
            <option key={index + 1} value={index + 1} className="bg-white text-gray-800">
              {index + 1}
            </option>
          ))}
        </select>

        <button
          disabled={page >= totalPages}
          className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 transition-all"
          onClick={() => setPage(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
