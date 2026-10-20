/** @format */
import { SearchX } from "lucide-react";
import React from "react";

export default function Tabla({
  columnas,
  cargando,
  search = "", // Término de búsqueda opcional
  cantFilasSkeleton = 5, // Cantidad de filas fantasmas a mostrar durante la carga
  sinDatosText = "No hay registros disponibles.",
  children,
}) {
  // Verificamos si los children contienen filas con datos
  const tieneDatos = React.Children.count(children) > 0;
  const estaBuscando = search.trim().length > 0;

  return (
    <div className="bg-white border border-gray-100 shadow-sm overflow-hidden flex-1">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* ENCABEZADO DE LA TABLA */}
          <thead className="bg-[#e8f7f1]">
            <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
              {columnas.map((col, index) => (
                <th
                  key={index}
                  className={`px-6 py-4 ${col.align === "center" ? "text-center" : "text-left"} ${col.className || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* CUERPO DE LA TABLA */}
          <tbody className="divide-y divide-gray-100 text-sm">
            {cargando ? (
              /* ESTADO 1: SKELETON (Cargando / Buscando) */
              Array.from({ length: cantFilasSkeleton }).map((_, filaIdx) => (
                <tr key={filaIdx} className="animate-pulse">
                  {columnas.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4">
                      {/* Simulación de bloques de texto/elementos */}
                      <div className="flex items-center gap-3">
                        {/* Simula un avatar si es la primera columna */}
                        {colIdx === 0 && (
                          <div className="hidden md:block w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                        )}
                        <div
                          className={`h-4 bg-gray-200 rounded-md ${
                            colIdx === 0 ? "w-36" : colIdx === columnas.length - 1 ? "w-16 mx-auto" : "w-24"
                          }`}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            ) : tieneDatos ? (
              /* ESTADO 2: DATOS REALES */
              children
            ) : (
              /* ESTADO 3: SIN RESULTADOS */
              <tr>
                <td colSpan={columnas.length} className="py-12 text-center font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                    {estaBuscando ? (
                      <>
                        <SearchX size={32} className="text-gray-300" />
                        <p className="text-gray-600 font-semibold">
                          No se encontraron resultados para <span className="text-gray-800">"{search}"</span>
                        </p>
                        <p className="text-xs text-gray-400">
                          Intenta con otros términos de búsqueda o verifica que esté bien escrito.
                        </p>
                      </>
                    ) : (
                      <span className="text-gray-400">{sinDatosText}</span>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
