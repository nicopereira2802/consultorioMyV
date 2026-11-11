import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, X, UserCheck } from "lucide-react";

export const AdvertenciaPacienteIncompleto = ({
  advertenciaVisible,
  pacientesIncompletos = [],
  obtenerCamposFaltantes,
  cerrarAdvertencia,
}) => {
  const navigate = useNavigate();
  const [desplegado, setDesplegado] = useState(false);

  if (!advertenciaVisible || !pacientesIncompletos || pacientesIncompletos.length === 0) {
    return null;
  }

  const tituloAdvertencia = `${pacientesIncompletos.length} ${
    pacientesIncompletos.length === 1 ? "paciente con datos faltantes" : "pacientes con datos faltantes"
  }`;

  return (
    <div className="relative inline-block text-left">
      {/* Mobile: cuadradito de 40x40 solo con el ícono (igual que el ícono del título).
          Desde sm: píldora con texto "X incompletos". */}
      <button
        type="button"
        onClick={() => setDesplegado((prev) => !prev)}
        title={tituloAdvertencia}
        aria-label={tituloAdvertencia}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl sm:inline-flex sm:w-auto sm:h-auto sm:gap-1.5 sm:px-3 sm:py-1 sm:rounded-lg border border-amber-300 bg-amber-50/90 hover:bg-amber-100/90 text-amber-900 text-xs sm:text-sm font-medium transition-colors shadow-sm cursor-pointer select-none"
      >
        {/* Punto naranja: en desktop va al lado del ícono, en mobile como indicador en la esquina */}
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white sm:static sm:border-0 sm:inline-block shrink-0" />

        {/* Ícono de advertencia */}
        <AlertTriangle className="w-5 h-5 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0" />

        {/* Texto dinámico (solo desde sm) */}
        <span className="hidden sm:inline">
          {pacientesIncompletos.length}{" "}
          {pacientesIncompletos.length === 1 ? "incompleto" : "incompletos"}
        </span>
      </button>

      {/* Popover / Menú desplegable flotante con la lista de pacientes */}
      {desplegado && (
        <>
          {/* Backdrop invisible para cerrar al hacer clic afuera */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDesplegado(false)}
          />

          {/* Menú flotante desplegable */}
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white border border-amber-200 rounded-xl shadow-xl z-50 p-3.5 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera del desplegable */}
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs sm:text-sm">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>
                  {pacientesIncompletos.length}{" "}
                  {pacientesIncompletos.length === 1
                    ? "paciente con datos faltantes"
                    : "pacientes con datos faltantes"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDesplegado(false)}
                className="p-1 hover:bg-amber-100/60 rounded-lg text-amber-800 transition-colors cursor-pointer"
                title="Cerrar lista"
              >
                <X size={16} />
              </button>
            </div>

            {/* Listado de pacientes incompletos */}
            <div className="max-h-60 overflow-y-auto flex flex-col gap-2 divide-y divide-amber-100/60 pr-1">
              {pacientesIncompletos.map((paciente) => (
                <div
                  key={paciente.id_paciente}
                  className="flex items-center justify-between pt-2 first:pt-0 gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {paciente.nombre} {paciente.apellido}
                    </p>
                    <p className="text-amber-700 font-medium text-[11px] truncate">
                      Faltan: {obtenerCamposFaltantes ? obtenerCamposFaltantes(paciente) : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDesplegado(false);
                      navigate(`/pacientes?editarId=${paciente.id_paciente}`);
                    }}
                    className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg font-medium transition-colors shadow-xs shrink-0 cursor-pointer text-xs"
                  >
                    <UserCheck size={14} />
                    <span>Completar</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Footer con opción de descartar aviso */}
            {cerrarAdvertencia && (
              <div className="pt-2 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setDesplegado(false);
                    cerrarAdvertencia();
                  }}
                  className="text-[11px] text-gray-400 hover:text-amber-800 transition-colors cursor-pointer font-medium"
                >
                  Descartar aviso
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
