import { z } from 'zod/mini'

// Everything here runs before a request leaves the browser. It is a courtesy
// to the teacher, not a defence: the backend must repeat every rule, because
// anyone can call the API without this page.

export const EMAIL_MAX = 254
export const EMAIL_LOCAL_MAX = 64
export const PASSWORD_MIN = 10
export const PASSWORD_MAX = 128
export const NAME_MIN = 2
export const NAME_MAX = 100
export const INVITE_PATTERN = /^[A-Z0-9-]{6,32}$/

const LOCAL_PART = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/
const DOMAIN_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/
const TOP_LEVEL = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/

// Short on purpose: it catches the passwords people type first, not every
// leaked one. The backend owns the real check.
const COMMON_PASSWORDS = new Set([
  '0123456789',
  '1234567890',
  '12345678910',
  '1234554321',
  '1q2w3e4r5t',
  'abc1234567',
  'abcdefghij',
  'administrador',
  'codeexpert',
  'codeexpert1',
  'codeexpert123',
  'iloveyou123',
  'minhasenha',
  'minhasenha123',
  'password123',
  'password1234',
  'qwerty1234',
  'qwerty12345',
  'qwertyuiop',
  'senha12345',
  'senha123456',
  'senhasenha',
])

export function hasControlCharacter(value: string): boolean {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0
    if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) return true
  }
  return false
}

export function isValidEmail(value: string): boolean {
  if (value.length > EMAIL_MAX || /\s/.test(value) || hasControlCharacter(value)) return false
  const parts = value.split('@')
  if (parts.length !== 2) return false
  const [local = '', domain = ''] = parts
  if (local.length === 0 || local.length > EMAIL_LOCAL_MAX || !LOCAL_PART.test(local)) return false
  const labels = domain.split('.')
  if (labels.length < 2) return false
  const top = labels.at(-1) ?? ''
  return labels.every((label) => DOMAIN_LABEL.test(label)) && TOP_LEVEL.test(top)
}

export function isCommonPassword(password: string): boolean {
  const lowered = password.toLowerCase()
  return COMMON_PASSWORDS.has(lowered) || /^(.)\1+$/.test(password)
}

function sameAsEmail(password: string, email: string): boolean {
  const lowered = password.toLowerCase()
  const local = email.split('@')[0] ?? ''
  return lowered === email || (local.length > 0 && lowered === local)
}

function hasPasswordFields(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const fields = value as Record<string, unknown>
  return (
    typeof fields.email === 'string' &&
    typeof fields.password === 'string' &&
    typeof fields.confirmPassword === 'string'
  )
}

export interface PasswordRequirement {
  id: 'length' | 'email' | 'common'
  label: string
  met: boolean
}

export function passwordRequirements(password: string, email: string): PasswordRequirement[] {
  const normalized = email.trim().toLowerCase()
  return [
    {
      id: 'length',
      label: `Entre ${String(PASSWORD_MIN)} e ${String(PASSWORD_MAX)} caracteres`,
      met: password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX,
    },
    {
      id: 'email',
      label: 'Diferente do seu e-mail',
      met: password.length > 0 && !sameAsEmail(password, normalized),
    },
    {
      id: 'common',
      label: 'Fora da lista de senhas mais comuns',
      met: password.length > 0 && !isCommonPassword(password),
    },
  ]
}

const email = z.string().check(
  z.trim(),
  z.toLowerCase(),
  z.superRefine((value, ctx) => {
    if (value.length === 0) ctx.addIssue('Informe seu e-mail.')
    else if (value.length > EMAIL_MAX)
      ctx.addIssue(`O e-mail pode ter até ${String(EMAIL_MAX)} caracteres.`)
    else if (!isValidEmail(value))
      ctx.addIssue('Informe um e-mail válido, como nome@universidade.br.')
  }),
)

export const loginSchema = z.object({
  email,
  // Login only checks presence and an upper bound. Repeating the signup
  // policy here would tell a stranger what the accepted passwords look like.
  password: z
    .string()
    .check(
      z.minLength(1, 'Informe sua senha.'),
      z.maxLength(PASSWORD_MAX, `A senha pode ter até ${String(PASSWORD_MAX)} caracteres.`),
    ),
})

export const signupSchema = z
  .object({
    name: z.string().check(
      z.trim(),
      z.superRefine((value, ctx) => {
        if (value.length === 0) ctx.addIssue('Informe seu nome.')
        else if (value.length < NAME_MIN)
          ctx.addIssue(`O nome precisa ter pelo menos ${String(NAME_MIN)} caracteres.`)
        else if (value.length > NAME_MAX)
          ctx.addIssue(`O nome pode ter até ${String(NAME_MAX)} caracteres.`)
        else if (hasControlCharacter(value)) ctx.addIssue('O nome tem caracteres inválidos.')
      }),
    ),
    email,
    password: z.string().check(
      z.superRefine((value, ctx) => {
        if (value.length === 0) ctx.addIssue('Crie uma senha.')
        else if (value.length < PASSWORD_MIN)
          ctx.addIssue(`A senha precisa ter pelo menos ${String(PASSWORD_MIN)} caracteres.`)
        else if (value.length > PASSWORD_MAX)
          ctx.addIssue(`A senha pode ter até ${String(PASSWORD_MAX)} caracteres.`)
        else if (isCommonPassword(value)) ctx.addIssue('Essa senha é muito comum. Escolha outra.')
      }),
    ),
    confirmPassword: z.string(),
    inviteCode: z.string().check(
      z.trim(),
      z.toUpperCase(),
      z.superRefine((value, ctx) => {
        if (value.length === 0) ctx.addIssue('Informe o código de convite.')
        else if (!INVITE_PATTERN.test(value))
          ctx.addIssue('O código tem de 6 a 32 letras, números ou hífens.')
      }),
    ),
  })
  .check(
    z.superRefine(
      (values, ctx) => {
        if (values.password.length > 0 && sameAsEmail(values.password, values.email)) {
          ctx.addIssue({
            code: 'custom',
            message: 'A senha não pode ser igual ao seu e-mail.',
            path: ['password'],
            input: values.password,
          })
        }
        if (values.confirmPassword.length === 0) {
          ctx.addIssue({
            code: 'custom',
            message: 'Repita a senha.',
            path: ['confirmPassword'],
            input: values.confirmPassword,
          })
        } else if (values.confirmPassword !== values.password) {
          ctx.addIssue({
            code: 'custom',
            message: 'As senhas não são iguais.',
            path: ['confirmPassword'],
            input: values.confirmPassword,
          })
        }
      },
      // Zod skips object-level checks once any field has failed. Without this,
      // a mismatched confirmation stays hidden until name, e-mail and invite
      // are all valid, which is the opposite of feedback on blur.
      { when: ({ value }) => hasPasswordFields(value) },
    ),
  )

export type LoginValues = z.infer<typeof loginSchema>
export type SignupValues = z.infer<typeof signupSchema>

export const LOGIN_DEFAULTS: LoginValues = { email: '', password: '' }

export const SIGNUP_DEFAULTS: SignupValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  inviteCode: '',
}
