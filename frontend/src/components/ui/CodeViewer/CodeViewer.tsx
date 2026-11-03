import { Check, Copy, FileCode2, SquareTerminal } from 'lucide-react'
import { useMemo } from 'react'
import { cx } from '@/lib/cx'
import { tokenizeC } from '@/lib/syntax'
import { Icon } from '../Icon'
import styles from './CodeViewer.module.css'
import { useCopy } from './useCopy'

export interface TerminalRun {
  command: string
  output: string
  succeeded: boolean
}

export interface CodeViewerProps {
  code: string
  filename: string
  language?: string
  label?: string
  terminal?: TerminalRun | null
}

const COPY_LABEL = { idle: 'Copiar', copied: 'Copiado', failed: 'Não foi possível copiar' }

export function CodeViewer({
  code,
  filename,
  language = 'C',
  label = `Código de ${filename}`,
  terminal,
}: CodeViewerProps) {
  const lines = useMemo(() => tokenizeC(code.replace(/\n$/, '')), [code])
  const { state, copy } = useCopy()

  return (
    <figure className={styles.window}>
      <figcaption className={styles.titlebar}>
        <span className={styles.dots} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className={styles.tab}>
          <Icon icon={FileCode2} />
          {filename}
        </span>
        <span className={styles.language}>{language}</span>
        <button
          type="button"
          className={styles.copy}
          onClick={() => {
            void copy(code)
          }}
        >
          <Icon icon={state === 'copied' ? Check : Copy} />
          {COPY_LABEL[state]}
        </button>
      </figcaption>
      <pre className={styles.editor} tabIndex={0} aria-label={label}>
        <code className={styles.code}>
          {lines.map((tokens, index) => (
            <span key={index} className={styles.line}>
              <span className={styles.gutter} aria-hidden="true">
                {index + 1}
              </span>
              <span className={styles.content}>
                {tokens.map((token, position) => (
                  <span key={position} className={cx(styles[token.kind])} data-token={token.kind}>
                    {token.text}
                  </span>
                ))}
                {'\n'}
              </span>
            </span>
          ))}
        </code>
      </pre>
      {terminal && (
        <div className={styles.terminal}>
          <p className={styles.terminalTitle}>
            <Icon icon={SquareTerminal} />
            Terminal
          </p>
          <pre className={styles.terminalBody}>
            <span className={styles.prompt}>$ </span>
            {terminal.command}
            {'\n'}
            <span className={terminal.succeeded ? styles.ok : styles.fail}>{terminal.output}</span>
          </pre>
        </div>
      )}
      <span className="visually-hidden" aria-live="polite">
        {state === 'idle' ? '' : COPY_LABEL[state]}
      </span>
    </figure>
  )
}
