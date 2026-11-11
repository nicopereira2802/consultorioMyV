/** @format */

import { useState, useEffect, useRef, useCallback, useId } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { authService } from "../../../services/api";

export default function RecuperarPasswordModal({ isOpen, onClose, onSuccess }) {
  const [paso, setPaso] = useState(1); // 1: Enviar correo, 2: Ingresar código y nueva contraseña, 3: Éxito
  const [codigo, setCodigo] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [segundosBloqueo, setSegundosBloqueo] = useState(() => {
    const bloqueoHasta = localStorage.getItem("bloqueo_recuperacion_hasta");
    if (bloqueoHasta) {
      const restante = Math.ceil((Number(bloqueoHasta) - Date.now()) / 1000);
      if (restante > 0) return restante;
      localStorage.removeItem("bloqueo_recuperacion_hasta");
      localStorage.removeItem("intentos_recuperacion_email");
    }
    return 0;
  });
  const [error, setError] = useState("");

  const inputCodigoRef = useRef(null);
  const codigoInputId = useId();
  const passwordInputId = useId();
  const confirmPasswordInputId = useId();

  const formatearTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Temporizador de bloqueo sincronizado con localStorage
  useEffect(() => {
    const checkBloqueo = () => {
      const bloqueoHasta = localStorage.getItem("bloqueo_recuperacion_hasta");
      if (!bloqueoHasta) {
        setSegundosBloqueo(0);
        return;
      }
      const restante = Math.ceil((Number(bloqueoHasta) - Date.now()) / 1000);
      if (restante <= 0) {
        localStorage.removeItem("bloqueo_recuperacion_hasta");
        localStorage.removeItem("intentos_recuperacion_email");
        setSegundosBloqueo(0);
      } else {
        setSegundosBloqueo(restante);
      }
    };

    checkBloqueo();
    const interval = setInterval(checkBloqueo, 1000);
    return () => clearInterval(interval);
  }, []);

  // Limpieza estricta de memoria al desmontar
  useEffect(() => {
    return () => {
      setPaso(1);
      setCodigo("");
      setNuevaPassword("");
      setConfirmarPassword("");
      setError("");
      setCargando(false);
    };
  }, []);

  const handleClose = useCallback(() => {
    setPaso(1);
    setCodigo("");
    setNuevaPassword("");
    setConfirmarPassword("");
    setError("");
    setCargando(false);
    onClose?.();
  }, [onClose]);

  // Cierre con Escape y autofoco dinámico
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => {
      if (paso === 2 && inputCodigoRef.current) inputCodigoRef.current.focus();
    }, 150);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, paso, handleClose]);

  if (!isOpen) return null;

  // Paso 1: Enviar solicitud de código
  const handleSolicitarCodigo = async (e) => {
    if (e) e.preventDefault();
    if (cargando || segundosBloqueo > 0) return;

    // Verificar si ya está bloqueado en localStorage
    const bloqueoHasta = localStorage.getItem("bloqueo_recuperacion_hasta");
    if (bloqueoHasta && Number(bloqueoHasta) > Date.now()) {
      const restante = Math.ceil((Number(bloqueoHasta) - Date.now()) / 1000);
      setSegundosBloqueo(restante);
      return;
    }

    setError("");
    setCargando(true);

    try {
      await authService.recuperarPassword();

      // Incrementar contador de intentos exitosos
      const intentosPrevios = Number(localStorage.getItem("intentos_recuperacion_email")) || 0;
      const nuevosIntentos = intentosPrevios + 1;
      localStorage.setItem("intentos_recuperacion_email", String(nuevosIntentos));

      if (nuevosIntentos >= 3) {
        // Al completar el 3.er intento, activar bloqueo de 15 minutos (900 segundos)
        const expiraBloqueo = Date.now() + 15 * 60 * 1000;
        localStorage.setItem("bloqueo_recuperacion_hasta", String(expiraBloqueo));
        setSegundosBloqueo(15 * 60);
      }

      setPaso(2);
      setError("");
    } catch (err) {
      if (err.response?.status === 429) {
        const expiraBloqueo = Date.now() + 15 * 60 * 1000;
        localStorage.setItem("bloqueo_recuperacion_hasta", String(expiraBloqueo));
        setSegundosBloqueo(15 * 60);
      }
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "Error al solicitar recuperación. Intentá nuevamente.";
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  // Paso 2: Restablecer contrase├▒a con c├│digo de 6 d├¡gitos
  const handleRestablecerPassword = async (e) => {
    if (e) e.preventDefault();
    if (cargando) return;
    setError("");

    if (codigo.length !== 6) {
      setError("El c├│digo debe tener exactamente 6 d├¡gitos num├®ricos.");
      return;
    }

    if (nuevaPassword.length < 8) {
      setError("La nueva contrase├▒a debe tener al menos 8 caracteres.");
      return;
    }

    if (
      !/[A-Z]/.test(nuevaPassword) ||
      !/[a-z]/.test(nuevaPassword) ||
      !/[0-9]/.test(nuevaPassword) ||
      !/[^A-Za-z0-9]/.test(nuevaPassword)
    ) {
      setError(
        "La contrase├▒a debe contener al menos una may├║scula, una min├║scula, un n├║mero y un car├ícter especial."
      );
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError("Las contrase├▒as no coinciden.");
      return;
    }

    setCargando(true);

    try {
      const res = await authService.restablecerPassword(codigo, nuevaPassword);

      // Capa 3: Reset de sesi├│n residual
      localStorage.removeItem("token");
      localStorage.removeItem("jwt_dispositivo");
      localStorage.removeItem("jwt_expira");
      sessionStorage.removeItem("pin_unlocked");
      sessionStorage.removeItem("pin_attempts");
      sessionStorage.removeItem("pin_lockout_until");
      sessionStorage.removeItem("pin_permanent_lockout");

      const msgExito =
        res?.mensaje ||
        "Contrase├▒a actualizada exitosamente. Inicie sesi├│n con sus nuevas credenciales.";

      if (onSuccess) {
        onSuccess(msgExito);
        handleClose();
      } else {
        setPaso(3);
        setError("");
      }
    } catch (err) {
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "C├│digo inv├ílido o expirado. Verific├í los 6 d├¡gitos.";
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overscroll-none touch-none select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Encabezado */}
        <header className="p-6 pb-4 relative border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#1e6f85] shrink-0">
              {paso === 2 ? <KeyRound size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {paso === 2 ? "Código de Verificación" : "Recuperar Contraseña"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {paso === 2
                  ? "Ingresá el PIN de 6 dígitos recibido por correo"
                  : "Presiona el botón a continuación para enviar las instrucciones y el enlace de recuperación directamente al correo registrado del profesional."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </header>

        {paso === 3 ? (
          /* Estado Éxito: Contraseña restablecida */
          <div className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center animate-in zoom-in duration-200">
              <CheckCircle2 size={30} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                ¡Contraseña Restablecida!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
                Tu clave de acceso ha sido actualizada con éxito. Ya podés iniciar sesión con tus nuevas credenciales.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onSuccess?.(
                  "Contraseña actualizada exitosamente. Inicie sesión con sus nuevas credenciales."
                );
                handleClose();
              }}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#1e6f85] hover:bg-[#18586a] active:scale-98 transition-all shadow-sm cursor-pointer"
            >
              Volver al inicio de sesión
            </button>
          </div>
        ) : paso === 2 ? (
          /* Paso 2: Ingresar PIN de 6 dígitos y nueva contraseña */
          <form onSubmit={handleRestablecerPassword} autoComplete="off" className="p-6 space-y-4">
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 text-teal-800 text-xs font-medium leading-relaxed">
              Enviamos un código de 6 dígitos al correo registrado del profesional. Válido durante 15 minutos.
            </div>

            {/* C├│digo de 6 d├¡gitos */}
            <div className="space-y-1.5">
              <label
                htmlFor={codigoInputId}
                className="block text-xs font-semibold text-slate-700 text-center"
              >
                C├│digo de 6 D├¡gitos
              </label>
              <div className="relative">
                <input
                  ref={inputCodigoRef}
                  id={codigoInputId}
                  name="codigo_recuperacion"
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={codigo}
                  disabled={cargando}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCodigo(clean);
                    setError("");
                  }}
                  placeholder="000000"
                  className="w-full text-center font-mono text-2xl tracking-[0.25em] font-bold py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-[#0f766e] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Nueva Contrase├▒a */}
            <div className="space-y-1.5">
              <label
                htmlFor={passwordInputId}
                className="block text-xs font-semibold text-slate-700"
              >
                Nueva Contrase├▒a
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  id={passwordInputId}
                  type={showPassword ? "text" : "password"}
                  value={nuevaPassword}
                  disabled={cargando}
                  onChange={(e) => {
                    setNuevaPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="M├¡nimo 8 caracteres"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirmar Nueva Contrase├▒a */}
            <div className="space-y-1.5">
              <label
                htmlFor={confirmPasswordInputId}
                className="block text-xs font-semibold text-slate-700"
              >
                Confirmar Nueva Contrase├▒a
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  id={confirmPasswordInputId}
                  type={showPassword ? "text" : "password"}
                  value={confirmarPassword}
                  disabled={cargando}
                  onChange={(e) => {
                    setConfirmarPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Repet├¡ la contrase├▒a"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={cargando || codigo.length !== 6 || !nuevaPassword || !confirmarPassword}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#1e6f85] hover:bg-[#18586a] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              {cargando ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Restableciendo...</span>
                </>
              ) : (
                <span>Restablecer contraseña</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setPaso(1);
                setCodigo("");
                setNuevaPassword("");
                setConfirmarPassword("");
                setError("");
              }}
              disabled={cargando}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer transition-colors pt-1"
            >
              ← Volver o reenviar correo
            </button>
          </form>
        ) : (
          /* Paso 1: Enviar instrucciones al correo registrado */
          <form onSubmit={handleSolicitarCodigo} autoComplete="off" className="p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={cargando || segundosBloqueo > 0}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#1e6f85] hover:bg-[#18586a] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              {cargando ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Enviando...</span>
                </>
              ) : segundosBloqueo > 0 ? (
                <span>Reintentar en {formatearTiempo(segundosBloqueo)}</span>
              ) : (
                <span>Enviar instrucciones</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleClose}
              disabled={cargando}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer transition-colors pt-1"
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
