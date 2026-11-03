import { Check, UserCheck } from 'lucide-react'
import { Icon } from '@/components/ui'
import { cx } from '@/lib/cx'
import styles from './Scope.module.css'
import { SectionHeader } from './SectionHeader'
import { useReveal } from './useReveal'

const PREPARES = [
  'Enunciados.',
  'Soluções de referência em C.',
  'Casos de teste.',
  'Saídas verificadas por execução.',
  'Arquivos XML para Moodle/CodeRunner.',
]

const CONTROL = [
  'Revisão das questões.',
  'Publicação dos exercícios.',
  'Configuração dos questionários.',
  'Correção das respostas, feita pelo CodeRunner no seu Moodle.',
  'Avaliação e atribuição de notas.',
]

export function Scope() {
  const { ref, revealed } = useReveal<HTMLDivElement>()

  return (
    <section id="o-que-nao-faz" className={styles.section} aria-labelledby="escopo-titulo">
      <SectionHeader
        id="escopo-titulo"
        eyebrow="Escopo"
        title="Uma ferramenta para preparar suas questões. O controle continua com você."
        lead="O CodeExpert não corrige respostas de alunos e não atribui notas: isso continua no Moodle e com você."
      />
      <div ref={ref} className={styles.columns}>
        <div className={cx(styles.column, styles.prepares, revealed && styles.revealed)}>
          <h3 className={styles.columnTitle}>O CodeExpert prepara</h3>
          <ul className={styles.list}>
            {PREPARES.map((item) => (
              <li key={item} className={styles.item}>
                <span className={styles.markerPrepares}>
                  <Icon icon={Check} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className={cx(styles.column, styles.control, revealed && styles.revealed)}>
          <h3 className={styles.columnTitle}>Você mantém o controle sobre</h3>
          <ul className={styles.list}>
            {CONTROL.map((item) => (
              <li key={item} className={styles.item}>
                <span className={styles.markerControl}>
                  <Icon icon={UserCheck} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
