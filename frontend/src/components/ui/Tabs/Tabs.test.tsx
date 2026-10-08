import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileText } from 'lucide-react'
import { useState } from 'react'
import { blockingViolations } from '@/test/axe'
import { Tab, TabList, TabPanel, Tabs } from './Tabs'

function Harness() {
  const [value, setValue] = useState('a')
  return (
    <Tabs value={value} onChange={setValue}>
      <TabList label="Seções">
        <Tab value="a" icon={FileText}>
          Enunciado
        </Tab>
        <Tab value="b" badge={6}>
          Casos
        </Tab>
        <Tab value="c">Escopo</Tab>
      </TabList>
      <TabPanel value="a">Painel A</TabPanel>
      <TabPanel value="b">Painel B</TabPanel>
      <TabPanel value="c">Painel C</TabPanel>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('liga aba e painel e mostra só o painel ativo', () => {
    render(<Harness />)
    const tab = screen.getByRole('tab', { name: 'Enunciado' })
    expect(tab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Enunciado' })).toHaveTextContent('Painel A')
    expect(screen.queryByText('Painel B')).toBeNull()
    expect(screen.getByRole('tab', { name: /Casos/ })).toHaveAttribute('tabindex', '-1')
  })

  it('troca de aba no clique', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('tab', { name: /Casos/ }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Painel B')
  })

  it('navega pelas setas, Home e End com foco móvel', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.tab()
    expect(screen.getByRole('tab', { name: 'Enunciado' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: /Casos/ })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Painel B')
    await user.keyboard('{End}')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Painel C')
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Painel A')
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Painel C')
    await user.keyboard('{Home}')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Painel A')
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Painel A')
  })

  it('falha com mensagem clara fora de <Tabs>', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => render(<Tab value="x">x</Tab>)).toThrow(/dentro de <Tabs>/)
  })

  it('não tem violações sérias de acessibilidade', async () => {
    const { container } = render(<Harness />)
    expect(await blockingViolations(container)).toEqual([])
  })
})
