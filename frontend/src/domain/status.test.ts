import { QUESTION_STATUSES } from './question'
import { can, STATUS } from './status'

describe('status', () => {
  it('tem rótulo em linguagem do professor para todo estado', () => {
    for (const status of QUESTION_STATUSES) expect(STATUS[status].label).not.toMatch(/_/)
  })

  it('segue o mapa de ações por estado', () => {
    expect(can('GERANDO', 'approve')).toBe(false)
    expect(can('GERADA', 'approve')).toBe(true)
    expect(can('GERADA', 'reject')).toBe(true)
    expect(can('FALHOU_VERIFICACAO', 'regenerate')).toBe(true)
    expect(can('FALHOU_VERIFICACAO', 'approve')).toBe(false)
    expect(can('APROVADA', 'export')).toBe(true)
    expect(can('APROVADA', 'edit')).toBe(true)
    expect(can('REJEITADA', 'regenerate')).toBe(true)
  })
})
