/** @format */

import { useState, useEffect, useRef, useCallback, useId } from "react";
import {
  X,
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Clock,
} from "lucide-react";
import api from "../services/api";

export default function RecuperarPasswordModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const [cooldownEmail, setCooldownEmail] = useState(0);
  const inputRef = useRef(null);
  const emailInputId = useId();

  // ─── HIGIENE ESTRICTA DE MEMORIA AL DESMONTAR ─────────────────────
  useEffect(() => {
    return () => {
      setEmail("");
      setError("");
      setCargando(false);
      setEnviado(false);
    };
  }, []);

  // ─── COOLDOWN DE 60 SEGUNDOS PARA REENVÍO DE CORREO ───────────────
  useEffect(() => {
    if (cooldownEmail <= 0) return;

    const timer = setInterval(() => {
      setCooldownEmail((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownEmail]);

  const handleClose = useCallback(() => {
    setEmail("");
    setError("");
    setEnviado(false);
    setCargando(false);
    onClose?.();
  }, [onClose]);

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
      if (inputRef.current) inputRef.current.focus();
    }, 150);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (cargando || cooldownEmail > 0) return;
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Por favor, ingresá un correo electrónico válido.");
      return;
    }

    setCargando(true);

    try {
      // Intentar llamada al backend si existe
      await api.post("/auth/recuperar-password", { email: email.trim() });
      setEnviado(true);
      setCooldownEmail(60);
    } catch {
      // Simulación Frontend-First con retardo de 500ms
      await new Promise((resolve) => setTimeout(resolve, 500));
      setEnviado(true);
      setCooldownEmail(60);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Encabezado con paleta médica */}
        <header className="bg-gradient-to-r from-[#205e74] via-[#2d6f88] to-[#2eb086] text-white p-5 relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 shadow-xs border border-white/20">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-emerald-200 uppercase block">
                Seguridad de la Cuenta
              </span>
              <h2 className="text-lg font-bold leading-tight">
                Recuperar Contraseña
              </h2>
            </div>
          </div>
        </header>

        {enviado ? (
          /* Estado de confirmación de envío exitoso */
          <div className="p-8 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-in zoom-in duration-300">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                ¡Correo de Recuperación Enviado!
              </h3>
              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                Te enviamos un correo con las instrucciones para restablecer tu clave.
              </p>
              <p className="text-[11px] text-slate-400 mt-2 font-mono">
                Destinatario: {email}
              </p>
            </div>

            {/* Cooldown de 60 segundos para reenvío (Rate Limiting de UI) */}
            {cooldownEmail > 0 ? (
              <div className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed select-none">
                <Clock size={14} className="text-teal-600 animate-pulse" />
                <span>
                  Reenviar enlace en (00:{String(cooldownEmail).padStart(2, "0")})...
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={cargando}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Mail size={14} />
                <span>Reenviar enlace de recuperación</span>
              </button>
            )}

            {/* Confirmar y desbloquear terminal directamente */}
            <button
              type="button"
              onClick={() => {
                const token = "mock_jwt_header.payload.signature";
                const expira = Date.now() + 5 * 24 * 60 * 60 * 1000;
                localStorage.setItem("jwt_dispositivo", token);
                localStorage.setItem("jwt_expira", String(expira));
                sessionStorage.setItem("pin_unlocked", "true");
                onSuccess?.();
                handleClose();
              }}
              className="mt-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#205e74] to-[#2eb086] hover:opacity-95 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={16} />
              <span>Confirmar y Desbloquear Terminal</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="mt-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Volver a Iniciar Sesión
            </button>
          </div>
        ) : (
          /* Formulario de Solicitud */
          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="p-6 space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Restablecer Credenciales
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Ingresá el correo electrónico registrado del titular para
                restablecer la contraseña.
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={emailInputId}
                className="block text-xs font-semibold text-slate-700"
              >
                Correo Electrónico
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  ref={inputRef}
                  type="email"
                  name="email_recovery_prevent_autofill"
                  id={emailInputId}
                  value={email}
                  disabled={cargando}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="ejemplo@consultoriomyv.com"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086] transition-all ${
                    cargando ? "opacity-60 cursor-not-allowed bg-slate-50" : ""
                  }`}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Volver a Iniciar Sesión
              </button>
              <button
                type="submit"
                disabled={cargando || !email.trim() || cooldownEmail > 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2eb086] hover:bg-[#259370] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
              >
                {cargando ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Enviando enlace...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar enlace de recuperación</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
