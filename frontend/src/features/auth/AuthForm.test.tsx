import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RouteObject } from 'react-router'
import { HttpError } from '@/lib/http'
import { blockingViolations } from '@/test/axe'
import { renderRoutes } from '@/test/render'
import { withSession } from '@/test/services'
import type { SessionService } from '@/services'
import { ANALYTICS_EVENT } from '@/features/landing'
import { AUTH_MESSAGES } from './messages'
import { AuthForm } from './AuthForm'
import { MAX_FAILURES } from './attempts'

const ROUTES: RouteObject[] = [
  { path: '/entrar', element: <AuthForm mode="login" /> },
  { path: '/criar-conta', element: <AuthForm mode="signup" /> },
  { path: '/biblioteca', element: <h1>Biblioteca</h1> },
  { path: '/gerar', element: <h1>Gerar</h1> },
]

const PASSWORD = 'algoritmos-em-c'

type User = ReturnType<typeof userEvent.setup>

function setup(path = '/entrar', overrides: Parameters<typeof withSession>[0] = {}) {
  const user = userEvent.setup()
  const login = vi.fn<SessionService['login']>().mockResolvedValue(undefined)
  const register = vi.fn<SessionService['register']>().mockResolvedValue(undefined)
  const services = withSession({ login, register, ...overrides })
  const view = renderRoutes(ROUTES, path, { services })
  return { user, login, register, ...view }
}

