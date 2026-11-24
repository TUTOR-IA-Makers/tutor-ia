import { LogIn } from 'lucide-react'
import { useLocation } from 'react-router'
import { ErrorState, LinkButton } from '@/components/ui'
import { loginPath } from '@/features/auth'
import { describeError } from '@/lib/http'

export function SignInAgainLink() {
  const { pathname, search } = useLocation()
  return (
    <LinkButton to={loginPath(`${pathname}${search}`)} variant="primary" icon={LogIn}>
      Entrar de novo
    </LinkButton>
  )
}

export interface RequestErrorStateProps {
  error: unknown
  onRetry: () => void
}

export function RequestErrorState({ error, onRetry }: RequestErrorStateProps) {
  const { title, message, sessionExpired } = describeError(error)
  if (sessionExpired) {
    return <ErrorState title={title} message={message} action={<SignInAgainLink />} />
  }
  return <ErrorState title={title} message={message} onRetry={onRetry} />
}
