import { safeNextPath } from '@/lib/navigation'

export const AUTH_PATHS = { login: '/entrar', signup: '/criar-conta' } as const
export const AFTER_AUTH = '/biblioteca'
export const NEXT_PARAM = 'proximo'

// Where to go after a session starts. safeNextPath already refuses other
// origins; this also refuses the auth pages, so a crafted link cannot bounce
// a teacher who just signed in back to the form.
export function destinationAfterAuth(next: string | null): string {
  const path = safeNextPath(next, AFTER_AUTH)
  const bare = path.split(/[?#]/)[0] ?? ''
  const isAuthPage = Object.values(AUTH_PATHS).some(
    (page) => bare === page || bare.startsWith(`${page}/`),
  )
  return isAuthPage ? AFTER_AUTH : path
}
