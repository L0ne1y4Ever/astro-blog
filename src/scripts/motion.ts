export const MOTION_EASING_STANDARD = 'cubic-bezier(0.22, 1, 0.36, 1)'
export const MOTION_EASING_ENTER = 'cubic-bezier(0.16, 1, 0.3, 1)'
export const MOTION_EASING_EXIT = 'cubic-bezier(0.4, 0, 0.2, 1)'

export type MotionSpeed = 'fast' | 'base' | 'slow'

const MOTION_DURATION_MAP: Record<MotionSpeed, { desktop: number, mobile: number }> = {
  fast: { desktop: 160, mobile: 140 },
  base: { desktop: 220, mobile: 180 },
  slow: { desktop: 300, mobile: 240 },
}

function isMobileViewport() {
  return window.matchMedia('(max-width: 768px)').matches
}

export function getMotionDuration(speed: MotionSpeed = 'base') {
  const durations = MOTION_DURATION_MAP[speed]
  return isMobileViewport() ? durations.mobile : durations.desktop
}

export function prefersReducedMotion(doc: Document = document) {
  return doc.documentElement.classList.contains('reduce-motion')
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
