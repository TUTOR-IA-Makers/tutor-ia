import { AuthForm, type AuthMode } from '@/features/auth'
import { useDocumentTitle } from '@/lib/dom'

const TITLES: Record<AuthMode, string> = { login: 'Entrar', signup: 'Criar conta' }

function AuthPage({ mode }: { mode: AuthMode }) {
  useDocumentTitle(TITLES[mode])
  return <AuthForm mode={mode} />
}

export function LoginPage() {
  return <AuthPage mode="login" />
}

export function SignupPage() {
  return <AuthPage mode="signup" />
}
