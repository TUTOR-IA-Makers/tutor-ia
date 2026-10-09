import { render, screen } from '@testing-library/react'
import { describedBy } from './describedBy'
import { Field } from './Field'
import { FieldGroup } from './FieldGroup'

describe('Field', () => {
  it('liga rótulo, dica e erro ao controle', () => {
    render(
      <Field label="Conteúdo" hint="Escolha um" error="Campo obrigatório" required>
        {(control) => <input {...control} />}
      </Field>,
    )
    const input = screen.getByRole('textbox', { name: 'Conteúdo' })
    expect(input).toHaveAccessibleDescription('Escolha um Campo obrigatório')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-required', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Campo obrigatório')
  })

  it('marca campo opcional e não descreve sem dica', () => {
    render(
      <Field label="Contexto" optional>
        {(control) => <input {...control} />}
      </Field>,
    )
    const input = screen.getByRole('textbox', { name: /^Contexto\s*\(opcional\)$/ })
    expect(input).not.toHaveAttribute('aria-describedby')
    expect(input).not.toHaveAttribute('aria-invalid')
  })
})

describe('FieldGroup', () => {
  it('agrupa controles sob uma legenda descrita', () => {
    render(
      <FieldGroup legend="Dificuldade" hint="De 500 a 3500" error="Faixa inválida">
        {(id) => <input aria-label="mínima" aria-describedby={id} />}
      </FieldGroup>,
    )
    expect(screen.getByRole('group', { name: 'Dificuldade' })).toHaveAccessibleDescription(
      'De 500 a 3500 Faixa inválida',
    )
    expect(screen.getByRole('textbox', { name: 'mínima' })).toHaveAccessibleDescription(
      'De 500 a 3500 Faixa inválida',
    )
  })

  it('sem dica nem erro não descreve', () => {
    render(
      <FieldGroup legend="Grupo">{(id) => <span data-testid="id">{String(id)}</span>}</FieldGroup>,
    )
    expect(screen.getByTestId('id')).toHaveTextContent('undefined')
  })
})

describe('describedBy', () => {
  it('junta ids e descarta vazios', () => {
    expect(describedBy('a', false, undefined, 'b')).toBe('a b')
    expect(describedBy(false)).toBeUndefined()
  })
})
