import { Check, CodeXml, Download, Info } from 'lucide-react'
import { Button, Callout, Dialog, Disclosure, Icon } from '@/components/ui'
import { contentLabel, describeDifficulty, type QuestionSummary } from '@/domain'
import { saveFile } from '@/lib/dom'
import { useExportMoodleXml } from '@/features/questions'
import { MoodleImportSteps } from './MoodleImportSteps'
import { selectionLabel } from './selectionLabel'
import styles from './ExportDialog.module.css'

export const EXPORT_FILENAME = 'questoes_codeexpert.xml'

export interface ExportDialogProps {
  open: boolean
  questions: readonly QuestionSummary[]
  onClose: () => void
}

export function ExportDialog({ open, questions, onClose }: ExportDialogProps) {
  const exportXml = useExportMoodleXml()

  const close = () => {
    exportXml.reset()
    onClose()
  }

  const download = () => {
    exportXml.mutate(
      questions.map((question) => question.id),
      { onSuccess: saveFile },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      icon={Download}
      title="Exportar questões"
      description="Baixe as questões aprovadas para importar no Moodle / Aprender3."
      footer={<Button onClick={close}>Voltar à biblioteca</Button>}
    >
      <Callout tone="info" icon={Check} title={selectionLabel(questions.length)}>
        <ul className={styles.list}>
          {questions.map((question) => (
            <li key={question.id}>
              {question.title}{' '}
              <span className={styles.meta}>
                ({contentLabel(question.contentId)} · {describeDifficulty(question.difficulty)})
              </span>
            </li>
          ))}
        </ul>
      </Callout>
      <div className={styles.file}>
        <span className={styles.fileIcon}>
          <Icon icon={CodeXml} size="md" />
        </span>
        <div className={styles.fileInfo}>
          <p className={styles.format}>Formato Moodle XML</p>
          <p className={styles.filename}>{exportXml.data?.filename ?? EXPORT_FILENAME}</p>
          <p className={styles.state} role="status">
            {exportXml.isSuccess ? 'XML exportado' : 'Arquivo pronto para download'}
          </p>
        </div>
        <Button
          variant="accent"
          icon={Download}
          isLoading={exportXml.isPending}
          disabled={questions.length === 0}
          onClick={download}
        >
          Baixar XML
        </Button>
      </div>
      <Disclosure framed icon={Info} summary="Como importar no Moodle">
        <MoodleImportSteps />
      </Disclosure>
    </Dialog>
  )
}
