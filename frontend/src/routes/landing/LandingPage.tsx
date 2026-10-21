import { ClosingCall, Hero, Scope } from '@/features/landing'
import { useDocumentTitle } from '@/lib/dom'

export function LandingPage() {
  useDocumentTitle()
  return (
    <>
      <Hero />
      <Scope />
      <ClosingCall />
    </>
  )
}
