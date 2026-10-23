/** @format */

import { useState, useEffect, useContext } from "react";
import "./PinLogin.css";
import logoImg from "../assets/logo.png";
import RecuperarPasswordModal from "./RecuperarPasswordModal";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import authService from "../services/auth.service";
import { PinLockContext } from "../context/PinLockContext";

export default function LoginMaestro({ onLoginSuccess }) {
  const pinLock = useContext(PinLockContext);
  const usuarioGuardado = localStorage.getItem("usuario_guardado") || "";
  const esDispositivoReconocido = Boolean(usuarioGuardado);

  const [usuario, setUsuario] = useState(usuarioGuardado);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [mostrarModalRecuperar, setMostrarModalRecuperar] = useState(false);

  // ─── HIGIENE ESTRICTA DE MEMORIA AL DESMONTAR ─────────────────────
  useEffect(() => {
    return () => {
      setPassword("");
      setError("");
      setMensajeExito("");
      setCargando(false);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cargando) return; // Bloqueo de doble clic
    setError("");
    setMensajeExito("");

    if (!usuario.trim()) {
      setError("Por favor, ingresá tu nombre de usuario.");
      return;
    }

    if (!password.trim()) {
      setError("Por favor, ingresá la contraseña de tu cuenta.");
      return;
    }

    setCargando(true);

    try {
      const data = await authService.loginMaestro(usuario.trim(), password);

      const token = data?.token;
      const expira = Date.now() + 5 * 24 * 60 * 60 * 1000;

      localStorage.setItem("usuario_guardado", usuario.trim());
      localStorage.setItem("jwt_dispositivo", token);
      localStorage.setItem("token", token);
      localStorage.setItem("jwt_expira", String(expira));

      // Reinicio obligatorio de penalizaciones de PIN al validar con clave maestra
      localStorage.removeItem("pin_bloqueado_hasta");
      localStorage.removeItem("pin_intentos_fallidos");
      sessionStorage.removeItem("pin_attempts");
      sessionStorage.removeItem("pin_lockout_until");
      sessionStorage.removeItem("pin_permanent_lockout");
      localStorage.removeItem("pin_intentos");
      localStorage.removeItem("pin_attempts");

      if (pinLock) {
        pinLock.resetearPenalizaciones?.();
        pinLock.setIntentosFallidos?.(0);
        pinLock.setBloqueado?.(false);
        pinLock.setError?.("");
      }

      setPassword(""); // Purga de memoria
      onLoginSuccess?.(token, expira);
    } catch (err) {
      const errorMsg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Credenciales inválidas. Verificá tu usuario y contraseña de cuenta.";
      setError(errorMsg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full overflow-hidden overscroll-none touch-none select-none flex items-center justify-center bg-slate-50 p-4 box-border auth-locked-scroll">
      <main className="w-full max-w-[380px] bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-8 text-center text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera institucional */}
        <header className="flex flex-col items-center">
          <div className="w-20 h-20 mb-3 inline-flex items-center justify-center">
            <img
              src={logoImg}
              alt="M&V Odontologia"
              className="w-full h-full object-contain block mix-blend-multiply"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 m-0">
            M&V Odontologia
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Gestión de Turnos y Clínica
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-[11px] font-semibold">
            <ShieldCheck size={14} className="text-teal-600" />
            <span>
              {esDispositivoReconocido
                ? "Sesión Vencida (5 Días)"
                : "Nuevo Dispositivo"}
            </span>
          </div>
        </header>

        <p className="text-xs text-slate-500 mt-5 mb-5 leading-relaxed">
          {esDispositivoReconocido
            ? "Tu sesión de 5 días expiró en este equipo. Ingresá tu contraseña maestra para renovar el acceso."
            : "Ingresá tus credenciales de usuario y contraseña para vincular este equipo por los próximos 5 días."}
        </p>

        {/* Notificación de Éxito tras Restablecimiento */}
        {mensajeExito && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium text-left animate-in fade-in">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Formulario Maestro */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Campo Usuario: Dinámico (Editable la 1° vez, Fijo tras vencimiento) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Usuario
              </label>
              {esDispositivoReconocido && (
                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-semibold border border-teal-200/60">
                  Equipo Registrado
                </span>
              )}
            </div>

            {esDispositivoReconocido ? (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-default select-none pointer-events-none">
                <span className="text-slate-400 shrink-0">
                  <User size={16} />
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {usuarioGuardado}
                </span>
              </div>
            ) : (
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => {
                    setUsuario(e.target.value);
                    setError("");
                    setMensajeExito("");
                  }}
                  disabled={cargando}
                  placeholder="Ingresá tu nombre de usuario"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all ${
                    cargando ? "opacity-60 cursor-not-allowed bg-slate-50" : ""
                  }`}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Campo Contraseña Maestra */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Contraseña 
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                disabled={cargando}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                  setMensajeExito("");
                }}
                placeholder="Ingresá tu contraseña"
                autoComplete="current-password"
                className={`w-full pl-10 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all ${
                  cargando ? "opacity-60 cursor-not-allowed bg-slate-50" : ""
                }`}
                autoFocus={esDispositivoReconocido}
              />
              <button
                type="button"
                disabled={cargando}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={cargando || !password.trim() || !usuario.trim()}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#205e74] to-[#2eb086] hover:opacity-95 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-teal-700/10 cursor-pointer"
          >
            {cargando ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-white" />
                <span>Validando credenciales...</span>
              </div>
            ) : (
              <>
                <span>
                  {esDispositivoReconocido
                    ? "Renovar Acceso y Continuar"
                    : "Vincular Dispositivo y Continuar"}
                </span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Enlace de Recuperación de Contraseña */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setMostrarModalRecuperar(true)}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors underline underline-offset-2 cursor-pointer"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </main>

      {/* Modal de Recuperación de Contraseña */}
      {mostrarModalRecuperar && (
        <RecuperarPasswordModal
          isOpen={mostrarModalRecuperar}
          onClose={() => {
            setMensajeExito("");
            setError("");
            setMostrarModalRecuperar(false);
          }}
          onSuccess={(msg) => {
            setMensajeExito(msg);
            setError("");
            setMostrarModalRecuperar(false);
          }}
        />
      )}
    </div>
  );
}

