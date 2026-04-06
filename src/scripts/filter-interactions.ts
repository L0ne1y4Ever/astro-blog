const MOTION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
const MOTION_DURATION = 240

const activeAnimations = new WeakMap<HTMLElement, Animation>()

function prefersReducedMotion() {
  return document.documentElement.classList.contains('reduce-motion')
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function cancelAnimation(element: HTMLElement) {
  const animation = activeAnimations.get(element)
  if (!animation) {
    return
  }

  animation.cancel()
  activeAnimations.delete(element)
}

function trackAnimation(element: HTMLElement, animation: Animation) {
  activeAnimations.set(element, animation)

  const clear = () => {
    if (activeAnimations.get(element) === animation) {
      activeAnimations.delete(element)
    }
  }

  animation.addEventListener('finish', clear, { once: true })
  animation.addEventListener('cancel', clear, { once: true })
}

function isVisibleForLayout(element: HTMLElement) {
  if (element.classList.contains('is-hidden')) {
    return false
  }

  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

function collectLayoutRects(root: ParentNode, selectors: string[]) {
  const rects = new Map<HTMLElement, DOMRect>()

  selectors.forEach((selector) => {
    root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      cancelAnimation(element)

      if (isVisibleForLayout(element)) {
        rects.set(element, element.getBoundingClientRect())
      }
    })
  })

  return rects
}

export function runFlipTransition(
  root: HTMLElement,
  selectors: string[],
  updateDOM: () => void,
  duration: number = MOTION_DURATION,
) {
  if (prefersReducedMotion() || typeof HTMLElement.prototype.animate !== 'function') {
    updateDOM()
    return
  }

  const firstRects = collectLayoutRects(root, selectors)

  updateDOM()

  const lastRects = collectLayoutRects(root, selectors)

  lastRects.forEach((lastRect, element) => {
    const firstRect = firstRects.get(element)
    if (!firstRect) {
      return
    }

    const deltaX = firstRect.left - lastRect.left
    const deltaY = firstRect.top - lastRect.top
    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) {
      return
    }

    const animation = element.animate(
      [
        { transform: `translate(${deltaX}px, ${deltaY}px)` },
        { transform: 'translate(0, 0)' },
      ],
      {
        duration,
        easing: MOTION_EASING,
        fill: 'both',
      },
    )

    trackAnimation(element, animation)
  })
}

export function animateTextSwap(element: HTMLElement | null) {
  if (!element || prefersReducedMotion() || typeof HTMLElement.prototype.animate !== 'function') {
    return
  }

  cancelAnimation(element)

  const animation = element.animate(
    [
      { opacity: 0.6, transform: 'translateY(-2px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    {
      duration: 160,
      easing: MOTION_EASING,
      fill: 'both',
    },
  )

  trackAnimation(element, animation)
}

interface DropdownController {
  close: () => void
  destroy: () => void
}

export function createDropdownController(dropdown: HTMLElement | null): DropdownController {
  if (!dropdown) {
    return {
      close: () => {},
      destroy: () => {},
    }
  }

  const trigger = dropdown.querySelector<HTMLElement>('[data-dropdown-trigger]')
  const menu = dropdown.querySelector<HTMLElement>('[data-dropdown-menu]')

  if (!trigger || !menu) {
    return {
      close: () => {},
      destroy: () => {},
    }
  }

  const controller = new AbortController()
  let isOpen = dropdown.dataset.open === '1'

  const setOpen = (nextOpen: boolean) => {
    isOpen = nextOpen
    dropdown.dataset.open = nextOpen ? '1' : '0'
    trigger.setAttribute('aria-expanded', nextOpen ? 'true' : 'false')
    menu.setAttribute('aria-hidden', nextOpen ? 'false' : 'true')
  }

  trigger.addEventListener('click', (event) => {
    event.preventDefault()
    setOpen(!isOpen)
  }, { signal: controller.signal })

  document.addEventListener('click', (event) => {
    if (!isOpen) {
      return
    }

    const target = event.target
    if (!(target instanceof Node)) {
      return
    }

    if (!dropdown.contains(target)) {
      setOpen(false)
    }
  }, { signal: controller.signal })

  document.addEventListener('keydown', (event) => {
    if (!isOpen || event.key !== 'Escape') {
      return
    }

    setOpen(false)
    trigger.focus()
  }, { signal: controller.signal })

  setOpen(isOpen)

  return {
    close: () => setOpen(false),
    destroy: () => controller.abort(),
  }
}
