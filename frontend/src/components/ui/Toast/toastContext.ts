import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'info' | 'danger'

export interface ToastMessage {
  id: number
  tone: ToastTone
  title: string
  description?: string | undefined
}

export interface ToastApi {
  show: (toast: Omit<ToastMessage, 'id'>) => void
  dismiss: (id: number) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return context
}
