import { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle,
  DollarSign,
  Shield,
  FileText,
  User,
  Calendar,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import DentalLogo from '../assets/DentalLogo';
import { api, extractDataArray, extractErrorMessage } from '../services/api';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export default function AtencionTurno({
  turno,
  paciente,
  onClose,
  onSuccess
}) {
  const [obrasSocialesDisponibles, setObrasSocialesDisponibles] = useState([]);
  const [selectedObraSocialId, setSelectedObraSocialId] = useState('1'); // Particular por defecto
  const [montoFinal, setMontoFinal] = useState(turno?.precio_final ? String(turno.precio_final) : '0');
  const [notasAtencion, setNotasAtencion] = useState(turno?.notas_atencion || '');

  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const pacienteId = turno?.id_paciente || paciente?.id_paciente;

  // Cargar obras sociales del paciente y catálogo general
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCatalog(true);

    Promise.allSettled([
      api.get('/obras-sociales'),
      api.get('/pacientes-por-obras-sociales')
    ]).then(([osRes, posRes]) => {
      if (!isMounted) return;

      const todasOS = osRes.status === 'fulfilled' ? extractDataArray(osRes.value) : [];
      const todosPOS = posRes.status === 'fulfilled' ? extractDataArray(posRes.value) : [];

      // Mapear catálogo general por ID
      const osCatalogMap = {};
      todasOS.forEach((os) => {
        osCatalogMap[os.id_obra_social] = os;
      });

      // Obras sociales que tiene registradas el paciente actual
      const posPaciente = todosPOS.filter((p) => p.id_paciente === pacienteId);

      // Armar la lista de opciones: siempre debe estar "Particular"
      const opciones = [];

      // 1. Particular siempre disponible
      const particularOS = todasOS.find((os) => os.nombre?.toLowerCase() === 'particular') || {
        id_obra_social: 1,
        nombre: 'Particular'
      };
      opciones.push({
        id: particularOS.id_obra_social,
        nombre: 'Particular',
        nroAfiliado: null
      });

      // 2. Agregar las coberturas registradas para este paciente
      posPaciente.forEach((item) => {
        const osData = osCatalogMap[item.id_obra_social] || item.ObraSocial;
        if (osData && osData.id_obra_social !== particularOS.id_obra_social) {
          opciones.push({
            id: osData.id_obra_social,
            nombre: osData.nombre,
            nroAfiliado: item.nro_afiliado || null
          });
        }
      });

      setObrasSocialesDisponibles(opciones);

      // Si el paciente tiene alguna obra social registrada que no sea particular, seleccionarla por defecto o dejar Particular
      if (opciones.length > 1) {
        setSelectedObraSocialId(String(opciones[1].id));
      } else {
        setSelectedObraSocialId(String(particularOS.id_obra_social));
      }
    }).catch((err) => {
      console.error('Error al cargar coberturas:', err);
    }).finally(() => {
      if (isMounted) setIsLoadingCatalog(false);
    });

    return () => {
      isMounted = false;
    };
  }, [pacienteId]);

  // Manejar el envío para registrar la atención
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const numericMonto = parseFloat(montoFinal);
    if (isNaN(numericMonto) || numericMonto < 0) {
      setErrorMessage('Por favor ingresa un monto final válido (número mayor o igual a 0).');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        notas_consulta: turno.notas_consulta || 'Atención registrada',
        notas_atencion: notasAtencion.trim() || null,
        precio_final: numericMonto,
        id_obra_social: selectedObraSocialId ? Number(selectedObraSocialId) : 1
      };

      await api.patch(`/turnos/${turno.id_turno}/atender`, payload);

      if (onSuccess) {
        onSuccess({
          message: '¡Turno atendido y registrado con éxito!',
          turnoId: turno.id_turno
        });
      }
    } catch (err) {
      console.error('Error al registrar la atención del turno:', err);
      setErrorMessage(extractErrorMessage(err, 'Ocurrió un error al registrar la atención del turno.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const pacienteNombre = paciente
    ? `${paciente.nombre} ${paciente.apellido}`
    : turno?.Paciente
      ? `${turno.Paciente.nombre} ${turno.Paciente.apellido}`
      : `Paciente #${pacienteId}`;

  const pacienteDni = paciente?.dni || turno?.Paciente?.dni;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-150 text-left border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <DentalLogo className="w-9 h-9" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                Registrar Atención de Turno
              </h2>
              <p className="text-xs text-teal-700 font-semibold tracking-wide uppercase mt-0.5">
                Paso final • Marcar como Atendido
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen del Turno y Paciente */}
        <div className="mt-4 p-3.5 bg-teal-50/70 border border-teal-100/80 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2 text-teal-900 font-semibold text-sm">
            <User className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{pacienteNombre}</span>
            {pacienteDni && (
              <span className="text-xs font-normal text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-md">
                DNI: {pacienteDni}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-teal-800">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              {formatDate(turno?.fecha_hora_inicio)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              {formatTime(turno?.fecha_hora_inicio)} - {formatTime(turno?.fecha_hora_fin)} hs
            </span>
          </div>
        </div>

        {/* Mensaje de Error */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario con los 3 campos solicitados */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Campo 1: Obra Social del Paciente (Siempre incluye 'Particular') */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-teal-600" />
              <span>1. Obra Social aplicada a la consulta</span>
            </label>
            <div className="relative">
              <select
                id="select-obra-social-atencion"
                value={selectedObraSocialId}
                onChange={(e) => setSelectedObraSocialId(e.target.value)}
                disabled={isSubmitting || isLoadingCatalog}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 rounded-xl text-sm font-medium text-gray-900 outline-none transition-all cursor-pointer disabled:bg-gray-100"
              >
                {isLoadingCatalog ? (
                  <option value="1">Cargando coberturas del paciente...</option>
                ) : (
                  obrasSocialesDisponibles.map((os) => (
                    <option key={os.id} value={os.id}>
                      {os.nombre} {os.nroAfiliado ? `(Afiliado: ${os.nroAfiliado})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Campo 2: Monto Final (Sobreescribe precio_final de turnos) */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>2. Monto final a cobrar ($)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-bold text-sm">
                $
              </div>
              <input
                id="input-monto-final-atencion"
                type="number"
                step="0.01"
                min="0"
                value={montoFinal}
                onChange={(e) => setMontoFinal(e.target.value)}
                disabled={isSubmitting}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 rounded-xl text-sm font-bold text-gray-900 outline-none transition-all disabled:bg-gray-100"
                required
              />
            </div>
          </div>

          {/* Campo 3: Observaciones de la Atención (notas_atencion) */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>3. Observaciones de la atención realizada</span>
            </label>
            <textarea
              id="textarea-notas-atencion"
              rows={3}
              value={notasAtencion}
              onChange={(e) => setNotasAtencion(e.target.value)}
              disabled={isSubmitting}
              placeholder="Detalle los procedimientos realizados, indicaciones dadas al paciente, evolución clínica..."
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 rounded-xl text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-100 resize-none"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              id="btn-confirmar-atencion"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirmar y Marcar Atendido</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
