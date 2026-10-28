import { createContext, useContext } from 'react'

export interface TabsContextValue {
  baseId: string
  value: string
  select: (value: string) => void
}

export const TabsContext = createContext<TabsContextValue | null>(null)

export function useTabs(): TabsContextValue {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Componentes de abas precisam estar dentro de <Tabs>')
  return context
}

export const tabId = (baseId: string, value: string) => `${baseId}-tab-${value}`
export const panelId = (baseId: string, value: string) => `${baseId}-panel-${value}`
