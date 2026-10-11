/** @format */

export default function Tabla({ columnas, cargando, sinDatosText = "No hay registros", children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
              {columnas.map((col, index) => (
                <th
                  key={index}
                  className={`px-6 py-4 ${col.align === "center" ? "text-center" : "text-left"}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {cargando ? (
              <tr>
                <td colSpan={columnas.length} className="py-12 text-center text-gray-400">
                  Cargando información...
                </td>
              </tr>
            ) : children && children.length > 0 ? (
              children
            ) : (
              <tr>
                <td colSpan={columnas.length} className="py-12 text-center text-gray-400 font-medium">
                  {sinDatosText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}