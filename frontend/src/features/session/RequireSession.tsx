import { Navigate, Outlet, useLocation } from 'react-router'
import { loginPath } from '@/features/auth'
import { HttpError } from '@/lib/http'
import { useCurrentTeacher } from './useCurrentTeacher'

// The app's pages render while the session is checked, so a signed-in teacher
// never waits on an extra round trip. Only a 401 sends them to the login,
// which brings them back here afterwards. Any other failure is left to the
// page, whose own requests show it with a retry.
export function RequireSession() {
  const { error } = useCurrentTeacher()
  const { pathname, search } = useLocation()
  if (error instanceof HttpError && error.status === 401) {
    return <Navigate to={loginPath(`${pathname}${search}`)} replace />
  }
  return <Outlet />
}
