import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, X, UserCheck, ChevronDown } from "lucide-react";

export const AdvertenciaPacienteIncompleto = ({
  advertenciaVisible,
  pacientesIncompletos,
  obtenerCamposFaltantes,
  cerrarAdvertencia,
}) => {
  const navigate = useNavigate();
  // Estado local para controlar el colapso (inicia colapsado/cerrado)
  const [desplegado, setDesplegado] = useState(false);

  if (!advertenciaVisible || pacientesIncompletos.length === 0) {
    return null;
  }

  return (
    <div className="mx-4 mt-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-2 text-amber-800 shadow-sm transition-all duration-200 shrink-0">
      {/* Barra superior de la advertencia */}
      <div className="flex items-center justify-between gap-2">
        {/* Botón desplegable que actúa como toggle */}
        <button
          type="button"
          onClick={() => setDesplegado((prev) => !prev)}
          className="flex items-center gap-2 hover:bg-amber-100/60 px-2 py-1 rounded-lg transition-colors text-left flex-1"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm font-semibold text-amber-900 flex-1">
            Hay {pacientesIncompletos.length}{" "}
            {pacientesIncompletos.length > 1 ? "pacientes creados " : "paciente creado "}
            con datos faltantes
          </p>
          <ChevronDown
            size={18}
            className={`text-amber-700 transition-transform duration-200 shrink-0 ${
              desplegado ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Botón para descartar/cerrar la advertencia por completo */}
        <button
          type="button"
          onClick={() => cerrarAdvertencia()}
          className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-700 transition-colors shrink-0"
          title="Cerrar advertencia"
        >
          <X size={18} />
        </button>
      </div>

      {/* Listado de pacientes (solo se renderiza cuando está desplegado) */}
      {desplegado && (
        <div className="pl-3 sm:pl-8 pt-1 flex flex-col gap-1 text-xs border-t border-amber-200/60">
          {pacientesIncompletos.map((paciente) => (
            <div
              key={paciente.id_paciente}
              className="flex items-center justify-between py-1.5 border-b border-amber-200/40 last:border-0 gap-2"
            >
              <span>
                <strong className="font-semibold text-amber-900">
                  {paciente.nombre} {paciente.apellido}
                </strong>{" "}
                - Faltan:{" "}
                <span className="text-amber-700 font-medium">{obtenerCamposFaltantes(paciente)}</span>
              </span>
              <button
                type="button"
                onClick={() => navigate(`/pacientes?editarId=${paciente.id_paciente}`)}
                className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg font-medium transition-colors shadow-xs shrink-0"
              >
                <UserCheck size={14} />
                <span>Completar</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
