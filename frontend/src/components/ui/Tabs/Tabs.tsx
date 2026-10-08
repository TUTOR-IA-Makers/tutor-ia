import type { LucideIcon } from 'lucide-react'
import { useId, useMemo, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Icon } from '../Icon'
import { panelId, tabId, TabsContext, useTabs } from './tabsContext'
import styles from './Tabs.module.css'

export interface TabsProps {
  value: string
  onChange: (value: string) => void
  children: ReactNode
}

export function Tabs({ value, onChange, children }: TabsProps) {
  const baseId = useId()
  const context = useMemo(() => ({ baseId, value, select: onChange }), [baseId, value, onChange])
  return <TabsContext.Provider value={context}>{children}</TabsContext.Provider>
}

const NAVIGATION_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End'])

function nextIndex(key: string, current: number, total: number): number {
  if (key === 'Home') return 0
  if (key === 'End') return total - 1
  const delta = key === 'ArrowRight' ? 1 : -1
  return (current + delta + total) % total
}

export interface TabListProps {
  label: string
  children: ReactNode
}

export function TabList({ label, children }: TabListProps) {
  return (
    <div role="tablist" aria-label={label} className={styles.list}>
      {children}
    </div>
  )
}

export interface TabProps {
  value: string
  icon?: LucideIcon
  badge?: ReactNode
  children: ReactNode
}

export function Tab({ value, icon, badge, children }: TabProps) {
  const { baseId, value: active, select } = useTabs()
  const selected = value === active
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!NAVIGATION_KEYS.has(event.key)) return
    const list = event.currentTarget.closest('[role="tablist"]')
    const tabs = [...(list?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])]
    const current = tabs.indexOf(event.currentTarget)
    const target = tabs[nextIndex(event.key, current, tabs.length)]
    if (!target) return
    event.preventDefault()
    target.focus()
    const next = target.dataset.value
    if (next) select(next)
  }
  return (
    <button
      type="button"
      role="tab"
      id={tabId(baseId, value)}
      aria-selected={selected}
      aria-controls={panelId(baseId, value)}
      tabIndex={selected ? 0 : -1}
      data-value={value}
      className={cx(styles.tab, selected && styles.selected)}
      onClick={() => {
        select(value)
      }}
      onKeyDown={onKeyDown}
    >
      {icon && <Icon icon={icon} size="md" />}
      {children}
      {badge !== undefined && <span className={styles.badge}>{badge}</span>}
    </button>
  )
}

export interface TabPanelProps {
  value: string
  children: ReactNode
}

export function TabPanel({ value, children }: TabPanelProps) {
  const { baseId, value: active } = useTabs()
  if (value !== active) return null
  return (
    <div
      role="tabpanel"
      id={panelId(baseId, value)}
      aria-labelledby={tabId(baseId, value)}
      tabIndex={0}
      className={styles.panel}
    >
      {children}
    </div>
  )
}
