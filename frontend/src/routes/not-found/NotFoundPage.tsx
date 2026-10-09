import { ArrowLeft, MapPinOff } from 'lucide-react'
import { useLocation } from 'react-router'
import { EmptyState, LinkButton } from '@/components/ui'
import { useDocumentTitle } from '@/lib/dom'

export function NotFoundPage() {
  const { pathname } = useLocation()
  useDocumentTitle('Página não encontrada')
  return (
    <EmptyState
      icon={MapPinOff}
      headingLevel={1}
      title="Página não encontrada"
      description={
        <>
          Não existe nada em <code>{pathname}</code>. Confira o endereço ou volte para a biblioteca.
        </>
      }
      action={
        <LinkButton to="/biblioteca" variant="primary" icon={ArrowLeft}>
          Voltar à biblioteca
        </LinkButton>
      }
    />
  )
}
