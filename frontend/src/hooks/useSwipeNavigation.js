import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Mapeo canónico de rutas del proyecto
const RUTAS = {
  TURNOS: '/agenda',
  PACIENTES: '/pacientes',
  PRACTICAS: '/practicas',
  COBROS: '/cobros',
};

// Diccionario de navegación circular exacta
const MAPA_TRANSICIONES = {
  [RUTAS.COBROS]: {
    derecha: RUTAS.TURNOS,
    izquierda: RUTAS.PRACTICAS,
  },
  [RUTAS.TURNOS]: {
    derecha: RUTAS.PACIENTES,
    izquierda: RUTAS.COBROS,
  },
  [RUTAS.PACIENTES]: {
    derecha: RUTAS.PRACTICAS,
    izquierda: RUTAS.TURNOS,
  },
  [RUTAS.PRACTICAS]: {
    derecha: RUTAS.COBROS,
    izquierda: RUTAS.PACIENTES,
  },
};

/**
 * Normaliza sub-rutas al módulo principal correspondiente
 */
const normalizarRuta = (pathname) => {
  if (pathname === '/' || pathname.startsWith('/agenda') || pathname.startsWith('/atencion')) {
    return RUTAS.TURNOS;
  }
  if (pathname.startsWith('/pacientes') || pathname === '/registrar-paciente') {
    return RUTAS.PACIENTES;
  }
  if (pathname.startsWith('/cobros') || pathname.startsWith('/pagos') || pathname === '/registro-cobros') {
    return RUTAS.COBROS;
  }
  if (pathname.startsWith('/practicas')) {
    return RUTAS.PRACTICAS;
  }
  return pathname;
};

export const useSwipeNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const startX = useRef(0);
  const startY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e) => {
      // Solo activo en mobile (ancho <= 768px)
      if (window.innerWidth > 768) return;
      if (!e.touches || e.touches.length === 0) return;

      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      // Solo activo en mobile (ancho <= 768px)
      if (window.innerWidth > 768) return;

      // Si hay un modal abierto o el body está bloqueado, no navegar
      if (
        document.body.style.overflow === 'hidden' ||
        document.body.style.position === 'fixed' ||
        document.body.getAttribute('data-scroll-locked') === 'true'
      ) {
        return;
      }

      if (!e.changedTouches || e.changedTouches.length === 0) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const diffX = endX - startX.current;
      const diffY = endY - startY.current;

      // Umbral de gesto: mínimo 50px horizontal y mayor al movimiento vertical
      if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        // Evitar conflicto si el usuario estaba deslizando un scroll horizontal interno o interactuando con formularios
        const target = e.target;
        if (target && target.closest && target.closest('.overflow-x-auto, .tabla-scroll, .cobros-table-scroll, input, select, textarea')) {
          return;
        }

        // Normalizar ruta actual (si la agenda es '/' mapearla a RUTAS.TURNOS)
        const rutaActual = normalizarRuta(location.pathname);
        const transicion = MAPA_TRANSICIONES[rutaActual];
        if (!transicion) return;

        if (diffX > 0) {
          // Deslizar el dedo hacia la DERECHA -> Mover pantalla hacia la IZQUIERDA
          if (transicion.izquierda) {
            navigate(transicion.izquierda);
          }
        } else {
          // Deslizar el dedo hacia la IZQUIERDA -> Mover pantalla hacia la DERECHA
          if (transicion.derecha) {
            navigate(transicion.derecha);
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [location.pathname, navigate]);
};

export default useSwipeNavigation;
