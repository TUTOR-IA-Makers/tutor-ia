import { FileInput, FileOutput, FileText, Pencil, SquareTerminal } from 'lucide-react'
import { useState } from 'react'
import { Button, Field, Icon, Textarea } from '@/components/ui'
import type { Statement } from '@/domain'
import styles from './StatementSection.module.css'

export interface StatementSectionProps {
  statement: Statement
  editable: boolean
  saving: boolean
  onSave: (statement: Statement, onSaved: () => void) => void
}

export function StatementSection({ statement, editable, saving, onSave }: StatementSectionProps) {
  const [draft, setDraft] = useState<Statement | null>(null)

  return (
    <section className={styles.section} aria-labelledby="statement-title">
      <header className={styles.header}>
        <h2 id="statement-title" className={styles.title}>
          <Icon icon={FileText} size="md" />
          Enunciado da questão
        </h2>
        {editable && !draft && (
          <Button
            icon={Pencil}
            onClick={() => {
              setDraft(statement)
            }}
          >
            Editar
          </Button>
        )}
      </header>
      {draft ? (
        <form
          className={styles.editor}
          onSubmit={(event) => {
            event.preventDefault()
            onSave(draft, () => {
              setDraft(null)
            })
          }}
        >
          <Field label="Texto do enunciado" required>
            {(field) => (
              <Textarea
                {...field}
                rows={6}
                value={draft.text}
                onChange={(event) => {
                  setDraft({ ...draft, text: event.target.value })
                }}
              />
            )}
          </Field>
          <Field label="Entrada">
            {(field) => (
              <Textarea
                {...field}
                rows={2}
                value={draft.input}
                onChange={(event) => {
                  setDraft({ ...draft, input: event.target.value })
                }}
              />
            )}
          </Field>
          <Field label="Saída">
            {(field) => (
              <Textarea
                {...field}
                rows={2}
                value={draft.output}
                onChange={(event) => {
                  setDraft({ ...draft, output: event.target.value })
                }}
              />
            )}
          </Field>
          <div className={styles.editorActions}>
            <Button
              onClick={() => {
                setDraft(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              disabled={!draft.text.trim()}
            >
              Salvar enunciado
            </Button>
          </div>
        </form>
      ) : (
        <StatementBody statement={statement} />
      )}
    </section>
  )
}

function StatementBody({ statement }: { statement: Statement }) {
  return (
    <>
      <div className={styles.text}>
        {statement.text.split(/\n{2,}/).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className={styles.io}>
        <div className={styles.ioBox}>
          <p className={styles.ioLabel}>
            <Icon icon={FileInput} />
            Entrada
          </p>
          <p>{statement.input}</p>
        </div>
        <div className={styles.ioBox}>
          <p className={styles.ioLabel}>
            <Icon icon={FileOutput} />
            Saída
          </p>
          <p>{statement.output}</p>
        </div>
      </div>
      {statement.example && (
        <div className={styles.example}>
          <p className={styles.exampleTitle}>
            <Icon icon={SquareTerminal} />
            Exemplo de execução
          </p>
          <div className={styles.exampleGrid}>
            <div className={styles.exampleCell}>
              <span className={styles.exampleLabel}>Entrada</span>
              <pre className={styles.sample}>{statement.example.input}</pre>
            </div>
            <div className={styles.exampleCell}>
              <span className={styles.exampleLabel}>Saída esperada</span>
              <pre className={styles.sample}>{statement.example.output}</pre>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
