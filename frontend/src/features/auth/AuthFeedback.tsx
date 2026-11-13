import { Callout } from '@/components/ui'
import { COOLDOWN_MS } from './attempts'

interface AuthFeedbackProps {
  error: string | null
  locked: boolean
}

// The countdown itself lives on the submit button, which is not a live
// region: announcing every second would drown the screen reader.
export function AuthFeedback({ error, locked }: AuthFeedbackProps) {
  return (
    <>
      {error && (
        <Callout tone="danger" role="alert">
          {error}
        </Callout>
      )}
      {locked && (
        <Callout tone="warning" role="status">
          Foram várias tentativas seguidas. Aguarde {String(COOLDOWN_MS / 1000)} segundos para
          tentar de novo.
        </Callout>
      )}
    </>
  )
}
