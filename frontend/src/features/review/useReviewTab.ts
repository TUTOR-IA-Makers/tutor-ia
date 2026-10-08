import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

export const REVIEW_TABS = ['enunciado', 'testes'] as const
export type ReviewTab = (typeof REVIEW_TABS)[number]

function isReviewTab(value: string | null): value is ReviewTab {
  return REVIEW_TABS.some((tab) => tab === value)
}

export function useReviewTab() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('aba')
  const tab: ReviewTab = isReviewTab(raw) ? raw : 'enunciado'
  const select = useCallback(
    (value: string) => {
      if (!isReviewTab(value)) return
      setParams(value === 'enunciado' ? {} : { aba: value }, { replace: true })
    },
    [setParams],
  )
  return { tab, select }
}
