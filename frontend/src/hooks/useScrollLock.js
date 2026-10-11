import { useEffect } from 'react';

// Contador global para manejar apertura múltiple/anidada de modales
let lockCount = 0;
let previousScrollY = 0;

/**
 * useScrollLock - Bloquea el scroll del fondo (body y html) de forma compatible
 * con iOS Safari, Android y navegadores de escritorio mientras un modal está abierto.
 * Preserva la posición exacta de scroll y la restaura al cerrar.
 *
 * @param {boolean} isLocked - Indica si el modal o ventana superpuesta está activa
 */
export const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      // Guardar posición actual de scroll
      previousScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

      // Bloquear scroll en body y html (compatible con iOS y Android)
      document.body.style.position = 'fixed';
      document.body.style.top = `-${previousScrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-scroll-locked', 'true');
      document.documentElement.style.overflow = 'hidden';
    }

    lockCount++;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        // Restaurar scroll original al cerrar el último modal
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.removeAttribute('data-scroll-locked');
        document.documentElement.style.overflow = '';
        window.scrollTo(0, previousScrollY);
      }
    };
  }, [isLocked]);
};

export default useScrollLock;
