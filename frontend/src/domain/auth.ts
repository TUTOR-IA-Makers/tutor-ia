// What the teacher types to get a session. These are plain data: the rules
// that decide whether a value is acceptable live in features/auth/schema.ts,
// and the backend repeats every one of them.
export interface LoginCredentials {
  email: string
  password: string
}

export interface Registration {
  name: string
  email: string
  password: string
  inviteCode: string
}
