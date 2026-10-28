import styles from './SkipLink.module.css'

export interface SkipLinkProps {
  targetId: string
  label?: string
}

export function SkipLink({ targetId, label = 'Pular para o conteúdo' }: SkipLinkProps) {
  return (
    <a className={styles.skipLink} href={`#${targetId}`}>
      {label}
    </a>
  )
}
