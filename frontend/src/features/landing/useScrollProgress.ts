import { useEffect, useRef } from 'react'

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Writes the element's scroll progress (0 to 1) to the CSS variable `--p`, so the
 * visuals are driven by transform in CSS and React never re-renders while scrolling.
 * For a tall section the value runs while it is pinned; for a short one, while it
 * crosses the viewport. Reduced motion jumps straight to the finished state.
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (prefersReducedMotion()) {
      element.style.setProperty('--p', '1')
      return
    }

    let frame = 0
    const update = () => {
      frame = 0
      const rect = element.getBoundingClientRect()
      const viewport = window.innerHeight
      const pinned = rect.height - viewport
      const raw = pinned > 0 ? -rect.top / pinned : (viewport - rect.top) / (viewport * 0.8)
      element.style.setProperty('--p', Math.min(1, Math.max(0, raw)).toFixed(3))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return ref
}
