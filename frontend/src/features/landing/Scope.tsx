import { Check, X } from 'lucide-react'
import { Icon } from '@/components/ui'
import { cx } from '@/lib/cx'
import styles from './Scope.module.css'

const DOES = [
  'Gera o enunciado, a solução de referência em C e as entradas dos casos de teste.',
  'Compila e executa a solução para obter a saída esperada de cada caso.',
  'Mostra tudo para você revisar antes de virar questão.',
  'Exporta as questões em XML no formato CodeRunner, pronto para importar no Moodle.',
]

const DOES_NOT = [
  {
    title: 'Não é juiz automático.',
    text: 'Não recebe nem corrige o código dos alunos. Quem corrige as respostas é o CodeRunner, dentro do seu Moodle.',
  },
  {
    title: 'Não dá nota.',
    text: 'Não avalia alunos nem turmas. A nota continua sendo definida por você no questionário.',
  },
  {
    title: 'Não publica nada sozinho.',
    text: 'Nenhuma questão chega à turma sem que você revise e importe o XML.',
  },
]

export function Scope() {
  return (
    <section id="o-que-nao-faz" className={styles.section} aria-labelledby="escopo-titulo">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Escopo</p>
        <h2 id="escopo-titulo" className={styles.title}>
          O que o CodeExpert faz e o que não faz
        </h2>
        <p className={styles.lead}>
          Ele prepara questões para você. A sala de aula, a correção e a nota continuam com você e
          com o Moodle.
        </p>
      </header>
      <div className={styles.columns}>
        <div className={cx(styles.column, styles.does)}>
          <h3 className={styles.columnTitle}>Faz</h3>
          <ul className={styles.list}>
            {DOES.map((item) => (
              <li key={item} className={styles.item}>
                <span className={styles.markerDoes}>
                  <Icon icon={Check} />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={cx(styles.column, styles.doesNot)}>
          <h3 className={styles.columnTitle}>Não faz</h3>
          <ul className={styles.list}>
            {DOES_NOT.map((item) => (
              <li key={item.title} className={styles.item}>
                <span className={styles.markerDoesNot}>
                  <Icon icon={X} />
                </span>
                <span>
                  <strong>{item.title}</strong> {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
