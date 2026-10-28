import { RotateCcw } from 'lucide-react'
import { Button } from '../Button'
import { Callout } from '../Callout'
import styles from './States.module.css'

export interface ErrorStateProps {
  title: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div className={styles.error}>
      <Callout tone="danger" title={title} role="alert">
        {message}
      </Callout>
      {onRetry && (
        <Button icon={RotateCcw} onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  )
}
