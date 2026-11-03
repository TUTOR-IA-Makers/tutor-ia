import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, LogOut } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Avatar, Icon, useToast } from '@/components/ui'
import { initials } from '@/domain'
import { describeError } from '@/lib/http'
import { useServices } from '@/services'
import { useCurrentTeacher } from './useCurrentTeacher'
import styles from './UserMenu.module.css'

export function UserMenu() {
  const { data: teacher } = useCurrentTeacher()
  const { session } = useServices()
  const toast = useToast()
  const client = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!teacher) return <span className={styles.placeholder} aria-hidden="true" />

  const logout = async () => {
    setOpen(false)
    try {
      await session.logout()
    } catch (error) {
      const { title, message } = describeError(error)
      toast.show({ tone: 'danger', title, description: message })
      return
    }
    // Nothing fetched during the session may outlive it in memory.
    client.clear()
    toast.show({ tone: 'info', title: 'Sessão encerrada' })
    void navigate('/', { replace: true })
  }

  return (
    <div ref={root} className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          setOpen((value) => !value)
        }}
      >
        <span className={styles.identity}>
          <span className={styles.name}>{teacher.name}</span>
          <span className={styles.department}>{teacher.department}</span>
        </span>
        <Avatar initials={initials(teacher.name)} />
        <Icon icon={ChevronDown} />
        <span className="visually-hidden">Menu da conta</span>
      </button>
      {open && (
        <ul id={menuId} className={styles.menu}>
          <li>
            <button type="button" className={styles.item} onClick={() => void logout()}>
              <Icon icon={LogOut} />
              Sair
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
