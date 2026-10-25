/** @format */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const InputFiltro = ({
  datos,
  camposFiltrado,
  formatoVisual,
  alSeleccionar,
  placeholder,
  valorInicial = "",
  className = "",
}) => {
  const [busqueda, setBusqueda] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [posicion, setPosicion] = useState({ top: 0, left: 0, width: 0 });

  const inputRef = useRef(null);

  /* ─── MOSTRAR EL VALOR INICIAL CORRECTO AL EDITAR ─── */
  useEffect(() => {
    if (valorInicial !== undefined && valorInicial !== null && valorInicial !== "" && datos.length > 0) {
      // 1. Si valorInicial es directamente un objeto (ej: datosFormulario.Paciente)
      if (typeof valorInicial === "object") {
        const texto = formatoVisual ? formatoVisual(valorInicial) : valorInicial[camposFiltrado[0]];
        setBusqueda(texto);
        return;
      }

      // 2. Si valorInicial es un ID, buscar contemplando id_paciente, id_obra_social, id_practica o id
      const itemEncontrado = datos.find((d) => {
        const idItem = d.id_paciente || d.id_obra_social || d.id_practica || d.id;
        return String(idItem) === String(valorInicial);
      });

      if (itemEncontrado) {
        const texto = formatoVisual ? formatoVisual(itemEncontrado) : itemEncontrado[camposFiltrado[0]];
        setBusqueda(texto);
      }
    } else if (!valorInicial) {
      setBusqueda("");
    }
  }, [valorInicial, datos]);

  // Actualizar coordenadas para el Portal
  const actualizarPosicion = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPosicion({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (mostrarLista) {
      actualizarPosicion();
      const handleScrollResize = () => actualizarPosicion();
      window.addEventListener("resize", handleScrollResize);
      window.addEventListener("scroll", handleScrollResize, true);
      return () => {
        window.removeEventListener("resize", handleScrollResize);
        window.removeEventListener("scroll", handleScrollResize, true);
      };
    }
  }, [mostrarLista]);

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
    <div className={`relative w-full ${className}`}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setMostrarLista(true);
        }}
        onFocus={() => {
          actualizarPosicion();
          setMostrarLista(true);
        }}
        className="border-gray-200 rounded-xl bg-gray-50 w-full border p-2"
        onBlur={() => {
          setTimeout(() => setMostrarLista(false), 200);
        }}
      />

      {mostrarLista &&
        createPortal(
          <ul
            style={{
              position: "absolute",
              top: `${posicion.top + 4}px`,
              left: `${posicion.left}px`,
              width: `${posicion.width}px`,
              zIndex: 99999,
            }}
            className="bg-white border border-gray-300 rounded-md shadow-xl max-h-47 overflow-y-auto"
            onMouseDown={(e) => e.preventDefault()}
          >
            {resultados.length > 0 ? (
              resultados.map((item, index) => (
                <li
                  key={`${item.id}-${index}`}
                  onClick={() => manejarClickOpcion(item)}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                >
                  {formatoVisual ? formatoVisual(item) : item[camposFiltrado[0]]}
                </li>
              ))
            ) : (
              <li className="p-2 text-gray-500 italic text-sm">No se encontraron coincidencias</li>
            )}
          </ul>,
          document.body,
        )}
    </div>
  );
};

export default InputFiltro;
