import { useEffect, useRef, useState } from 'react'

/**
 * True once the element first enters the viewport. Without IntersectionObserver
 * (old browsers, jsdom) or with reduced motion, content is shown straight away:
 * a reveal must never be what stands between a reader and the text.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [revealed, setRevealed] = useState(
    () =>
      typeof IntersectionObserver === 'undefined' ||
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches),
  )

  useEffect(() => {
    const element = ref.current
    if (revealed || !element) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [revealed])

  return { ref, revealed }
}
