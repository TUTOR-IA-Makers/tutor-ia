import {
  EMAIL_MAX,
  isValidEmail,
  loginSchema,
  passwordRequirements,
  PASSWORD_MAX,
  signupSchema,
} from './schema'

const VALID_SIGNUP = {
  name: 'Ana Souza',
  email: 'ana@universidade.br',
  password: 'algoritmos-em-c',
  confirmPassword: 'algoritmos-em-c',
  inviteCode: 'DEMO-2026',
}

interface Parsed {
  error?: { issues: { path: PropertyKey[]; message: string }[] }
}

function messages(result: Parsed) {
  return (result.error?.issues ?? []).map((issue) => [issue.path.join('.'), issue.message])
}

describe('isValidEmail', () => {
  it.each([
    'ana@universidade.br',
    'ana.souza+turma2@dcc.exemplo.br',
    'a@b.co',
    'prof_01@exemplo.com',
  ])('aceita %s', (email) => {
    expect(isValidEmail(email)).toBe(true)
  })

  it.each([
    ['vazio', ''],
    ['sem arroba', 'ana.universidade.br'],
    ['dois arrobas', 'ana@@universidade.br'],
    ['arroba no domínio', 'ana@uni@versidade.br'],
    ['espaço no meio', 'ana souza@universidade.br'],
    ['sem domínio de topo', 'ana@universidade'],
    ['domínio de topo numérico', 'ana@universidade.123'],
    ['ponto no início', '.ana@universidade.br'],
    ['pontos seguidos', 'ana..souza@universidade.br'],
    ['rótulo com hífen na borda', 'ana@-universidade.br'],
    ['caractere de controle', 'ana\u0000@universidade.br'],
    ['parte local longa demais', `${'a'.repeat(65)}@universidade.br`],
    ['endereço longo demais', `ana@${'a'.repeat(EMAIL_MAX)}.br`],
  ])('recusa %s', (_case, email) => {
    expect(isValidEmail(email)).toBe(false)
  })
})

describe('loginSchema', () => {
  it('apara e põe em minúsculas o e-mail antes de enviar', () => {
    const result = loginSchema.safeParse({ email: '  Ana@Universidade.BR ', password: 'x' })
    expect(result.success && result.data.email).toBe('ana@universidade.br')
  })

  it('não apara a senha: espaços fazem parte dela', () => {
    const result = loginSchema.safeParse({ email: 'ana@universidade.br', password: ' abc ' })
    expect(result.success && result.data.password).toBe(' abc ')
  })

  it('exige os dois campos, com uma mensagem por campo', () => {
    const result = loginSchema.safeParse({ email: '', password: '' })
    expect(messages(result)).toEqual([
      ['email', 'Informe seu e-mail.'],
      ['password', 'Informe sua senha.'],
    ])
  })

  it('não aplica a política de cadastro no login', () => {
    const result = loginSchema.safeParse({ email: 'ana@universidade.br', password: '123' })
    expect(result.success).toBe(true)
  })

  it('recusa senha acima do limite', () => {
    const result = loginSchema.safeParse({
      email: 'ana@universidade.br',
      password: 'a'.repeat(PASSWORD_MAX + 1),
    })
    expect(result.success).toBe(false)
  })
})

describe('signupSchema', () => {
  it('aceita um cadastro válido e normaliza e-mail, nome e convite', () => {
    const result = signupSchema.safeParse({
      ...VALID_SIGNUP,
      name: '  Ana Souza ',
      email: 'ANA@Universidade.br',
      inviteCode: ' demo-2026 ',
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.name).toBe('Ana Souza')
    expect(result.data.email).toBe('ana@universidade.br')
    expect(result.data.inviteCode).toBe('DEMO-2026')
  })

  it.each([
    ['curta', 'abc12345', 'A senha precisa ter pelo menos 10 caracteres.'],
    ['comum', 'qwertyuiop', 'Essa senha é muito comum. Escolha outra.'],
    ['um caractere repetido', 'aaaaaaaaaaaa', 'Essa senha é muito comum. Escolha outra.'],
  ])('recusa senha %s', (_case, password, message) => {
    const result = signupSchema.safeParse({ ...VALID_SIGNUP, password, confirmPassword: password })
    expect(messages(result)).toContainEqual(['password', message])
  })

  it('recusa senha igual ao e-mail', () => {
    const password = 'ana.souza@universidade.br'
    const result = signupSchema.safeParse({
      ...VALID_SIGNUP,
      email: password,
      password,
      confirmPassword: password,
    })
    const message = 'A senha não pode ser igual ao seu e-mail.'
    expect(messages(result)).toContainEqual(['password', message])
  })

  it('exige a confirmação igual à senha', () => {
    const result = signupSchema.safeParse({ ...VALID_SIGNUP, confirmPassword: 'outra-senha-1' })
    expect(messages(result)).toEqual([['confirmPassword', 'As senhas não são iguais.']])
  })

  it('aponta a confirmação diferente mesmo com outros campos vazios', () => {
    const result = signupSchema.safeParse({
      ...VALID_SIGNUP,
      name: '',
      inviteCode: '',
      confirmPassword: 'outra-senha-1',
    })
    expect(messages(result)).toContainEqual(['confirmPassword', 'As senhas não são iguais.'])
  })

  it.each([
    ['vazio', '', 'Informe o código de convite.'],
    ['curto', 'ABC', 'O código tem de 6 a 32 letras, números ou hífens.'],
    ['com símbolo', 'DEMO_2026', 'O código tem de 6 a 32 letras, números ou hífens.'],
    ['longo', 'A'.repeat(33), 'O código tem de 6 a 32 letras, números ou hífens.'],
  ])('recusa convite %s', (_case, inviteCode, message) => {
    const result = signupSchema.safeParse({ ...VALID_SIGNUP, inviteCode })
    expect(messages(result)).toEqual([['inviteCode', message]])
  })

  it('recusa nome com caractere de controle', () => {
    const result = signupSchema.safeParse({ ...VALID_SIGNUP, name: 'Ana\u0007Souza' })
    expect(messages(result)).toEqual([['name', 'O nome tem caracteres inválidos.']])
  })
})

describe('passwordRequirements', () => {
  it('começa com tudo pendente', () => {
    expect(passwordRequirements('', '').every(({ met }) => !met)).toBe(true)
  })

  it('marca cada regra conforme a senha muda', () => {
    const met = (password: string, email = 'ana@universidade.br') =>
      Object.fromEntries(passwordRequirements(password, email).map(({ id, met }) => [id, met]))
    expect(met('curta')).toEqual({ length: false, email: true, common: true })
    expect(met('qwertyuiop')).toEqual({ length: true, email: true, common: false })
    expect(met('ana@universidade.br')).toEqual({ length: true, email: false, common: true })
    expect(met('algoritmos-em-c')).toEqual({ length: true, email: true, common: true })
  })
})
