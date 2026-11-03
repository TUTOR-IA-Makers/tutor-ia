import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Download } from 'lucide-react'
import { useState } from 'react'
import { Dialog } from './Dialog'

function Harness({ onClose = () => undefined }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
        }}
      >
        Abrir
      </button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false)
          onClose()
        }}
        icon={Download}
        title="Exportar questões"
        description="Baixe o XML"
        footer={<button type="button">Rodapé</button>}
      >
        <p>Conteúdo do modal</p>
      </Dialog>
    </>
  )
}

describe('Dialog', () => {
  it('abre como modal nomeado e descrito', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.queryByText('Conteúdo do modal')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    const dialog = screen.getByRole('dialog', { name: 'Exportar questões' })
    expect(dialog).toHaveAttribute('open')
    expect(dialog).toHaveAccessibleDescription('Baixe o XML')
    expect(screen.getByText('Conteúdo do modal')).toBeInTheDocument()
  })

  it('fecha pelo botão Fechar e avisa quem abriu', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalled()
    expect(screen.queryByText('Conteúdo do modal')).toBeNull()
  })
})
