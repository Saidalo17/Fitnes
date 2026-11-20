/** Можно ли показывать конфетти/яркие эффекты (клиент): учитывает настройку и системное «уменьшить движение». */
export function effectsAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (document.documentElement.dataset.fx === "off") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
