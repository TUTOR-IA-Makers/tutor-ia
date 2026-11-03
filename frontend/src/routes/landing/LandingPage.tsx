import { useEffect } from 'react'
import {
  ClosingCall,
  Demo,
  ExecutionProof,
  Faq,
  Hero,
  Problem,
  Scope,
  ScrollStory,
  trackEvent,
} from '@/features/landing'
import { useDocumentTitle } from '@/lib/dom'

export function LandingPage() {
  useDocumentTitle()
  useEffect(() => {
    trackEvent('landing_view')
  }, [])

  return (
    <>
      <Hero />
      <Problem />
      <ScrollStory />
      <ExecutionProof />
      <Demo />
      <Scope />
      <Faq />
      <ClosingCall />
    </>
  )
}
