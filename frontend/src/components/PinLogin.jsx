/** @format */

import { useState, useRef, useEffect, useId, useContext } from "react";
import "./PinLogin.css";
import logoImg from "../assets/logo.png";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Clock,
  ShieldAlert,
  ScanFace,
  CheckCircle2,
  Mail,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import authService from "../services/auth.service";
import { PinLockContext } from "../context/PinLockContext";

export default function PinLogin({
  onUnlock,
  onDeviceLinked,
  isDeviceLinked = false,
}) {
  const pinLockCtx = useContext(PinLockContext);

  // ─── CONTROL DE VISTA ACTIVA (maestro | pin | recuperar_password) ─
  const [vista, setVista] = useState(() => (isDeviceLinked ? "pin" : "maestro"));
  const tieneTokenActivo =
    isDeviceLinked || Boolean(localStorage.getItem("jwt_dispositivo"));

  // ─── ESTADOS VISTA A: CAPA MAESTRA ────────────────────────────────
  const usuarioGuardado = localStorage.getItem("usuario_guardado") || "";
  const esDispositivoReconocido = Boolean(usuarioGuardado);

  const [usuario, setUsuario] = useState(usuarioGuardado);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cargandoMaestro, setCargandoMaestro] = useState(false);
  const [errorMaestro, setErrorMaestro] = useState("");
  const [alertaSeguridadMaestro, setAlertaSeguridadMaestro] = useState("");
  const [mensajeExitoMaestro, setMensajeExitoMaestro] = useState("");

  // ─── ESTADOS VISTA B: CAPA DIARIA (PIN Y COOLDOWN) ────────────────
  const [pin, setPin] = useState("");
  const [errorPin, setErrorPin] = useState("");
  const [mensajeExitoPin, setMensajeExitoPin] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [isValidatingPin, setIsValidatingPin] = useState(false);

  // ─── ESTADOS PERSISTENTES DE BLOQUEO DE PIN (LOCALSTORAGE) ────────
  const obtenerTiempoBloqueoRestante = () => {
    const tiempoBloqueo = localStorage.getItem("pin_bloqueado_hasta");
    if (!tiempoBloqueo) return 0;
    const tiempoNum = Number(tiempoBloqueo);
    if (isNaN(tiempoNum) || Date.now() >= tiempoNum) {
      // Expirado o eliminado: purga obligatoria
      localStorage.removeItem("pin_bloqueado_hasta");
      localStorage.removeItem("pin_intentos_fallidos");
      return 0;
    }
    return Math.ceil((tiempoNum - Date.now()) / 1000);
  };

  const [segundosBloqueo, setSegundosBloqueo] = useState(() =>
    obtenerTiempoBloqueoRestante()
  );
  const [bloqueado, setBloqueado] = useState(
    () => obtenerTiempoBloqueoRestante() > 0
  );
  const [intentosFallidos, setIntentosFallidos] = useState(() => {
    if (obtenerTiempoBloqueoRestante() > 0) return 3;
    const guardados = Number(localStorage.getItem("pin_intentos_fallidos")) || 0;
    return guardados < 3 ? guardados : 0;
  });

  const pinInputRef = useRef(null);

  // ─── ESTADOS FACE ID / BIOMETRÍA (ACTIVACIÓN EXCLUSIVA POR CLIC) ──
  const [isScanningFaceId, setIsScanningFaceId] = useState(false);
  const [faceIdSuccess, setFaceIdSuccess] = useState(false);
  const [isMobileView, setIsMobileView] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── TEMPORIZADOR DE BLOQUEO DE 15 MINUTOS (PERSISTENTE EN LOCALSTORAGE) ─
  useEffect(() => {
    if (!bloqueado) return;

    const interval = setInterval(() => {
      const restante = obtenerTiempoBloqueoRestante();
      if (restante <= 0) {
        clearInterval(interval);
        setBloqueado(false);
        setSegundosBloqueo(0);
        setIntentosFallidos(0);
        setErrorPin("");
      } else {
        setSegundosBloqueo(restante);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bloqueado]);

  const formatearTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ─── ESTADOS VISTA C: RECUPERACIÓN POR CORREO ─────────────────────
  const [email, setEmail] = useState("");
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [cargandoEmail, setCargandoEmail] = useState(false);
  const [errorEmail, setErrorEmail] = useState("");
  const [cooldownEmail, setCooldownEmail] = useState(0);
  const emailInputId = useId();

  // Estados para ingresar el PIN de 6 dígitos y la nueva contraseña
  const [codigoRecuperacion, setCodigoRecuperacion] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [showNuevaPassword, setShowNuevaPassword] = useState(false);
  const [passwordRestablecida, setPasswordRestablecida] = useState(false);
  const [cargandoRestablecer, setCargandoRestablecer] = useState(false);
  const [errorRestablecer, setErrorRestablecer] = useState("");

  // ─── HIGIENE ESTRICTA DE MEMORIA AL DESMONTAR LA PANTALLA ─────────
  useEffect(() => {
    return () => {
      // Purga completa de memoria de campos confidenciales
      setPassword("");
      setPin("");
      setEmail("");
      setErrorMaestro("");
      setErrorPin("");
      setErrorEmail("");
      setCodigoRecuperacion("");
      setNuevaPassword("");
      setConfirmarPassword("");
      setErrorRestablecer("");
      setMensajeExitoMaestro("");
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

  // ─── AUTO-FOCO AL ENTRAR O VOLVER A VISTA PIN ─────────────────────
  useEffect(() => {
    if (vista === "pin" && !bloqueado) {
      const timer = setTimeout(() => {
        if (pinInputRef.current) pinInputRef.current.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [vista, bloqueado]);

  // ─── TRANSICIONES DE VISTA CON HIGIENE DE MEMORIA INMEDIATA ───────
  const handleVolverAPin = () => {
    setErrorMaestro("");
    setMensajeExitoMaestro("");
    setPassword(""); // Purga inmediata de contraseña
    setPin("");
    setErrorPin("");
    setVista("pin");
  };

  const handleIrAContraseña = (alerta = "") => {
    setPin(""); // Purga inmediata de PIN
    setErrorPin("");
    setPassword("");
    setErrorMaestro("");
    setMensajeExitoMaestro("");
    if (alerta) setAlertaSeguridadMaestro(alerta);
    setVista("maestro");
  };

  const handleIrARecuperarEmail = () => {
    setPassword(""); // Purga inmediata de contraseña
    setErrorMaestro("");
    setMensajeExitoMaestro("");
    setEmail("");
    setErrorEmail("");
    setEmailEnviado(false);
    setCodigoRecuperacion("");
    setNuevaPassword("");
    setConfirmarPassword("");
    setPasswordRestablecida(false);
    setErrorRestablecer("");
    setVista("recuperar_password");
  };

  const handleVolverAIniciarSesion = () => {
    setEmail(""); // Purga inmediata de correo
    setErrorEmail("");
    setEmailEnviado(false);
    setCodigoRecuperacion("");
    setNuevaPassword("");
    setConfirmarPassword("");
    setPasswordRestablecida(false);
    setErrorRestablecer("");
    setPassword("");
    setErrorMaestro("");
    setMensajeExitoMaestro(""); // Reseteo explícito para evitar mensaje de éxito falso al volver o cancelar
    setVista("maestro");
  };

  const handleRestablecerPasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    if (cargandoRestablecer) return;
    setErrorRestablecer("");

    if (codigoRecuperacion.length !== 6) {
      setErrorRestablecer("El código debe tener exactamente 6 dígitos numéricos.");
      return;
    }

    if (nuevaPassword.length < 8) {
      setErrorRestablecer("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (
      !/[A-Z]/.test(nuevaPassword) ||
      !/[a-z]/.test(nuevaPassword) ||
      !/[0-9]/.test(nuevaPassword) ||
      !/[^A-Za-z0-9]/.test(nuevaPassword)
    ) {
      setErrorRestablecer(
        "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial."
      );
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setErrorRestablecer("Las contraseñas no coinciden.");
      return;
    }

    setCargandoRestablecer(true);

    try {
      const res = await authService.restablecerPassword(codigoRecuperacion, nuevaPassword);

      // Capa 3: Reset de sesión residual
      localStorage.removeItem("token");
      localStorage.removeItem("jwt_dispositivo");
      localStorage.removeItem("jwt_expira");
      sessionStorage.removeItem("pin_unlocked");
      sessionStorage.removeItem("pin_attempts");
      sessionStorage.removeItem("pin_lockout_until");
      sessionStorage.removeItem("pin_permanent_lockout");

      // Reset de penalizaciones y bloqueo de PIN si existían
      localStorage.removeItem("pin_bloqueado_hasta");
      localStorage.removeItem("pin_intentos_fallidos");
      setIntentosFallidos(0);
      setBloqueado(false);
      setSegundosBloqueo(0);
      if (pinLockCtx) {
        pinLockCtx.resetearPenalizaciones?.();
      }
      setErrorPin("");
      setPin("");
      setAlertaSeguridadMaestro("");

      // Purga de campos de recuperación
      setEmail("");
      setErrorEmail("");
      setEmailEnviado(false);
      setCodigoRecuperacion("");
      setNuevaPassword("");
      setConfirmarPassword("");
      setPasswordRestablecida(false);
      setErrorRestablecer("");
      setPassword("");
      setErrorMaestro("");

      // Situar la vista directamente en el Login Maestro con mensaje de éxito
      setMensajeExitoMaestro(
        res?.mensaje || "Contraseña actualizada exitosamente. Inicie sesión con sus nuevas credenciales."
      );
      setVista("maestro");
    } catch (err) {
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "Código inválido o expirado. Verificá los 6 dígitos.";
      setErrorRestablecer(msg);
    } finally {
      setCargandoRestablecer(false);
    }
  };


  // ─── ACCIONES VISTA A: LOGIN MAESTRO (PREVENCIÓN DOBLE CLIC) ──────
  const handleLoginMaestro = async (e) => {
    e.preventDefault();
    if (cargandoMaestro) return; // Bloqueo de doble clic

    setErrorMaestro("");
    setMensajeExitoMaestro("");

    if (!usuario.trim()) {
      setErrorMaestro("Por favor, ingresá tu nombre de usuario.");
      return;
    }

    if (!password.trim()) {
      setErrorMaestro("Por favor, ingresá tu contraseña de cuenta.");
      return;
    }

    setCargandoMaestro(true);

    try {
      const data = await authService.loginMaestro(usuario.trim(), password);

      const token = data?.token;
      const expira = Date.now() + 5 * 24 * 60 * 60 * 1000; // 5 días de vigencia

      localStorage.setItem("usuario_guardado", usuario.trim());
      localStorage.setItem("jwt_dispositivo", token);
      localStorage.setItem("token", token);
      localStorage.setItem("jwt_expira", String(expira));

      // Único mecanismo de desbloqueo legítimo: purga de penalizaciones
      localStorage.removeItem("pin_bloqueado_hasta");
      localStorage.removeItem("pin_intentos_fallidos");
      localStorage.removeItem("pin_intentos");
      localStorage.removeItem("pin_attempts");
      sessionStorage.removeItem("pin_attempts");
      sessionStorage.removeItem("pin_lockout_until");
      sessionStorage.removeItem("pin_permanent_lockout");
      setIntentosFallidos(0);
      setBloqueado(false);
      setSegundosBloqueo(0);
      if (pinLockCtx) {
        pinLockCtx.resetearPenalizaciones?.();
      }
      setErrorPin("");
      setAlertaSeguridadMaestro("");

      if (pinLockCtx) {
        pinLockCtx.resetearPenalizaciones?.();
        pinLockCtx.setIntentosFallidos?.(0);
        pinLockCtx.setBloqueado?.(false);
        pinLockCtx.setError?.("");
      }

      // Purga de contraseña de memoria
      setPassword("");
      onDeviceLinked?.(token, expira);

      // Desbloqueo y autenticación directa sin retornar al PIN
      if (onUnlock) onUnlock();
    } catch (err) {
      const errorMsg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Credenciales inválidas. Verificá tu usuario y contraseña de cuenta.";
      setErrorMaestro(errorMsg);
    } finally {
      setCargandoMaestro(false);
    }
  };

  // ─── ACCIONES VISTA B: VALIDACIÓN DE PIN (BACKEND ENDPOINT REAL) ──
  const validarPin = async (enteredPin) => {
    if (bloqueado || isValidatingPin) return;

    setIsValidatingPin(true);
    setErrorPin("");
    setMensajeExitoPin("");

    try {
      await authService.validarPin(enteredPin);

      // Éxito (HTTP 200): PIN validado en backend
      localStorage.removeItem("pin_bloqueado_hasta");
      localStorage.removeItem("pin_intentos_fallidos");
      localStorage.removeItem("pin_intentos");
      localStorage.removeItem("pin_attempts");
      sessionStorage.removeItem("pin_attempts");
      sessionStorage.removeItem("pin_lockout_until");
      sessionStorage.removeItem("pin_permanent_lockout");
      setIntentosFallidos(0);
      setBloqueado(false);
      setSegundosBloqueo(0);
      if (pinLockCtx) {
        pinLockCtx.resetearPenalizaciones?.();
      }
      setPin(""); // Purga inmediata
      setIsValidatingPin(false);

      if (pinLockCtx) {
        pinLockCtx.resetearPenalizaciones?.();
      }

      if (onUnlock) onUnlock();
    } catch (err) {
      const status = err.response?.status;
      setIsShaking(true);
      setPin("");
      setIsValidatingPin(false);
      setTimeout(() => setIsShaking(false), 400);

      // ─── RESPUESTA 429 DEL BACKEND (RATE LIMITER) ─────────────────
      if (status === 429) {
        const hasta = Date.now() + 15 * 60 * 1000;
        localStorage.setItem("pin_bloqueado_hasta", String(hasta));
        localStorage.setItem("pin_intentos_fallidos", "3");
        setBloqueado(true);
        setSegundosBloqueo(15 * 60);
        setIntentosFallidos(3);
        setErrorPin(
          "Has superado los 3 intentos permitidos. El acceso por PIN ha sido bloqueado por 15 minutos."
        );
        return;
      }

      // ─── ERROR 400 / 401: PIN INCORRECTO (REGLA DE 3 INTENTOS) ───
      const nuevosFallos = intentosFallidos + 1;
      setIntentosFallidos(nuevosFallos);
      localStorage.setItem("pin_intentos_fallidos", String(nuevosFallos));
      setMensajeExitoPin("");

      if (nuevosFallos >= 3) {
        // Bloqueo total de 15 minutos tras 3 intentos fallidos
        const hasta = Date.now() + 15 * 60 * 1000;
        localStorage.setItem("pin_bloqueado_hasta", String(hasta));
        setBloqueado(true);
        setSegundosBloqueo(15 * 60);
        setErrorPin(
          "Has superado los 3 intentos permitidos. El acceso por PIN ha sido bloqueado por 15 minutos."
        );
      } else {
        const restantes = 3 - nuevosFallos;
        const textoError =
          restantes === 1
            ? "PIN incorrecto. Te queda 1 intento."
            : `PIN incorrecto. Te quedan ${restantes} intentos.`;

        setErrorPin(textoError);
        setTimeout(() => {
          if (pinInputRef.current && !bloqueado) {
            pinInputRef.current.focus();
          }
        }, 400);
      }
    }
  };

  const handlePinChange = (e) => {
    if (bloqueado || isValidatingPin) return;
    setErrorPin(""); // Limpieza de estado previa al ingresar un dígito
    setMensajeExitoPin("");
    const cleanValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    setPin(cleanValue);
    if (cleanValue.length === 4) {
      validarPin(cleanValue);
    }
  };

  const handleFaceIdLogin = async () => {
    // Si la pantalla es de escritorio, abortar inmediatamente sin tocar WebAuthn
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      console.warn("[Face ID] Deshabilitado en entorno de escritorio");
      return;
    }

    if (
      bloqueado ||
      isScanningFaceId ||
      isValidatingPin
    ) {
      return;
    }

    setIsScanningFaceId(true);
    setErrorPin("");
    setMensajeExitoPin("");

    try {
      if (
        !window.PublicKeyCredential ||
        !window.isSecureContext ||
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !==
          "function"
      ) {
        throw new Error("Biometría no disponible en este dispositivo o navegador");
      }

      const hasAuthenticator =
        await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!hasAuthenticator) {
        throw new Error("Autenticador de plataforma no disponible");
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 10000,
          userVerification: "preferred",
        },
      });

      if (!credential) {
        throw new Error("No se obtuvo credencial biométrica válida");
      }

      // Autenticación biométrica legítima completada con éxito
      setFaceIdSuccess(true);
      localStorage.removeItem("pin_bloqueado_hasta");
      localStorage.removeItem("pin_intentos_fallidos");
      localStorage.removeItem("pin_intentos");
      localStorage.removeItem("pin_attempts");
      sessionStorage.removeItem("pin_attempts");
      sessionStorage.removeItem("pin_lockout_until");
      sessionStorage.removeItem("pin_permanent_lockout");
      setIntentosFallidos(0);
      setBloqueado(false);
      setSegundosBloqueo(0);
      if (pinLockCtx) {
        pinLockCtx.resetearPenalizaciones?.();
      }

      setTimeout(() => {
        setIsScanningFaceId(false);
        setFaceIdSuccess(false);
        if (onUnlock) onUnlock();
      }, 400);
    } catch (err) {
      // Manejo estricto de errores: cancelación voluntaria, abort o rechazo
      console.warn(
        "[Biometría] Autenticación cancelada o rechazada:",
        err?.name || err?.message
      );
      setIsScanningFaceId(false);
      setFaceIdSuccess(false);
      // NUNCA desbloquear, no emitir tokens y permitir ingreso manual de PIN
      setTimeout(() => {
        if (pinInputRef.current) pinInputRef.current.focus();
      }, 100);
    }
  };

  // ─── ACCIONES VISTA C: RECUPERAR CONTRASEÑA POR EMAIL ─────────────
  const handleRecuperarPassword = async (e) => {
    if (e) e.preventDefault();
    if (cargandoEmail || cooldownEmail > 0) return; // Bloqueo doble clic y rate limiting

    setErrorEmail("");

    if (!email.trim() || !email.includes("@")) {
      setErrorEmail("Por favor, ingresá un correo electrónico válido.");
      return;
    }

    setCargandoEmail(true);

    try {
      await authService.recuperarPassword(email.trim());
      setEmailEnviado(true);
      setCooldownEmail(60);
    } catch (err) {
      const errorMsg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "Error al solicitar recuperación de contraseña. Intentá nuevamente.";
      setErrorEmail(errorMsg);
    } finally {
      setCargandoEmail(false);
    }
  };

  return (
    <div className="w-full h-[100dvh] overflow-hidden overscroll-none touch-none select-none flex flex-col lg:flex-row bg-white font-sans relative auth-locked-scroll">
      {/* ══════════════════════════════════════════════════════════════
          RESPLANDORES DIFUMINADOS CONTINUOS (AMBIENT GLOW REAL)
          Efecto etéreo sin cortes rectangulares ni divisiones duras
      ══════════════════════════════════════════════════════════════ */}
      {/* Resplandor Esquina Superior Derecha */}
      <div className="absolute top-[-80px] right-[-80px] lg:top-[-100px] lg:right-[-60px] w-80 sm:w-96 lg:w-[480px] h-80 sm:h-96 lg:h-[480px] rounded-full bg-gradient-to-br from-teal-400/20 via-sky-400/15 to-transparent blur-3xl pointer-events-none" />

      {/* Resplandor Lateral Izquierdo Central */}
      <div className="absolute top-10 left-[-60px] sm:left-[-80px] lg:top-1/4 lg:left-[-100px] w-72 sm:w-80 lg:w-[440px] h-72 sm:h-80 lg:h-[440px] rounded-full bg-teal-200/15 blur-3xl pointer-events-none" />

      {/* Resplandor Esquina Inferior Izquierda (Equiparado exactamente con el Superior Derecho) */}
      <div className="absolute bottom-[-80px] left-[-80px] lg:bottom-[-100px] lg:left-[-60px] w-80 sm:w-96 lg:w-[480px] h-80 sm:h-96 lg:h-[480px] rounded-full bg-gradient-to-tr from-teal-400/20 via-sky-400/15 to-transparent blur-3xl pointer-events-none" />

      {/* ══════════════════════════════════════════════════════════════
          LATERAL IZQUIERDO (DESKTOP)
      ══════════════════════════════════════════════════════════════ */}
      <section className="hidden lg:flex lg:w-1/2 lg:h-full flex-col justify-between p-12 lg:p-14 xl:p-16 relative z-10 select-none">
        <div />

        {/* Bloque Central de Marca Desktop */}
        <div className="flex flex-col items-center justify-center my-auto">
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 lg:w-32 lg:h-32 shrink-0">
              <img
                src={logoImg}
                alt="Logo M&V Dental"
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>

            <div className="flex flex-col justify-center">
              <h1 className="text-4xl lg:text-[44px] font-bold text-slate-900 tracking-tight leading-none m-0">
                M&V Odontologia
              </h1>
              <p className="text-lg lg:text-xl font-medium text-slate-600 mt-2 tracking-tight">
                Gestión de Turnos
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-500 font-normal tracking-wide mt-6 text-center">
            Sistema Odontológico Integral
          </p>
        </div>

        <footer className="text-center text-xs text-slate-400 font-normal">
          Desarrollado para M&V Dental
        </footer>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          LATERAL DERECHO / CONTENIDO MÓVIL INTEGRADO
      ══════════════════════════════════════════════════════════════ */}
      <section className="w-full lg:w-1/2 flex-1 lg:h-full flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 xl:p-12 relative z-10 overflow-hidden">
        {/* Cabecera integrada exclusiva para móvil (< lg) agrupada directamente sobre la tarjeta */}
        <div className="lg:hidden w-full max-w-sm sm:max-w-md flex flex-col items-center text-center select-none mb-3 sm:mb-4">
          <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 mb-2">
            <img
              src={logoImg}
              alt="Logo M&V Dental"
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight m-0">
            M&V Odontologia
          </h1>
          <p className="text-[11px] sm:text-xs font-medium text-slate-600 mt-0.5">
            Gestión de Turnos
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Sistema Odontológico Integral
          </p>
        </div>

        <main className="bg-white max-w-sm sm:max-w-md w-full p-5 sm:p-8 lg:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 transition-all text-left">
          {/* ──────────────────────────────────────────────────────────
              VISTA A: CAPA MAESTRA (INICIAR SESIÓN)
          ────────────────────────────────────────────────────────── */}
          {vista === "maestro" && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <header className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight m-0">
                  Iniciar Sesión
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {tieneTokenActivo
                    ? "Ingresá tu contraseña de cuenta para iniciar"
                    : "Ingresá tu usuario y contraseña para vincular este dispositivo"}
                </p>
              </header>

              {mensajeExitoMaestro && (
                <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-in fade-in">
                  <CheckCircle2
                    size={16}
                    className="shrink-0 mt-0.5 text-emerald-600"
                  />
                  <span>{mensajeExitoMaestro}</span>
                </div>
              )}

              {alertaSeguridadMaestro && (
                <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium animate-in fade-in">
                  <ShieldAlert
                    size={16}
                    className="shrink-0 mt-0.5 text-amber-600"
                  />
                  <span>{alertaSeguridadMaestro}</span>
                </div>
              )}

              <form onSubmit={handleLoginMaestro} className="space-y-4">
                {/* Campo Usuario */}
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
                        disabled={cargandoMaestro}
                        onChange={(e) => {
                          setUsuario(e.target.value);
                          setErrorMaestro("");
                          setMensajeExitoMaestro("");
                        }}
                        placeholder="Ingresá tu usuario (ej. Odontologo)"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        className={`w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all ${
                          cargandoMaestro
                            ? "opacity-60 cursor-not-allowed bg-slate-50"
                            : ""
                        }`}
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                {/* Campo Contraseña */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Contraseña de Cuenta
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      disabled={cargandoMaestro}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMaestro("");
                        setMensajeExitoMaestro("");
                      }}
                      placeholder="Ingresá tu contraseña de cuenta"
                      autoComplete="current-password"
                      className={`w-full pl-10 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all ${
                        cargandoMaestro
                          ? "opacity-60 cursor-not-allowed bg-slate-50"
                          : ""
                      }`}
                      autoFocus={esDispositivoReconocido}
                    />
                    <button
                      type="button"
                      disabled={cargandoMaestro}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title={showPassword ? "Ocultar" : "Mostrar"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Mensaje de Error */}
                {errorMaestro && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{errorMaestro}</span>
                  </div>
                )}

                {/* Botón Principal Ingresar con Spinner y Bloqueo de Doble Clic */}
                <button
                  type="submit"
                  disabled={cargandoMaestro || !password.trim() || !usuario.trim()}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#1e6f85] hover:bg-[#18586a] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                >
                  {cargandoMaestro ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span>Validando credenciales...</span>
                    </div>
                  ) : (
                    <span>Ingresar</span>
                  )}
                </button>
              </form>

              {/* Enlace a Recuperación de Contraseña por Correo */}
              <div className="mt-6 text-center text-xs text-slate-600">
                <span>¿Olvidaste tu contraseña? </span>
                <button
                  type="button"
                  onClick={handleIrARecuperarEmail}
                  className="text-teal-700 hover:text-teal-800 font-semibold underline underline-offset-2 cursor-pointer transition-colors"
                >
                  Recuperar por correo
                </button>
              </div>

              {/* Botón visible de retorno a PIN al pie si el dispositivo ya está vinculado */}
              {tieneTokenActivo && !bloqueado && (
                <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={handleVolverAPin}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Volver a ingresar con PIN</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              VISTA B: CAPA DIARIA (PIN DE ACCESO + FACE ID)
          ────────────────────────────────────────────────────────── */}
          {vista === "pin" && (
            <div className="animate-in fade-in zoom-in-95 duration-200 text-center">
              <header className="mb-6 text-left">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight m-0">
                  PIN de Acceso
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Ingresá tu PIN de 4 dígitos para ingresar
                </p>
              </header>

              {/* Contenedor de Casillas de PIN con Input Oculto */}
              <div
                className={`pin-wrapper ${isShaking ? "shake" : ""} ${
                  bloqueado ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
                }`}
                onClick={() => {
                  if (!bloqueado && !isValidatingPin && pinInputRef.current) {
                    setErrorPin("");
                    setMensajeExitoPin("");
                    pinInputRef.current.focus();
                  }
                }}
              >
                <input
                  ref={pinInputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={handlePinChange}
                  onKeyDown={() => {
                    setErrorPin("");
                    setMensajeExitoPin("");
                  }}
                  autoComplete="one-time-code"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-lpignore="true"
                  data-form-type="other"
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  disabled={bloqueado || isValidatingPin}
                  className="hidden-pin-input"
                />

                <div
                  className={`pin-boxes ${
                    bloqueado || isValidatingPin
                      ? "opacity-40 cursor-not-allowed bg-gray-100 pointer-events-none"
                      : ""
                  }`}
                  aria-hidden="true"
                >
                  {[0, 1, 2, 3].map((index) => {
                    const isFilled = index < pin.length;
                    const isActive =
                      index === pin.length &&
                      !bloqueado &&
                      !isValidatingPin;
                    return (
                      <div
                        key={index}
                        className={`pin-box ${isFilled ? "filled" : ""} ${
                          isActive ? "active" : ""
                        } ${bloqueado ? "bg-gray-100 border-gray-200 cursor-not-allowed" : ""}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Botón Face ID: Exclusivo para vista móvil (< 768px) */}
              {isMobileView && (
                <div className="w-full md:hidden mt-5">
                  <button
                    type="button"
                    onClick={handleFaceIdLogin}
                    disabled={
                      bloqueado ||
                      isScanningFaceId ||
                      isValidatingPin
                    }
                    className={`w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                      faceIdSuccess
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : isScanningFaceId
                        ? "bg-teal-50 border-teal-300 text-teal-800 animate-pulse"
                        : bloqueado
                        ? "bg-gray-100 border-gray-200 text-gray-400 opacity-40 cursor-not-allowed pointer-events-none"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 active:scale-98"
                    } disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none`}
                  >
                    {faceIdSuccess ? (
                      <>
                        <CheckCircle2
                          size={18}
                          className="text-emerald-600 animate-in zoom-in"
                        />
                        <span>Face ID Verificado</span>
                      </>
                    ) : isScanningFaceId ? (
                      <>
                        <ScanFace size={18} className="text-teal-600 animate-pulse" />
                        <span>Escaneando Face ID...</span>
                      </>
                    ) : (
                      <>
                        <ScanFace size={18} className="text-teal-600" />
                        <span>Ingresar con Face ID</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Estados de error, cooldown temporal o mensajes de éxito */}
              {bloqueado ? (
                <div className="mt-5 p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-900 flex flex-col items-center text-center gap-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                    <Clock
                      size={16}
                      className="text-rose-600 animate-pulse shrink-0"
                    />
                    <span>Acceso por PIN bloqueado por seguridad</span>
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed font-medium">
                    Has superado los 3 intentos permitidos. El acceso por PIN ha sido bloqueado por 15 minutos.
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 border border-rose-200 rounded-full text-xs font-mono font-semibold text-rose-800">
                    <span>Tiempo restante:</span>
                    <span>{formatearTiempo(segundosBloqueo)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleIrAContraseña(
                        "El acceso por PIN ha sido bloqueado por 15 minutos. Ingresa tu contraseña para ingresar"
                      )
                    }
                    className="mt-2 w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-98 cursor-pointer"
                  >
                    Ingresar con contraseña
                  </button>
                </div>
              ) : (
                <>
                  {errorPin ? (
                    <p className="error-msg">{errorPin}</p>
                  ) : mensajeExitoPin ? (
                    <p className="success-msg">{mensajeExitoPin}</p>
                  ) : (
                    <p className="error-msg" />
                  )}

                  {/* Enlace para cambiar a Vista A (Ingreso con Contraseña) */}
                  <div className="mt-4 flex flex-col items-center gap-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleIrAContraseña()}
                      className="text-xs text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      <span>¿Olvidaste tu PIN? </span>
                      <span className="text-slate-700 hover:text-slate-900 font-medium underline underline-offset-2">
                        Ingresar con contraseña
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              VISTA C: RECUPERACIÓN DE CONTRASEÑA POR CORREO
          ────────────────────────────────────────────────────────── */}
          {vista === "recuperar_password" && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <header className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight m-0">
                  Recuperar Contraseña
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Ingresá tu correo electrónico para recibir el enlace de
                  restablecimiento
                </p>
              </header>

              {passwordRestablecida ? (
                <div className="py-6 flex flex-col items-center text-center gap-4 animate-in fade-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
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
                      handleVolverAIniciarSesion();
                      setMensajeExitoMaestro(
                        "Contraseña actualizada exitosamente. Inicie sesión con sus nuevas credenciales."
                      );
                    }}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#1e6f85] hover:bg-[#18586a] active:scale-98 transition-all shadow-sm cursor-pointer"
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              ) : emailEnviado ? (
                <form
                  onSubmit={handleRestablecerPasswordSubmit}
                  autoComplete="off"
                  className="space-y-4 animate-in fade-in"
                >
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 text-teal-800 text-xs font-medium leading-relaxed">
                    Enviamos un código de 6 dígitos a <strong>{email}</strong>. Válido durante 15 minutos.
                  </div>

                  {/* Código de 6 dígitos */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 text-center">
                      Código de 6 Dígitos
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={codigoRecuperacion}
                      disabled={cargandoRestablecer}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setCodigoRecuperacion(clean);
                        setErrorRestablecer("");
                      }}
                      placeholder="000000"
                      className="w-full text-center font-mono text-2xl tracking-[0.25em] font-bold py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-[#0f766e] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all disabled:opacity-60"
                      autoFocus
                    />
                  </div>

                  {/* Nueva Contraseña */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nueva Contraseña
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-slate-400">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showNuevaPassword ? "text" : "password"}
                        value={nuevaPassword}
                        disabled={cargandoRestablecer}
                        onChange={(e) => {
                          setNuevaPassword(e.target.value);
                          setErrorRestablecer("");
                        }}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNuevaPassword(!showNuevaPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showNuevaPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Nueva Contraseña */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-slate-400">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showNuevaPassword ? "text" : "password"}
                        value={confirmarPassword}
                        disabled={cargandoRestablecer}
                        onChange={(e) => {
                          setConfirmarPassword(e.target.value);
                          setErrorRestablecer("");
                        }}
                        placeholder="Repetí la contraseña"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {errorRestablecer && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{errorRestablecer}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      cargandoRestablecer ||
                      codigoRecuperacion.length !== 6 ||
                      !nuevaPassword ||
                      !confirmarPassword
                    }
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#1e6f85] hover:bg-[#18586a] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                  >
                    {cargandoRestablecer ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span>Restableciendo...</span>
                      </div>
                    ) : (
                      <span>Restablecer contraseña</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmailEnviado(false);
                      setCodigoRecuperacion("");
                      setNuevaPassword("");
                      setConfirmarPassword("");
                      setErrorRestablecer("");
                      setErrorEmail("");
                      setMensajeExitoMaestro("");
                    }}
                    disabled={cargandoRestablecer}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-semibold mt-2 cursor-pointer transition-colors"
                  >
                    ← Volver o ingresar otro correo
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={handleRecuperarPassword}
                  autoComplete="off"
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label
                      htmlFor={emailInputId}
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Correo Electrónico Registrado
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-slate-400">
                        <Mail size={16} />
                      </span>
                      <input
                        id={emailInputId}
                        name="email_prevent_autofill"
                        type="email"
                        value={email}
                        disabled={cargandoEmail}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrorEmail("");
                        }}
                        placeholder="ejemplo@consultoriomyv.com"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        className={`w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all ${
                          cargandoEmail
                            ? "opacity-60 cursor-not-allowed bg-slate-50"
                            : ""
                        }`}
                        autoFocus
                      />
                    </div>
                  </div>

                  {errorEmail && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{errorEmail}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={cargandoEmail || !email.trim() || cooldownEmail > 0}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#1e6f85] hover:bg-[#18586a] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                  >
                    {cargandoEmail ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span>Enviando...</span>
                      </div>
                    ) : (
                      <span>Enviar instrucciones</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleVolverAIniciarSesion}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-semibold mt-3 cursor-pointer transition-colors"
                  >
                    Volver a Iniciar Sesión
                  </button>
                </form>
              )}
            </div>
          )}
        </main>
      </section>

      {/* Pie móvil discreto */}
      <footer className="lg:hidden shrink-0 pb-3 pt-1 text-center text-[10px] text-slate-400 relative z-10 select-none">
        Desarrollado para M&V Dental
      </footer>
    </div>
  );
}
