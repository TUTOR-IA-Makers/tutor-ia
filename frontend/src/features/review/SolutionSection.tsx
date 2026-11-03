import { FileCode2 } from 'lucide-react'
import { Callout, CodeViewer, Icon } from '@/components/ui'
import type { Question } from '@/domain'
import styles from './SolutionSection.module.css'

export interface SolutionSectionProps {
  question: Pick<Question, 'solution' | 'compilation'>
}

export function SolutionSection({ question }: SolutionSectionProps) {
  const { solution, compilation } = question
  return (
    <section className={styles.section} aria-labelledby="solution-title">
      <h2 id="solution-title" className={styles.title}>
        <Icon icon={FileCode2} size="md" />
        Solução em C
      </h2>
      {solution ? (
        <CodeViewer
          code={solution}
          filename="solucao.c"
          label="Código da solução em C"
          terminal={
            compilation && {
              command: compilation.command,
              output: compilation.message,
              succeeded: compilation.succeeded,
            }
          }
        />
      ) : (
        <Callout tone="warning" title="Solução indisponível">
          A solução ainda não foi gerada.
        </Callout>
      )}
    </section>
  )
}
