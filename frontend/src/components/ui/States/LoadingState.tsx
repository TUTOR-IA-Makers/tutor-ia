import { Spinner } from '../Spinner'
import styles from './States.module.css'

export interface LoadingStateProps {
  label: string
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className={styles.loading} role="status">
      <Spinner size="lg" />
      <span>{label}</span>
    </div>
  )
}
