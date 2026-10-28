import styles from './Avatar.module.css'

export interface AvatarProps {
  initials: string
}

export function Avatar({ initials }: AvatarProps) {
  return (
    <span className={styles.avatar} aria-hidden="true">
      {initials}
    </span>
  )
}
