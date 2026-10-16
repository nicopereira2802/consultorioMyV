/** @format */

import { useState, useRef, useEffect, useId } from "react";
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
import api from "../services/api";

export default function PinLogin({
  onUnlock,
  onDeviceLinked,
  isDeviceLinked = false,
}) {
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

  // ─── ESTADOS VISTA B: CAPA DIARIA (PIN Y COOLDOWN) ────────────────
  const [pin, setPin] = useState("");
  const [errorPin, setErrorPin] = useState("");
  const [mensajeExitoPin, setMensajeExitoPin] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [isValidatingPin, setIsValidatingPin] = useState(false);

  const [intentosFallidos, setIntentosFallidos] = useState(() => {
    return parseInt(sessionStorage.getItem("pin_attempts"), 10) || 0;
  });

  const [isPermanentLockout, setIsPermanentLockout] = useState(() => {
    return sessionStorage.getItem("pin_permanent_lockout") === "true";
  });

  const [cooldownSeconds, setCooldownSeconds] = useState(() => {
    const lockUntil = sessionStorage.getItem("pin_lockout_until");
    if (lockUntil) {
      const remainingMs = parseInt(lockUntil, 10) - Date.now();
      if (remainingMs > 0) return Math.ceil(remainingMs / 1000);
      sessionStorage.removeItem("pin_lockout_until");
    }
    return 0;
  });

  const [isLockedOut, setIsLockedOut] = useState(() => {
    const lockUntil = sessionStorage.getItem("pin_lockout_until");
    if (lockUntil) return parseInt(lockUntil, 10) - Date.now() > 0;
    return false;
  });

  const pinInputRef = useRef(null);

  // ─── DETECCIÓN MÓVIL / TÁCTIL (iPhone 16) Y FACE ID ──────────────
  const [isMobileOrTouch, setIsMobileOrTouch] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 768
    );
  });

  const [isScanningFaceId, setIsScanningFaceId] = useState(false);
  const [faceIdSuccess, setFaceIdSuccess] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileOrTouch(
        window.matchMedia("(pointer: coarse)").matches ||
          navigator.maxTouchPoints > 0 ||
          window.innerWidth <= 768
      );
    };

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ─── CUENTA REGRESIVA DE COOLDOWN (ANTI-F5) ───────────────────────
  useEffect(() => {
    if (!isLockedOut) return;

    const interval = setInterval(() => {
      const lockUntil = sessionStorage.getItem("pin_lockout_until");
      if (!lockUntil) {
        setIsLockedOut(false);
        setCooldownSeconds(0);
        setErrorPin("");
        setTimeout(() => {
          if (pinInputRef.current) pinInputRef.current.focus();
        }, 100);
        return;
      }

      const remainingMs = parseInt(lockUntil, 10) - Date.now();
      const remainingSec = Math.ceil(remainingMs / 1000);

      if (remainingSec <= 0) {
        sessionStorage.removeItem("pin_lockout_until");
        setIsLockedOut(false);
        setCooldownSeconds(0);
        setErrorPin("");
        setPin("");
        setTimeout(() => {
          if (pinInputRef.current) pinInputRef.current.focus();
        }, 100);
      } else {
        setCooldownSeconds(remainingSec);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isLockedOut]);

  // ─── ESTADOS VISTA C: RECUPERACIÓN POR CORREO ─────────────────────
  const [email, setEmail] = useState("");
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [cargandoEmail, setCargandoEmail] = useState(false);
  const [errorEmail, setErrorEmail] = useState("");
  const [cooldownEmail, setCooldownEmail] = useState(0);
  const emailInputId = useId();

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
    if (vista === "pin" && !isLockedOut && !isPermanentLockout) {
      const timer = setTimeout(() => {
        if (pinInputRef.current) pinInputRef.current.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [vista, isLockedOut, isPermanentLockout]);

  // ─── TRANSICIONES DE VISTA CON HIGIENE DE MEMORIA INMEDIATA ───────
  const handleVolverAPin = () => {
    setErrorMaestro("");
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
    if (alerta) setAlertaSeguridadMaestro(alerta);
    setVista("maestro");
  };

  const handleIrARecuperarEmail = () => {
    setPassword(""); // Purga inmediata de contraseña
    setErrorMaestro("");
    setEmail("");
    setErrorEmail("");
    setEmailEnviado(false);
    setVista("recuperar_password");
  };

  const handleVolverAIniciarSesion = () => {
    setEmail(""); // Purga inmediata de correo
    setErrorEmail("");
    setEmailEnviado(false);
    setPassword("");
    setErrorMaestro("");
    setVista("maestro");
  };

  // ─── CONFIRMAR RESTABLECIMIENTO Y DESBLOQUEO DIRECTO ──────────────
  const handleConfirmarRestablecimiento = () => {
    const token = "mock_jwt_header.payload.signature";
    const expira = Date.now() + 5 * 24 * 60 * 60 * 1000;

    const user = usuarioGuardado || usuario || "Odontólogo";
    localStorage.setItem("usuario_guardado", user);
    localStorage.setItem("jwt_dispositivo", token);
    localStorage.setItem("jwt_expira", String(expira));

    sessionStorage.removeItem("pin_attempts");
    sessionStorage.removeItem("pin_lockout_until");
    sessionStorage.removeItem("pin_permanent_lockout");
    setIntentosFallidos(0);
    setIsLockedOut(false);
    setIsPermanentLockout(false);
    setAlertaSeguridadMaestro("");

    // Purga de campos sensibles antes de salir
    setPassword("");
    setPin("");
    setEmail("");

    onDeviceLinked?.(token, expira);
    if (onUnlock) onUnlock();
  };

  // ─── ACCIONES VISTA A: LOGIN MAESTRO (PREVENCIÓN DOBLE CLIC) ──────
  const handleLoginMaestro = async (e) => {
    e.preventDefault();
    if (cargandoMaestro) return; // Bloqueo de doble clic

    setErrorMaestro("");

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
      const res = await api.post("/auth/vincular-dispositivo", {
        nombre_usuario: usuario.trim(),
        contraseña: password,
      });

      const token = res.data?.token || "mock_jwt_header.payload.signature";
      const expira = res.data?.expira || Date.now() + 5 * 24 * 60 * 60 * 1000;

      localStorage.setItem("usuario_guardado", usuario.trim());
      localStorage.setItem("jwt_dispositivo", token);
      localStorage.setItem("jwt_expira", String(expira));

      sessionStorage.removeItem("pin_attempts");
      sessionStorage.removeItem("pin_lockout_until");
      sessionStorage.removeItem("pin_permanent_lockout");
      setIntentosFallidos(0);
      setIsLockedOut(false);
      setIsPermanentLockout(false);
      setAlertaSeguridadMaestro("");

      // Purga de contraseña de memoria
      setPassword("");
      onDeviceLinked?.(token, expira);

      // Desbloqueo y autenticación directa sin retornar al PIN
      if (onUnlock) onUnlock();
    } catch {
      // Simulación Frontend-First con retardo de procesamiento realista (500ms)
      await new Promise((resolve) => setTimeout(resolve, 500));

      const contrasenasValidas = ["admin123", "odontologia2026", "admin"];

      if (contrasenasValidas.includes(password.trim())) {
        const token = "mock_jwt_header.payload.signature";
        const expira = Date.now() + 5 * 24 * 60 * 60 * 1000; // 5 días

        localStorage.setItem("usuario_guardado", usuario.trim());
        localStorage.setItem("jwt_dispositivo", token);
        localStorage.setItem("jwt_expira", String(expira));

        sessionStorage.removeItem("pin_attempts");
        sessionStorage.removeItem("pin_lockout_until");
        sessionStorage.removeItem("pin_permanent_lockout");
        setIntentosFallidos(0);
        setIsLockedOut(false);
        setIsPermanentLockout(false);
        setAlertaSeguridadMaestro("");

        // Purga de contraseña de memoria
        setPassword("");
        onDeviceLinked?.(token, expira);

        // Desbloqueo y autenticación directa sin retornar al PIN
        if (onUnlock) onUnlock();
      } else {
        setErrorMaestro(
          "Contraseña incorrecta. Verificá tus credenciales de Odontólogo (Tip de prueba: 'admin123')."
        );
      }
    } finally {
      setCargandoMaestro(false);
    }
  };

  // ─── ACCIONES VISTA B: VALIDACIÓN DE PIN ──────────────────────────
  const getValidPin = () => localStorage.getItem("terminal_pin") || "1234";

  const validarPin = (enteredPin) => {
    if (isLockedOut || isPermanentLockout || isValidatingPin) return;

    setIsValidatingPin(true);
    const validPin = getValidPin();

    setTimeout(() => {
      if (enteredPin === validPin) {
        setErrorPin("");
        setMensajeExitoPin("");
        sessionStorage.removeItem("pin_attempts");
        sessionStorage.removeItem("pin_lockout_until");
        sessionStorage.removeItem("pin_permanent_lockout");
        setIntentosFallidos(0);
        setIsLockedOut(false);
        setIsPermanentLockout(false);
        setPin(""); // Purga inmediata
        setIsValidatingPin(false);
        if (onUnlock) onUnlock();
      } else {
        const nuevosIntentos = intentosFallidos + 1;
        setIntentosFallidos(nuevosIntentos);
        sessionStorage.setItem("pin_attempts", String(nuevosIntentos));
        setMensajeExitoPin("");

        if (nuevosIntentos >= 5) {
          // Degradación obligatoria tras 5 fallos: forzar login maestro
          setIsPermanentLockout(true);
          sessionStorage.setItem("pin_permanent_lockout", "true");
          setAlertaSeguridadMaestro(
            "Terminal bloqueada por seguridad. Ingresá tu contraseña maestra para reanudar el acceso."
          );
          setVista("maestro");
          setPin(""); // Purga inmediata
          setIsValidatingPin(false);
        } else if (nuevosIntentos === 3) {
          // Penalización de 30 segundos
          const lockUntil = Date.now() + 30 * 1000;
          sessionStorage.setItem("pin_lockout_until", String(lockUntil));
          setCooldownSeconds(30);
          setIsLockedOut(true);
          setIsShaking(true);
          setPin(""); // Purga inmediata
          setIsValidatingPin(false);
          setTimeout(() => setIsShaking(false), 400);
        } else {
          setIsShaking(true);
          const restantes =
            nuevosIntentos < 3 ? 3 - nuevosIntentos : 5 - nuevosIntentos;
          setErrorPin(
            `PIN incorrecto. Te queda${restantes === 1 ? "" : "n"} ${restantes} intento${restantes === 1 ? "" : "s"}.`
          );
          setTimeout(() => {
            setIsShaking(false);
            setPin(""); // Purga inmediata
            setIsValidatingPin(false);
            if (pinInputRef.current) pinInputRef.current.focus();
          }, 400);
        }
      }
    }, 400); // 400ms de verificación realista
  };

  const handlePinChange = (e) => {
    if (isLockedOut || isPermanentLockout || isValidatingPin) return;
    const cleanValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    setPin(cleanValue);
    setErrorPin("");
    setMensajeExitoPin("");
    if (cleanValue.length === 4) {
      validarPin(cleanValue);
    }
  };

  const handleFaceIdLogin = async () => {
    if (isLockedOut || isPermanentLockout || isScanningFaceId) return;

    setIsScanningFaceId(true);
    setErrorPin("");
    setMensajeExitoPin("");

    try {
      if (
        window.PublicKeyCredential &&
        window.isSecureContext &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
          "function"
      ) {
        const hasAuthenticator =
          await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (hasAuthenticator) {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          try {
            await navigator.credentials.get({
              publicKey: {
                challenge,
                timeout: 4000,
                userVerification: "preferred",
              },
            });
            setFaceIdSuccess(true);
            setTimeout(() => {
              if (onUnlock) onUnlock();
            }, 400);
            return;
          } catch {
            // Fallback a simulación
          }
        }
      }

      // Simulación biométrica de 1 segundo (iPhone 16 / Dev Mode)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setFaceIdSuccess(true);
      setTimeout(() => {
        setIsScanningFaceId(false);
        setFaceIdSuccess(false);
        if (onUnlock) onUnlock();
      }, 500);
    } catch {
      setIsScanningFaceId(false);
      setFaceIdSuccess(false);
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
      await api.post("/auth/recuperar-password", { email: email.trim() });
      setEmailEnviado(true);
      setCooldownEmail(60);
    } catch {
      // Simulación de envío con retardo realista de 500ms
      await new Promise((resolve) => setTimeout(resolve, 500));
      setEmailEnviado(true);
      setCooldownEmail(60);
    } finally {
      setCargandoEmail(false);
    }
  };

  return (
    <div className="w-full min-h-screen lg:h-screen overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row bg-white font-sans relative">
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
                M&V Dental
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
          CABECERA INTEGRADA FLOTANTE (MÓVIL < lg)
          Sin recuadros rígidos, con espacio superior para iOS
      ══════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden w-full pt-8 sm:pt-12 pb-2 px-6 flex flex-col items-center text-center relative z-10 select-none">
        <div className="w-20 h-20 sm:w-24 sm:h-24 mb-3">
          <img
            src={logoImg}
            alt="Logo M&V Dental"
            className="w-full h-full object-contain mix-blend-multiply"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight m-0">
          M&V Dental
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5">
          Gestión de Turnos
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Sistema Odontológico Integral
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          LATERAL DERECHO: TARJETA FLOTANTE DE INTERACCIÓN
      ══════════════════════════════════════════════════════════════ */}
      <section className="w-full lg:w-1/2 lg:h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12 relative z-10">
        <main className="bg-white max-w-sm sm:max-w-md w-full p-6 sm:p-8 lg:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 transition-all text-left">
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
                        }}
                        placeholder="Ingresá tu usuario (ej. Odontologo)"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        className={`w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all ${
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
                      }}
                      placeholder="Ingresá tu contraseña de cuenta"
                      autoComplete="current-password"
                      className={`w-full pl-10 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all ${
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
              {tieneTokenActivo && !isPermanentLockout && (
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
                className={`pin-wrapper ${isShaking ? "shake" : ""}`}
                onClick={() => {
                  if (!isLockedOut && !isPermanentLockout && pinInputRef.current) {
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
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  disabled={isLockedOut || isPermanentLockout || isValidatingPin}
                  className="hidden-pin-input"
                />

                <div
                  className={`pin-boxes ${
                    isLockedOut || isPermanentLockout || isValidatingPin
                      ? "opacity-60 pointer-events-none"
                      : ""
                  }`}
                  aria-hidden="true"
                >
                  {[0, 1, 2, 3].map((index) => {
                    const isFilled = index < pin.length;
                    const isActive =
                      index === pin.length &&
                      !isLockedOut &&
                      !isPermanentLockout &&
                      !isValidatingPin;
                    return (
                      <div
                        key={index}
                        className={`pin-box ${isFilled ? "filled" : ""} ${
                          isActive ? "active" : ""
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Botón Face ID integrado con fondo suave (bg-slate-50 border-slate-200 text-slate-700) */}
              {isMobileOrTouch && (
                <div className="mt-5 w-full">
                  <button
                    type="button"
                    onClick={handleFaceIdLogin}
                    disabled={
                      isLockedOut ||
                      isPermanentLockout ||
                      isScanningFaceId ||
                      isValidatingPin
                    }
                    className={`w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                      faceIdSuccess
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : isScanningFaceId
                        ? "bg-teal-50 border-teal-300 text-teal-800 animate-pulse"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 active:scale-98"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
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
              {isLockedOut ? (
                <div className="mt-5 p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex flex-col items-center gap-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                    <Clock
                      size={16}
                      className="text-amber-600 animate-pulse shrink-0"
                    />
                    <span>Demasiados intentos fallidos.</span>
                  </div>
                  <p className="text-xs text-amber-700 font-mono font-medium">
                    Esperá 00:{String(cooldownSeconds).padStart(2, "0")}...
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleIrAContraseña(
                        "Ingresá tu contraseña de cuenta para reanudar el acceso."
                      )
                    }
                    className="mt-1 text-xs font-semibold text-teal-700 hover:text-teal-800 underline underline-offset-2 cursor-pointer transition-colors"
                  >
                    ¿Sos la titular? Ingresar con contraseña
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

                  {/* Enlace para cambiar a Vista A con purga de memoria */}
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleIrAContraseña()}
                      className="text-xs text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <span>¿Olvidaste tu PIN? </span>
                      <span className="text-teal-700 hover:text-teal-800 font-semibold underline underline-offset-2">
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

              {emailEnviado ? (
                <div className="py-6 flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-in zoom-in">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    ¡Correo de Recuperación Enviado!
                  </h3>
                  <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                    Te enviamos un correo con las instrucciones para restablecer tu
                    clave.
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {email}
                  </p>

                  {/* Cooldown de 60 segundos para reenvío (Rate Limiting de UI) */}
                  {cooldownEmail > 0 ? (
                    <div className="mt-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed select-none">
                      <Clock size={14} className="text-teal-600 animate-pulse" />
                      <span>
                        Reenviar enlace en (00:{String(cooldownEmail).padStart(2, "0")})...
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRecuperarPassword}
                      disabled={cargandoEmail}
                      className="mt-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Mail size={14} />
                      <span>Reenviar enlace de recuperación</span>
                    </button>
                  )}

                  {/* Confirmación y desbloqueo directo hacia la agenda */}
                  <button
                    type="button"
                    onClick={handleConfirmarRestablecimiento}
                    className="mt-3 w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1e6f85] to-[#2eb086] hover:opacity-95 active:scale-98 transition-all cursor-pointer shadow-md shadow-teal-700/10 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>Confirmar y Desbloquear Terminal</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleVolverAIniciarSesion}
                    className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Volver a Iniciar Sesión
                  </button>
                </div>
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
                        className={`w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6f85]/30 focus:border-[#1e6f85] transition-all ${
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
                        <span>Enviando enlace...</span>
                      </div>
                    ) : (
                      <span>Enviar Enlace de Recuperación</span>
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
      <footer className="lg:hidden pb-6 pt-2 text-center text-[11px] text-slate-400 relative z-10 select-none">
        Desarrollado para M&V Dental
      </footer>
    </div>
  );
}
