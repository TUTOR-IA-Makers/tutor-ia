import { Download } from 'lucide-react'
import { Button } from '@/components/ui'
import { selectionLabel } from './selectionLabel'
import styles from './SelectionBar.module.css'

export interface SelectionBarProps {
  count: number
  onExport: () => void
  onClear: () => void
}

export function SelectionBar({ count, onExport, onClear }: SelectionBarProps) {
  return (
    <div className={styles.bar} role="region" aria-label="Questões selecionadas">
      <p className={styles.text}>
        <strong>{selectionLabel(count)}</strong>
        <span className={styles.hint}>Prontas para o Moodle / Aprender3</span>
      </p>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onClear}>
          Limpar seleção
        </Button>
        <Button variant="accent" icon={Download} onClick={onExport}>
          Exportar XML
        </Button>
      </div>
    </div>
  )
}
