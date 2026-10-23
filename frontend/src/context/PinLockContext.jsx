/** @format */

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import PinLogin from "../components/PinLogin";

// eslint-disable-next-line react-refresh/only-export-components
export const PinLockContext = createContext(null);

function verificarTokenDispositivo() {
  const token = localStorage.getItem("jwt_dispositivo");
  const expira = localStorage.getItem("jwt_expira");
  if (!token || !expira) return false;

  const expiraMs = parseInt(expira, 10);
  if (isNaN(expiraMs) || Date.now() >= expiraMs) {
    // Token inexistente o expirado (> 5 días)
    localStorage.removeItem("jwt_dispositivo");
    localStorage.removeItem("jwt_expira");
    return false;
  }
  return true;
}

export function PinLockProvider({ children }) {
  // Capa 1: Verificación de vinculación de dispositivo (JWT a 5 días)
  const [isDeviceLinked, setIsDeviceLinked] = useState(() =>
    verificarTokenDispositivo()
  );

  // Capa 2: Desbloqueo operativo diario (PIN / Face ID)
  const [isUnlocked, setIsUnlocked] = useState(
    () => sessionStorage.getItem("pin_unlocked") === "true"
  );

  // Estados reactivos globales de control de fallos y bloqueo de PIN
  const [intentosFallidos, setIntentosFallidos] = useState(() => {
    const tiempoBloqueo = localStorage.getItem("pin_bloqueado_hasta");
    if (tiempoBloqueo && Date.now() < Number(tiempoBloqueo)) return 3;
    return Number(localStorage.getItem("pin_intentos_fallidos")) || 0;
  });

  const [bloqueado, setBloqueado] = useState(() => {
    const tiempoBloqueo = localStorage.getItem("pin_bloqueado_hasta");
    return Boolean(tiempoBloqueo && Date.now() < Number(tiempoBloqueo));
  });

  const [segundosBloqueo, setSegundosBloqueo] = useState(() => {
    const tiempoBloqueo = localStorage.getItem("pin_bloqueado_hasta");
    if (!tiempoBloqueo) return 0;
    const restante = Math.ceil((Number(tiempoBloqueo) - Date.now()) / 1000);
    return restante > 0 ? restante : 0;
  });

  const [error, setError] = useState("");

  const resetearPenalizaciones = useCallback(() => {
    localStorage.removeItem("pin_bloqueado_hasta");
    localStorage.removeItem("pin_intentos_fallidos");
    sessionStorage.removeItem("pin_attempts");
    sessionStorage.removeItem("pin_lockout_until");
    sessionStorage.removeItem("pin_permanent_lockout");
    localStorage.removeItem("pin_intentos");
    localStorage.removeItem("pin_attempts");

    setIntentosFallidos(0);
    setBloqueado(false);
    setSegundosBloqueo(0);
    setError("");
  }, []);

  const linkDevice = useCallback((token, expira) => {
    localStorage.setItem(
      "jwt_dispositivo",
      token || "mock_jwt_header.payload.signature"
    );
    const expTime = expira || Date.now() + 5 * 24 * 60 * 60 * 1000;
    localStorage.setItem("jwt_expira", String(expTime));
    setIsDeviceLinked(true);

    // Reseteo obligatorio de penalizaciones de PIN al vincular o iniciar sesión maestra
    resetearPenalizaciones();
  }, [resetearPenalizaciones]);

  const unlinkDevice = useCallback(() => {
    localStorage.removeItem("jwt_dispositivo");
    localStorage.removeItem("jwt_expira");
    sessionStorage.removeItem("pin_unlocked");
    resetearPenalizaciones();
    setIsDeviceLinked(false);
    setIsUnlocked(false);
  }, [resetearPenalizaciones]);

  const unlock = useCallback(() => {
    sessionStorage.setItem("pin_unlocked", "true");
    setIsUnlocked(true);

    // Reseteo obligatorio de intentos al ingresar efectivamente a la terminal
    resetearPenalizaciones();
  }, [resetearPenalizaciones]);

  const lock = useCallback(() => {
    sessionStorage.removeItem("pin_unlocked");
    // Al bloquear la sesión desde la barra o inactividad, los intentos arrancan limpios en 0
    resetearPenalizaciones();
    setIsUnlocked(false);
  }, [resetearPenalizaciones]);

  const bloquearTerminal = lock;

  // ─── AUTO-BLOQUEO POR INACTIVIDAD (IDLE TIMEOUT: 15 MINUTOS) ──────
  useEffect(() => {
    if (!isUnlocked) return;

    const TIEMPO_INACTIVIDAD_MS = 15 * 60 * 1000; // 15 minutos
    let timerId = null;

    const resetTimer = () => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        lock();
      }, TIEMPO_INACTIVIDAD_MS);
    };

    resetTimer();

    // Eventos globales de interacción del usuario en la ventana
    const eventos = ["mousemove", "keydown", "click", "touchstart", "scroll"];

    let lastActivity = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 1000) {
        lastActivity = now;
        resetTimer();
      }
    };

    eventos.forEach((evento) => {
      window.addEventListener(evento, handleUserActivity, { passive: true });
    });

    return () => {
      if (timerId) clearTimeout(timerId);
      eventos.forEach((evento) => {
        window.removeEventListener(evento, handleUserActivity);
      });
    };
  }, [isUnlocked, lock]);

  return (
    <PinLockContext.Provider
      value={{
        isDeviceLinked,
        isUnlocked,
        unlock,
        lock,
        bloquearTerminal,
        linkDevice,
        unlinkDevice,
        intentosFallidos,
        setIntentosFallidos,
        bloqueado,
        setBloqueado,
        segundosBloqueo,
        setSegundosBloqueo,
        error,
        setError,
        resetearPenalizaciones,
      }}
    >
      {!isUnlocked ? (
        <PinLogin
          key={isUnlocked ? "unlocked" : "locked"}
          onUnlock={unlock}
          onDeviceLinked={linkDevice}
          isDeviceLinked={isDeviceLinked}
        />
      ) : (
        children
      )}
    </PinLockContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePinLock() {
  const context = useContext(PinLockContext);
  if (!context) {
    throw new Error("usePinLock debe utilizarse dentro de un PinLockProvider");
  }
  return context;
}

