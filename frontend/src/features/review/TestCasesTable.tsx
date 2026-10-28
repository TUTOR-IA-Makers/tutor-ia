import { ListChecks } from 'lucide-react'
import { Icon, StatusBadge } from '@/components/ui'
import { passedCount, type TestCase } from '@/domain'
import styles from './TestCasesTable.module.css'

export interface TestCasesTableProps {
  testCases: readonly TestCase[]
}

function Result({ passed }: { passed: boolean | null }) {
  if (passed === null) return <StatusBadge tone="neutral">Não executado</StatusBadge>
  return passed ? (
    <StatusBadge tone="success">Passou</StatusBadge>
  ) : (
    <StatusBadge tone="danger">Falhou</StatusBadge>
  )
}

export function TestCasesTable({ testCases }: TestCasesTableProps) {
  return (
    <section className={styles.section} aria-labelledby="tests-title">
      <header className={styles.header}>
        <h2 id="tests-title" className={styles.title}>
          <Icon icon={ListChecks} size="md" />
          Casos de teste
        </h2>
        <p className={styles.summary}>
          {passedCount(testCases)} de {testCases.length} passaram
        </p>
      </header>
      <div className={styles.scroller} tabIndex={0} role="region" aria-labelledby="tests-title">
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Caso</th>
              <th scope="col">Entrada</th>
              <th scope="col">Saída esperada</th>
              <th scope="col">Saída obtida</th>
              <th scope="col">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {testCases.map((testCase, index) => (
              <tr key={testCase.id}>
                <th scope="row">{index + 1}</th>
                <td>
                  <pre className={styles.value}>{testCase.input}</pre>
                </td>
                <td>
                  <pre className={styles.value}>{testCase.expectedOutput}</pre>
                </td>
                <td>
                  <pre className={styles.value}>{testCase.actualOutput ?? '—'}</pre>
                </td>
                <td>
                  <Result passed={testCase.passed} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
