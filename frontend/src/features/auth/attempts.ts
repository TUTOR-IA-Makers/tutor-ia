// A soft brake on repeated failures. It spares the teacher from hammering a
// typo and slows a casual guesser; the real rate limit belongs to the backend
// (G8-2), because this state disappears with a page reload.

export const MAX_FAILURES = 5
export const COOLDOWN_MS = 30_000

export interface AttemptState {
  failures: number
  lockedUntil: number | null
}

export const INITIAL_ATTEMPTS: AttemptState = { failures: 0, lockedUntil: null }

export function recordFailure(state: AttemptState, now: number): AttemptState {
  const failures = state.failures + 1
  if (failures >= MAX_FAILURES) return { failures: 0, lockedUntil: now + COOLDOWN_MS }
  return { failures, lockedUntil: null }
}

export function remainingSeconds(state: AttemptState, now: number): number {
  if (state.lockedUntil === null) return 0
  return Math.max(0, Math.ceil((state.lockedUntil - now) / 1000))
}
