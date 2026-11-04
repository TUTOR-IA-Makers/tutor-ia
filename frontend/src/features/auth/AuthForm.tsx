import { Link, NavLink } from 'react-router'
import { cx } from '@/lib/cx'
import { AUTH_PATHS } from './destination'
import styles from './AuthForm.module.css'
import { LoginForm } from './LoginForm'
import type { AuthMode } from './messages'
import { SignupForm } from './SignupForm'
import { SocialButtons } from './SocialButtons'

const COPY: Record<AuthMode, { title: string; lead: string }> = {
  login: {
    title: 'Entrar no CodeExpert',
    lead: 'Continue de onde parou: sua biblioteca de questões está esperando.',
  },
  signup: {
    title: 'Criar sua conta',
    lead: 'O cadastro pede um código de convite enviado por quem libera o acesso.',
  },
}

const tabClass = ({ isActive }: { isActive: boolean }) => cx(styles.tab, isActive && styles.active)

export interface AuthFormProps {
  mode: AuthMode
}

export function AuthForm({ mode }: AuthFormProps) {
  const { title, lead } = COPY[mode]

  return (
    <div className={styles.card}>
      <nav aria-label="Escolha como acessar" className={styles.tabs}>
        <NavLink to={AUTH_PATHS.login} className={tabClass} end>
          Entrar
        </NavLink>
        <NavLink to={AUTH_PATHS.signup} className={tabClass} end>
          Criar conta
        </NavLink>
      </nav>

      {/* The key remounts the panel: switching clears the other form and replays the fade. */}
      <div key={mode} className={styles.panel}>
        <header className={styles.heading}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.lead}>{lead}</p>
        </header>

        <SocialButtons />

        <p className={styles.divider}>
          <span>ou com e-mail</span>
        </p>

        {mode === 'login' ? <LoginForm /> : <SignupForm />}

        <p className={styles.switch}>
          {mode === 'login' ? (
            <>
              Ainda não tem conta? <Link to={AUTH_PATHS.signup}>Criar conta</Link>
            </>
          ) : (
            <>
              Já tem conta? <Link to={AUTH_PATHS.login}>Entrar</Link>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
