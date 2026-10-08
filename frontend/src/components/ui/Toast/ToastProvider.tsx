import { X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Icon } from '../Icon'
import { ToastContext, type ToastMessage } from './toastContext'
import styles from './Toast.module.css'

export interface ToastProviderProps {
  durationMs?: number
  children: ReactNode
}

export function ToastProvider({ durationMs = 5000, children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      nextId.current += 1
      const id = nextId.current
      setToasts((current) => [...current, { ...toast, id }])
      timers.current.set(
        id,
        setTimeout(() => {
          dismiss(id)
        }, durationMs),
      )
    },
    [dismiss, durationMs],
  )

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
    }
  }, [])

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={cx(styles.toast, styles[toast.tone])}>
            <div className={styles.text}>
              <p className={styles.title}>{toast.title}</p>
              {toast.description && <p className={styles.description}>{toast.description}</p>}
            </div>
            <button
              type="button"
              className={styles.close}
              aria-label="Fechar aviso"
              onClick={() => {
                dismiss(toast.id)
              }}
            >
              <Icon icon={X} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
