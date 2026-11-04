import { useEffect, useRef } from 'react'

/**
 * Tilts a 3D scene toward the pointer by writing `--rx` and `--ry` (degrees) on the
 * element. Only with a real hover pointer and without reduced motion: on touch
 * screens the scene keeps its resting angle.
 */
export function usePointerTilt<T extends HTMLElement>(maxX = 6, maxY = 12) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof window.matchMedia !== 'function') return
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !window.matchMedia('(hover: hover)').matches
    ) {
      return
    }

    let frame = 0
    const apply = (rx: number, ry: number) => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        element.style.setProperty('--rx', rx.toFixed(2))
        element.style.setProperty('--ry', ry.toFixed(2))
      })
    }
    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - 0.5
      const y = (event.clientY - rect.top) / rect.height - 0.5
      apply(-y * maxX * 2, x * maxY * 2)
    }
    const onLeave = () => {
      apply(0, 0)
    }

    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerleave', onLeave)
    return () => {
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerleave', onLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [maxX, maxY])

  return ref
}
