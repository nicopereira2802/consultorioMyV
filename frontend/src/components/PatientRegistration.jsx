import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DentalLogo from '../assets/DentalLogo';
import { api, extractDataArray, extractErrorMessage } from '../services/api';

export default function PatientRegistration({ 
  obrasSociales = [], 
  onBack, 
  onSuccess 
}) {
  const navigate = useNavigate();
  const [obrasSocialesList, setObrasSocialesList] = useState(obrasSociales);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    fecha_nacimiento: '',
    telefono: '',
    domicilio: '',
    id_obra_social: '1', // 1 = Particular
    nro_socio: '',
    grupo_familiar: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar obras sociales del backend
  useEffect(() => {
    let isMounted = true;
    api.get('/obras-sociales')
      .then((res) => {
        if (isMounted) {
          const list = extractDataArray(res);
          setObrasSocialesList(list.length > 0 ? list : [{ id_obra_social: 1, nombre: 'Particular' }]);
        }
      })
      .catch((err) => {
        console.error('Error al cargar obras sociales:', err);
        if (isMounted) {
          setObrasSocialesList([{ id_obra_social: 1, nombre: 'Particular' }]);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMessage('');
  };

  const handleConfirmar = async (e) => {
    if (e) e.preventDefault();

    const nombreLimpio = formData.nombre.trim();
    const apellidoLimpio = formData.apellido.trim();
    const telefonoLimpio = formData.telefono.trim();

    if (!nombreLimpio || nombreLimpio.length < 2) {
      setErrorMessage('Por favor ingrese el nombre del paciente (mínimo 2 caracteres, solo letras).');
      return;
    }

    if (!apellidoLimpio || apellidoLimpio.length < 2) {
      setErrorMessage('Por favor ingrese el apellido del paciente (mínimo 2 caracteres, solo letras).');
      return;
    }

    if (!telefonoLimpio || telefonoLimpio.length < 8) {
      setErrorMessage('Por favor ingrese un teléfono válido de al menos 8 dígitos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Formato compatible con createPacienteSchema
      const payload = {
        nombre: nombreLimpio,
        apellido: apellidoLimpio,
        telefono: telefonoLimpio,
      };

      if (formData.dni && formData.dni.trim()) {
        const parsedDni = Number(formData.dni.trim());
        if (isNaN(parsedDni) || parsedDni <= 0) {
          setErrorMessage('El DNI debe ser un número positivo sin puntos ni letras.');
          setIsSubmitting(false);
          return;
        }
        payload.dni = parsedDni;
      }

      if (formData.fecha_nacimiento) {
        payload.fecha_nacimiento = formData.fecha_nacimiento;
      }

      if (formData.domicilio && formData.domicilio.trim().length >= 2) {
        payload.domicilio = formData.domicilio.trim();
      }

      await api.post('/pacientes', payload);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/pacientes', { state: { message: '¡Paciente registrado exitosamente!' } });
      }
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, 'Error al registrar el paciente'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Top Header Card Bar matching Image 4 */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3.5">
          <DentalLogo className="w-11 h-11" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Registrar Paciente
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack || (() => navigate('/pacientes'))}
            className="px-8 py-2.5 bg-[#F87171] hover:bg-[#EF4444] text-white font-medium rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer text-base sm:text-lg"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#A7F3D0] hover:bg-[#86EFAC] text-gray-900 font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer text-base sm:text-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm text-left">
          {errorMessage}
        </div>
      )}

      {/* Two Column Form */}
      <form onSubmit={handleConfirmar} className="pt-8 sm:pt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-16 gap-y-6">
          {/* Left Column */}
          <div className="space-y-5">
            {/* Nombre */}
            <div className="flex items-center justify-between">
              <label className="text-base sm:text-lg font-medium text-gray-900 w-36 sm:w-44 text-left">
                Nombre:
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                placeholder="Nombre..."
                className="flex-1 py-2 px-4 rounded-xl border border-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-left text-base shadow-2xs"
              />
            </div>

            {/* Apellido */}
            <div className="flex items-center justify-between">
              <label className="text-base sm:text-lg font-medium text-gray-900 w-36 sm:w-44 text-left">
                Apellido:
              </label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => handleChange('apellido', e.target.value)}
                placeholder="Apellido..."
                className="flex-1 py-2 px-4 rounded-xl border border-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-left text-base shadow-2xs"
              />
            </div>

            {/* DNI */}
            <div className="flex items-center justify-between">
              <label className="text-base sm:text-lg font-medium text-gray-900 w-36 sm:w-44 text-left">
                DNI:
              </label>
              <input
                type="number"
                value={formData.dni}
                onChange={(e) => handleChange('dni', e.target.value)}
                placeholder="Número sin puntos..."
                className="flex-1 py-2 px-4 rounded-xl border border-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-left text-base shadow-2xs"
              />
            </div>

            {/* Fecha de Nacimiento */}
            <div className="flex items-center justify-between">
              <label className="text-base sm:text-lg font-medium text-gray-900 w-36 sm:w-44 text-left">
                Fecha de Nacimiento:
              </label>
              <input
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-left text-base shadow-2xs bg-white cursor-pointer"
              />
            </div>

            {/* Telefono */}
            <div className="flex items-center justify-between">
              <label className="text-base sm:text-lg font-medium text-gray-900 w-36 sm:w-44 text-left">
                Teléfono:
              </label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="Mínimo 8 dígitos..."
                className="flex-1 py-2 px-4 rounded-xl border border-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-left text-base shadow-2xs"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Domicilio */}
            <div className="flex items-center justify-between">
              <label className="text-base sm:text-lg font-medium text-gray-900 w-36 sm:w-44 text-left">
                Domicilio:
              </label>
              <input
                type="text"
                value={formData.domicilio}
                onChange={(e) => handleChange('domicilio', e.target.value)}
                placeholder="Dirección..."
                className="flex-1 py-2 px-4 rounded-xl border border-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-left text-base shadow-2xs"
              />
            </div>

            {/* Obra social */}
            <div className="flex items-center justify-between">
              <label className="text-base sm:text-lg font-medium text-gray-900 w-36 sm:w-44 text-left">
                Obra social:
              </label>
              <select
                value={formData.id_obra_social}
                onChange={(e) => handleChange('id_obra_social', e.target.value)}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-left text-base shadow-2xs bg-white cursor-pointer"
              >
                {obrasSocialesList.map((os) => (
                  <option key={os.id_obra_social} value={os.id_obra_social}>
                    {os.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* N° de socio */}
            <div className="flex items-center justify-between">
              <label className="text-base sm:text-lg font-medium text-gray-900 w-36 sm:w-44 text-left">
                N° de socio:
              </label>
              <input
                type="text"
                value={formData.nro_socio}
                onChange={(e) => handleChange('nro_socio', e.target.value)}
                placeholder="Número de afiliado..."
                className="flex-1 py-2 px-4 rounded-xl border border-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-left text-base shadow-2xs"
              />
            </div>

            {/* Grupo familiar */}
            <div className="flex items-center justify-between">
              <label className="text-base sm:text-lg font-medium text-gray-900 w-36 sm:w-44 text-left">
                Grupo familiar:
              </label>
              <input
                type="text"
                value={formData.grupo_familiar}
                onChange={(e) => handleChange('grupo_familiar', e.target.value)}
                placeholder="Titular / Carga..."
                className="flex-1 py-2 px-4 rounded-xl border border-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-left text-base shadow-2xs"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
