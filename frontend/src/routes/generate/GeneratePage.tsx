import { PageHeader } from '@/components/ui'
import { GenerateForm } from '@/features/generate'
import { useDocumentTitle } from '@/lib/dom'
import styles from './GeneratePage.module.css'

export function GeneratePage() {
  useDocumentTitle('Configurar nova questão')
  return (
    <div className={styles.page}>
      <PageHeader
        title="Configurar nova questão"
        description="Escolha o conteúdo e as regras do exercício."
      />
      <GenerateForm />
    </div>
  )
}
