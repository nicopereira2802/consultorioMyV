/** @format */

import { useState } from "react";
import { User, Lock, Eye, EyeOff, X, KeyRound, Check } from "lucide-react";
import api from "../../../services/api";

export default function RecuperarPinModal({
  isOpen,
  onClose,
  onSuccess,
  usuarioActual,
  usuarioPredefinido,
}) {
  const [paso, setPaso] = useState(1); // 1: Validar Contraseña, 2: Nuevo PIN
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // Estados para el paso 2
  const [nuevoPin, setNuevoPin] = useState("");
  const [confirmarPin, setConfirmarPin] = useState("");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const usuario =
    usuarioActual ||
    usuarioPredefinido ||
    localStorage.getItem("usuario_guardado") ||
    localStorage.getItem("usuario") ||
    sessionStorage.getItem("usuario") ||
    "Odontologo";

  if (!isOpen) return null;

  const handleCerrar = () => {
    setPaso(1);
    setPassword("");
    setNuevoPin("");
    setConfirmarPin("");
    setError("");
    setExito(false);
    onClose?.();
  };

  // Paso 1: Validar Contraseña Maestra
  const handleVerificarPassword = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await api.post("/auth/verificar-password", {
        nombre_usuario: usuario,
        usuario: usuario,
        password: password,
        contraseña: password,
      });
      setPaso(2);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Contraseña incorrecta.");
    } finally {
      setCargando(false);
    }
  };

  // Paso 2: Guardar Nuevo PIN
  const handleGuardarPin = async (e) => {
    e.preventDefault();
    setError("");

    if (nuevoPin.length !== 4 || !/^\d{4}$/.test(nuevoPin)) {
      setError("El PIN debe contener exactamente 4 dígitos numéricos.");
      return;
    }
    if (nuevoPin !== confirmarPin) {
      setError("Los códigos PIN no coinciden.");
      return;
    }

    setCargando(true);
    try {
      await api.post("/auth/recuperar-pin", {
        nombre_usuario: usuario,
        usuario: usuario,
        password: password,
        contraseña: password,
        nuevoPin: nuevoPin,
        nuevo_pin: nuevoPin,
      });

      localStorage.setItem("terminal_pin", nuevoPin);
      sessionStorage.removeItem("pin_attempts");
      sessionStorage.removeItem("pin_lockout_until");
      sessionStorage.removeItem("pin_permanent_lockout");

      setExito(true);
      setTimeout(() => {
        onSuccess?.(nuevoPin);
        handleCerrar();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al actualizar el PIN.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl border border-gray-100">
        {/* Botón Cerrar (X) */}
        <button
          type="button"
          onClick={handleCerrar}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado Limpio */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {paso === 1 ? "Cambiar PIN" : "Nuevo PIN"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {paso === 1
              ? "Ingresá tu contraseña de cuenta para continuar"
              : "Definí tu nuevo código de 4 dígitos para desbloqueo rápido"}
          </p>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Notificación de Éxito */}
        {exito && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            ¡PIN actualizado con éxito!
          </div>
        )}

        {/* PASO 1: VALIDACIÓN DE CONTRASEÑA */}
        {paso === 1 && (
          <form onSubmit={handleVerificarPassword} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-700">Usuario</label>
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Equipo Registrado
                </span>
              </div>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={usuario}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium cursor-not-allowed select-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Contraseña de Cuenta
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type={mostrarPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresá tu contraseña de cuenta"
                  required
                  autoFocus
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5c8b8e] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando || !password}
              className="w-full mt-2 py-3 rounded-xl bg-[#5c8b8e] hover:bg-[#4d7578] text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {cargando ? "Verificando..." : "Continuar"}
            </button>
          </form>
        )}

        {/* PASO 2: INGRESO DE NUEVO PIN */}
        {paso === 2 && !exito && (
          <form onSubmit={handleGuardarPin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Nuevo PIN (4 dígitos)
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={nuevoPin}
                  onChange={(e) => setNuevoPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 tracking-widest text-center text-lg bg-white border border-gray-200 rounded-xl font-bold text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5c8b8e] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Confirmar Nuevo PIN
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmarPin}
                  onChange={(e) => setConfirmarPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 tracking-widest text-center text-lg bg-white border border-gray-200 rounded-xl font-bold text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5c8b8e] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando || nuevoPin.length !== 4 || confirmarPin.length !== 4}
              className="w-full mt-2 py-3 rounded-xl bg-[#5c8b8e] hover:bg-[#4d7578] text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {cargando ? "Guardando..." : "Guardar nuevo PIN"}
            </button>
          </form>
        )}

        {/* Botón Cancelar común */}
        <button
          type="button"
          onClick={handleCerrar}
          className="w-full text-center text-xs text-gray-500 hover:text-gray-700 pt-3 transition-colors block cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
