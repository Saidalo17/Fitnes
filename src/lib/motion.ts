import type { Variants } from "framer-motion";

export const ease = [0.2, 0.8, 0.2, 1] as const;

/** Контейнер: дети появляются по очереди (stagger 40ms). */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

/** Появление: fade + сдвиг на 8px, 220ms. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease } },
};

export const modalPanel: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.15 } },
};

// prefers-reduced-motion обрабатывается глобально через <MotionConfig reducedMotion="user">.