async function fillLogin(user: User, email: string, password: string) {
  if (email) await user.type(screen.getByLabelText(/^E-mail/), email)
  if (password) await user.type(screen.getByLabelText(/^Senha/), password)
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('AuthForm: entrar', () => {
  it('mostra o erro no campo e não chama o serviço com e-mail inválido', async () => {
    const { user, login } = setup()
    await fillLogin(user, 'ana souza@universidade', PASSWORD)
    const email = screen.getByLabelText(/^E-mail/)
    expect(await screen.findByText(/Informe um e-mail válido/)).toBeInTheDocument()
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveFocus()
    expect(login).not.toHaveBeenCalled()
  })

  it('não chama o serviço com o formulário vazio', async () => {
    const { user, login } = setup()
    await fillLogin(user, '', '')
    expect(await screen.findByText('Informe seu e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('envia o e-mail normalizado e só os dois campos', async () => {
    const { user, login, router } = setup()
    await fillLogin(user, '  Ana@Universidade.BR ', PASSWORD)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/biblioteca')
    })
    expect(login).toHaveBeenCalledTimes(1)
    expect(login.mock.calls[0]?.[0]).toEqual({ email: 'ana@universidade.br', password: PASSWORD })
  })

  it('segue o parâmetro proximo quando ele aponta para dentro do app', async () => {
    const { user, router } = setup('/entrar?proximo=%2Fgerar')
    await fillLogin(user, 'ana@universidade.br', PASSWORD)
    expect(await screen.findByRole('heading', { name: 'Gerar' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/gerar')
  })

  it('ignora um proximo que aponta para outro site', async () => {
    const { user, router } = setup('/entrar?proximo=%2F%2Fevil.com')
    await fillLogin(user, 'ana@universidade.br', PASSWORD)
    expect(await screen.findByRole('heading', { name: 'Biblioteca' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/biblioteca')
  })

  it('mostra mensagem genérica no 401, sem repetir o detalhe do servidor', async () => {
    const { user } = setup('/entrar', {
      login: () => Promise.reject(new HttpError(401, 'Não existe conta com esse e-mail')),
    })
    await fillLogin(user, 'ana@universidade.br', PASSWORD)
    expect(await screen.findByRole('alert')).toHaveTextContent(AUTH_MESSAGES.loginRefused)
    expect(screen.queryByText(/Não existe conta/)).toBeNull()
  })

  it(`trava o envio depois de ${String(MAX_FAILURES)} falhas seguidas`, async () => {
    const login = vi.fn(() => Promise.reject(new HttpError(401, 'x')))
    const { user } = setup('/entrar', { login })
    await user.type(screen.getByLabelText(/^E-mail/), 'ana@universidade.br')
    await user.type(screen.getByLabelText(/^Senha/), PASSWORD)
    for (let attempt = 1; attempt <= MAX_FAILURES; attempt += 1) {
      await user.click(screen.getByRole('button', { name: 'Entrar' }))
      await waitFor(() => {
        expect(login).toHaveBeenCalledTimes(attempt)
      })
    }
    const locked = await screen.findByRole('button', { name: /^Aguarde \d+ s$/ })
    expect(locked).toBeDisabled()
    expect(screen.getByText(/Aguarde 30 segundos para/)).toBeInTheDocument()
    await user.click(locked)
    expect(login).toHaveBeenCalledTimes(MAX_FAILURES)
  })

  it('não coloca a senha em evento de analytics', async () => {
    const events: unknown[] = []
    const listen = (event: Event) => events.push((event as CustomEvent).detail)
    window.addEventListener(ANALYTICS_EVENT, listen)
    const { user, router } = setup()
    await fillLogin(user, 'ana@universidade.br', PASSWORD)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/biblioteca')
    })
    window.removeEventListener(ANALYTICS_EVENT, listen)
    expect(JSON.stringify(events)).not.toContain(PASSWORD)
  })

  it('o botão de mostrar senha alterna o tipo do campo e informa o estado', async () => {
    const { user } = setup()
    const password = screen.getByLabelText(/^Senha/)
    const toggle = screen.getByRole('button', { name: 'Mostrar senha' })
    expect(password).toHaveAttribute('type', 'password')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.click(toggle)
    expect(password).toHaveAttribute('type', 'text')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  it.each([
    ['Google', 'Entrar com Google'],
    ['GitHub', 'Entrar com GitHub'],
  ])('o botão de %s avisa que não está disponível e não faz requisição', async (label, name) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { user, login, register, router } = setup()
    await user.click(screen.getByRole('button', { name }))
    // The page also has the route announcer's live region, so look the
    // notice up by its text and check that it is the one announced.
    const notice = screen.getByText(
      `Entrar com ${label} ainda não está disponível. Use e-mail e senha.`,
    )
    expect(notice).toHaveAttribute('role', 'status')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(login).not.toHaveBeenCalled()
    expect(register).not.toHaveBeenCalled()
    expect(router.state.location.pathname).toBe('/entrar')
    fetchSpy.mockRestore()
  })

  it('não tem violações de acessibilidade bloqueantes', async () => {
    const { container } = setup()
    expect(await blockingViolations(container)).toEqual([])
  })
})

describe('AuthForm: criar conta', () => {
  async function fillSignup(user: User, invite = 'demo-2026') {
    await user.type(screen.getByLabelText(/^Nome completo/), 'Ana Souza')
    await user.type(screen.getByLabelText(/^E-mail/), 'ana@universidade.br')
    await user.type(screen.getByLabelText(/^Senha/), PASSWORD)
    await user.type(screen.getByLabelText(/^Confirme a senha/), PASSWORD)
    if (invite) await user.type(screen.getByLabelText(/^Código de convite/), invite)
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
  }

  it('envia o cadastro sem a confirmação e com o convite em maiúsculas', async () => {
    const { user, register, router } = setup('/criar-conta')
    await fillSignup(user)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/biblioteca')
    })
    expect(register.mock.calls[0]?.[0]).toEqual({
      name: 'Ana Souza',
      email: 'ana@universidade.br',
      password: PASSWORD,
      inviteCode: 'DEMO-2026',
    })
  })

  it('não chama o serviço sem convite', async () => {
    const { user, register } = setup('/criar-conta')
    await fillSignup(user, '')
    expect(await screen.findByText('Informe o código de convite.')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('mostra se as senhas não conferem', async () => {
    const { user, register } = setup('/criar-conta')
    await user.type(screen.getByLabelText(/^Senha/), PASSWORD)
    await user.type(screen.getByLabelText(/^Confirme a senha/), 'outra-coisa-1')
    await user.tab()
    expect(await screen.findByText('As senhas não são iguais.')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('atualiza a lista de requisitos enquanto a senha é digitada', async () => {
    const { user } = setup('/criar-conta')
    const list = screen.getByRole('list', { name: 'Requisitos da senha' })
    expect(list).toHaveTextContent(/Entre 10 e 128 caracteres\s*\(pendente\)/)
    await user.type(screen.getByLabelText(/^Senha/), PASSWORD)
    expect(list).toHaveTextContent(/Entre 10 e 128 caracteres\s*\(atendido\)/)
  })

  it('a recusa do cadastro não diz se o problema é o e-mail ou o convite', async () => {
    const { user } = setup('/criar-conta', {
      register: () => Promise.reject(new HttpError(409, 'E-mail já cadastrado')),
    })
    await fillSignup(user)
    expect(await screen.findByRole('alert')).toHaveTextContent(AUTH_MESSAGES.signupRefused)
    expect(screen.queryByText(/já cadastrado/)).toBeNull()
  })

  it('as abas levam de um modo ao outro e marcam o atual', async () => {
    const { user, router } = setup('/entrar')
    const nav = screen.getByRole('navigation', { name: 'Escolha como acessar' })
    expect(nav.querySelector('[aria-current="page"]')).toHaveTextContent('Entrar')
    await user.click(within(nav).getByRole('link', { name: 'Criar conta' }))
    expect(router.state.location.pathname).toBe('/criar-conta')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Criar sua conta' }),
    ).toBeInTheDocument()
  })
})
