import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NetworkError } from '@/lib/http'
import { createTestServices, renderInRouter } from '@/test/render'
import { UserMenu } from './UserMenu'

const CACHED_KEY = ['questions', 'detail', 'q-0142']

describe('UserMenu', () => {
  it('mostra nome, departamento e iniciais do professor da sessão', async () => {
    renderInRouter(<UserMenu />)
    expect(await screen.findByText('Profa. Dra. Helena Silveira')).toBeInTheDocument()
    expect(screen.getByText('Ciência da Computação')).toBeInTheDocument()
    expect(screen.getByText('HS')).toBeInTheDocument()
  })

  it('abre o menu, fecha com Escape e com clique fora', async () => {
    const user = userEvent.setup()
    renderInRouter(<UserMenu />)
    const trigger = await screen.findByRole('button', { name: /Menu da conta/ })
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.click(trigger)
    await user.click(document.body)
    expect(screen.queryByRole('button', { name: 'Sair' })).toBeNull()
  })

  it('encerra a sessão, apaga o cache e volta ao início', async () => {
    const user = userEvent.setup()
    const { services, client, router } = renderInRouter(<UserMenu />, '/biblioteca')
    client.setQueryData(CACHED_KEY, { id: 'q-0142' })
    const logout = vi.spyOn(services.session, 'logout')
    await user.click(await screen.findByRole('button', { name: /Menu da conta/ }))
    await user.click(screen.getByRole('button', { name: 'Sair' }))
    expect(logout).toHaveBeenCalledOnce()
    expect(await screen.findByText('Sessão encerrada')).toBeInTheDocument()
    expect(client.getQueryData(CACHED_KEY)).toBeUndefined()
    expect(router.state.location.pathname).toBe('/')
  })

  it('avisa quando não consegue encerrar a sessão e mantém os dados', async () => {
    const user = userEvent.setup()
    const base = createTestServices()
    const services = {
      ...base,
      session: { ...base.session, logout: () => Promise.reject(new NetworkError('x')) },
    }
    const { client } = renderInRouter(<UserMenu />, '/', { services })
    client.setQueryData(CACHED_KEY, { id: 'q-0142' })
    await user.click(await screen.findByRole('button', { name: /Menu da conta/ }))
    await user.click(screen.getByRole('button', { name: 'Sair' }))
    expect(await screen.findByText('Sem conexão')).toBeInTheDocument()
    expect(screen.queryByText('Sessão encerrada')).toBeNull()
    expect(client.getQueryData(CACHED_KEY)).toEqual({ id: 'q-0142' })
  })
})
