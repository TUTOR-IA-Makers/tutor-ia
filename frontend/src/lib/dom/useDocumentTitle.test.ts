import { renderHook } from '@testing-library/react'
import { formatTitle, useDocumentTitle } from './useDocumentTitle'

describe('useDocumentTitle', () => {
  it('formata o título com o nome do produto', () => {
    expect(formatTitle('Ajuda')).toBe('Ajuda · CodeExpert')
    expect(formatTitle()).toBe('CodeExpert')
  })

  it('atualiza document.title', () => {
    renderHook(() => {
      useDocumentTitle('Biblioteca de questões')
    })
    expect(document.title).toBe('Biblioteca de questões · CodeExpert')
  })
})
