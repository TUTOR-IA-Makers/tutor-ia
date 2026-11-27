import { useEffect } from 'react'

export const APP_NAME = 'Milani'

export function formatTitle(page?: string): string {
  return page ? `${page} · ${APP_NAME}` : APP_NAME
}

export function useDocumentTitle(page?: string): void {
  useEffect(() => {
    document.title = formatTitle(page)
  }, [page])
}
