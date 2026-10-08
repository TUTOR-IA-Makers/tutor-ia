import { LibraryView } from '@/features/library'
import { useDocumentTitle } from '@/lib/dom'

export function LibraryPage() {
  useDocumentTitle('Biblioteca de questões')
  return <LibraryView />
}
