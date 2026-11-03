import { render, screen } from '@testing-library/react'
import { DescriptionList } from './DescriptionList'

describe('DescriptionList', () => {
  it('associa termos e valores', () => {
    render(
      <DescriptionList
        items={[
          { term: 'Conteúdo', value: 'Condicionais' },
          { term: 'Casos de teste', value: 6 },
        ]}
      />,
    )
    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'Conteúdo',
      'Casos de teste',
    ])
    expect(screen.getAllByRole('definition').map((value) => value.textContent)).toEqual([
      'Condicionais',
      '6',
    ])
  })
})
