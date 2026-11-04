import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import type { LoginCredentials, Registration } from '@/domain'
import { sessionKeys } from '@/features/session'
import { useServices } from '@/services'
import { INITIAL_ATTEMPTS, recordFailure, remainingSeconds, type AttemptState } from './attempts'
import { destinationAfterAuth, NEXT_PARAM } from './destination'
import { AUTH_MESSAGES, authErrorMessage, type AuthMode } from './messages'
import { loginSchema, signupSchema, type LoginValues, type SignupValues } from './schema'

export interface AuthSubmit<T> {
  submit: (values: T) => Promise<void>
  isPending: boolean
  error: string | null
  lockSeconds: number
}

interface Options {
  now?: () => number
}

// Plain component state instead of useMutation on purpose: a mutation keeps
// its variables in the shared MutationCache, and the password must not live
// anywhere outside the form that owns it.
function useGuardedSubmit<T>(
  mode: AuthMode,
  parse: (values: T) => T | null,
  call: (data: T) => Promise<void>,
  { now = Date.now }: Options,
): AuthSubmit<T> {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const inFlight = useRef(false)
  const [isPending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<AttemptState>(INITIAL_ATTEMPTS)
  const [clock, setClock] = useState(now)

  const lockSeconds = remainingSeconds(attempts, clock)

  useEffect(() => {
    if (attempts.lockedUntil === null) return
    const timer = window.setInterval(() => {
      const current = now()
      setClock(current)
      if (remainingSeconds(attempts, current) === 0) {
        setAttempts((state) => ({ ...state, lockedUntil: null }))
      }
    }, 1000)
    return () => {
      window.clearInterval(timer)
    }
  }, [attempts, now])

  const submit = async (values: T) => {
    if (inFlight.current || remainingSeconds(attempts, now()) > 0) return

    // The form already validated, but this hook is the last stop before the
    // network and must not trust that its caller was the form.
    const data = parse(values)
    if (data === null) {
      setError(AUTH_MESSAGES.invalid)
      return
    }

    inFlight.current = true
    setPending(true)
    setError(null)
    try {
      await call(data)
      setAttempts(INITIAL_ATTEMPTS)
      await queryClient.invalidateQueries({ queryKey: sessionKeys.teacher })
      void navigate(destinationAfterAuth(params.get(NEXT_PARAM)), { replace: true })
    } catch (cause) {
      const current = now()
      setClock(current)
      setAttempts((state) => recordFailure(state, current))
      setError(authErrorMessage(mode, cause))
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }

  return { submit, isPending, error, lockSeconds }
}

export function useLogin(options: Options = {}): AuthSubmit<LoginValues> {
  const { session } = useServices()
  return useGuardedSubmit<LoginValues>(
    'login',
    (values) => {
      const result = loginSchema.safeParse(values)
      return result.success ? result.data : null
    },
    (data) => {
      const credentials: LoginCredentials = { email: data.email, password: data.password }
      return session.login(credentials)
    },
    options,
  )
}

export function useSignup(options: Options = {}): AuthSubmit<SignupValues> {
  const { session } = useServices()
  return useGuardedSubmit<SignupValues>(
    'signup',
    (values) => {
      const result = signupSchema.safeParse(values)
      return result.success ? result.data : null
    },
    (data) => {
      // confirmPassword stops here: it proves the teacher typed the password
      // twice and has no business on the wire.
      const registration: Registration = {
        name: data.name,
        email: data.email,
        password: data.password,
        inviteCode: data.inviteCode,
      }
      return session.register(registration)
    },
    options,
  )
}
