import { Check, FileDown } from 'lucide-react'
import { Icon } from '@/components/ui'
import { cx } from '@/lib/cx'
import { tokenizeC } from '@/lib/syntax'
import styles from './HeroScene.module.css'
import { usePointerTilt } from './usePointerTilt'

// Decorative: a stack of the artefacts the product makes, floating at different depths.
// The values come from the demo question (outputs obtained by running gcc).
const CODE = [
  'int ano;',
  'scanf("%d", &ano);',
  '',
  'if (ano % 400 == 0 ||',
  '    (ano % 4 == 0 && ano % 100 != 0))',
  '    printf("BISSEXTO");',
]

const ROWS = [
  ['2024', 'BISSEXTO'],
  ['1900', 'NAO BISSEXTO'],
  ['2000', 'BISSEXTO'],
] as const

export function HeroScene() {
  const ref = usePointerTilt<HTMLDivElement>()

  return (
    <div ref={ref} className={styles.stage} aria-hidden="true">
      <div className={styles.scene}>
        <div className={cx(styles.layer, styles.statement)}>
          <span className={styles.tag}>Enunciado</span>
          <strong>Ano bissexto</strong>
          <span className={styles.muted}>Condicionais</span>
        </div>

        <div className={cx(styles.layer, styles.code)}>
          <span className={styles.tag}>solucao.c</span>
          <pre className={styles.pre}>
            {CODE.map((line, index) => (
              <span key={index}>
                {tokenizeC(line)[0]?.map((token, position) => (
                  <span key={position} className={styles[token.kind]}>
                    {token.text}
                  </span>
                ))}
                {'\n'}
              </span>
            ))}
          </pre>
        </div>

        <div className={cx(styles.layer, styles.tests)}>
          <span className={styles.tag}>Saída obtida ao executar</span>
          {ROWS.map(([input, output]) => (
            <span key={input} className={styles.row}>
              <span className={styles.muted}>{input}</span>
              <span>{output}</span>
              <Icon icon={Check} className={styles.check} />
            </span>
          ))}
        </div>

        <div className={cx(styles.layer, styles.file)}>
          <Icon icon={FileDown} size="md" />
          Moodle XML
        </div>
      </div>
    </div>
  )
}
