import { X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Icon } from '../Icon'
import styles from './Dialog.module.css'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  icon?: LucideIcon
  footer?: ReactNode
  closeLabel?: string
  children?: ReactNode
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  footer,
  closeLabel = 'Fechar',
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
    >
      {open && (
        <div className={styles.body}>
          <header className={styles.header}>
            {icon && (
              <span className={styles.icon}>
                <Icon icon={icon} size="md" />
              </span>
            )}
            <div className={styles.heading}>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className={styles.description}>
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              className={styles.close}
              aria-label={closeLabel}
              onClick={onClose}
            >
              <Icon icon={X} size="md" />
            </button>
          </header>
          {children}
          {footer && <footer className={styles.footer}>{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}
