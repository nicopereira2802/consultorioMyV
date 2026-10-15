import { useState, useEffect } from "react";

const InputFiltro = ({
  datos,
  camposFiltrado,
  formatoVisual,
  alSeleccionar,
  placeholder,
  valorInicial = "",
}) => {
  const [busqueda, setBusqueda] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);

  useEffect(() => {
    if (valorInicial !== undefined && valorInicial !== null && valorInicial !== "" && datos.length > 0) {
      const itemEncontrado = datos.find((d) => String(d.id_obra_social || d.id) === String(valorInicial));
      if (itemEncontrado) {
        const texto = formatoVisual ? formatoVisual(itemEncontrado) : itemEncontrado[camposFiltrado[0]];
        setBusqueda(texto);
      }
    }
  }, [valorInicial, datos]);

  const obtenerValor = (objeto, ruta) => {
    return ruta
      .split(".")
      .reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), objeto);
  };

  const resultados = (datos || []).filter((item) => {
    if (!busqueda) return true;

    const textoItem = formatoVisual ? formatoVisual(item) : item[camposFiltrado[0]];
    if (busqueda === textoItem) return true;

    if (!camposFiltrado || camposFiltrado.length === 0) return true;

    return camposFiltrado.some((campo) => {
      const valor = obtenerValor(item, campo);
      return valor ? valor?.toString().toLowerCase().includes(busqueda.toLowerCase()) : false;
    });
  });

  const manejarClickOpcion = (item) => {
    const textoSeleccionado = formatoVisual ? formatoVisual(item) : item[camposFiltrado[0]];
    setBusqueda(textoSeleccionado);
    setMostrarLista(false);
    alSeleccionar(item);
  };

  return (
    <div className="relative w-full md:w-[45%]">
      <input
        type="text"
        placeholder={placeholder}
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setMostrarLista(true);
        }}
        onFocus={() => setMostrarLista(true)}
        className="form-control w-full border border-gray-600 p-2 rounded-md"
        onBlur={() => {
          setTimeout(() => setMostrarLista(false), 100);
        }}
      />

      {/* Solo mostramos la lista si hay algo escrito y hay resultados */}
      {mostrarLista && (
        <ul className="absolute z-50 left-0 right-0 bg-white border border-gray-300 mt-1 rounded-md shadow-xl max-h-26 overflow-y-auto">
          {resultados.length > 0 ? (
            resultados.map((item, index) => (
              <li
                key={item.id || index}
                onClick={() => manejarClickOpcion(item)}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
              >
                {formatoVisual ? formatoVisual(item) : item[camposFiltrado[0]]}
              </li>
            ))
          ) : (
            <li className="p-2 text-gray-500 italic text-sm">No se encontraron coincidencias</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default InputFiltro;
