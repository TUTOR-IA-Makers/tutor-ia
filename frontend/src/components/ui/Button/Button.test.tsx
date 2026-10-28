import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Plus } from 'lucide-react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { blockingViolations } from '@/test/axe'
import { Button } from './Button'
import { LinkButton } from './LinkButton'

describe('Button', () => {
  it('é type="button" por padrão para não submeter formulários sem querer', () => {
    render(<Button>Salvar</Button>)
    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('type', 'button')
  })

  it.each(['primary', 'accent', 'secondary', 'danger', 'ghost'] as const)(
    'aplica a variante %s',
    (variant) => {
      render(<Button variant={variant}>Ação</Button>)
      expect(screen.getByRole('button')).toHaveClass('button', variant, 'md')
    },
  )

  it('mostra ícone decorativo sem poluir o nome acessível', () => {
    render(
      <Button icon={Plus} size="lg">
        Gerar questão
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Gerar questão' })
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(button).toHaveClass('lg')
  })

  it('aceita ícone no fim', () => {
    render(
      <Button icon={Plus} iconPosition="end">
        Próximo
      </Button>,
    )
    expect(screen.getByRole('button').lastElementChild?.tagName.toLowerCase()).toBe('svg')
  })

  it('fica ocupado e desabilitado enquanto carrega', () => {
    render(<Button isLoading>Aprovar</Button>)
    const button = screen.getByRole('button', { name: 'Aprovar' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('continua desabilitado enquanto carrega mesmo com disabled={false}', () => {
    render(
      <Button isLoading disabled={false}>
        Baixar XML
      </Button>,
    )
    expect(screen.getByRole('button', { name: 'Baixar XML' })).toBeDisabled()
  })

  it('dispara onClick pelo teclado', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Aprovar</Button>)
    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('não dispara onClick desabilitado', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Exportar
      </Button>,
    )
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('não tem violações sérias de acessibilidade', async () => {
    const { container } = render(<Button variant="accent">Exportar XML</Button>)
    expect(await blockingViolations(container)).toEqual([])
  })
})

describe('LinkButton', () => {
  it('é um link com aparência de botão', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <LinkButton to="/gerar" variant="primary" icon={Plus} block>
            Gerar questão
          </LinkButton>
        ),
      },
    ])
    render(<RouterProvider router={router} />)
    const link = screen.getByRole('link', { name: 'Gerar questão' })
    expect(link).toHaveAttribute('href', '/gerar')
    expect(link).toHaveClass('button', 'primary', 'block')
  })
})
