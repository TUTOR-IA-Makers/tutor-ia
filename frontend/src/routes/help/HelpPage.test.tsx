import { screen } from '@testing-library/react'
import { renderInRouter } from '@/test/render'
import { HelpPage } from './HelpPage'

describe('HelpPage', () => {
  it('explica estados, importação, glossário e status do servidor', async () => {
    renderInRouter(<HelpPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Ajuda' })).toBeInTheDocument()
    expect(screen.getByText('Falhou na verificação')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Como importar no Moodle' })).toBeInTheDocument()
    expect(screen.getByText('Dificuldade')).toBeInTheDocument()
    expect(await screen.findByText('Servidor ativo, versão mock')).toBeInTheDocument()
  })
})
