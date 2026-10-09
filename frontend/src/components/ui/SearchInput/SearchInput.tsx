import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'
import { Icon } from '../Icon'
import { controlStyles } from '../TextInput'
import styles from './SearchInput.module.css'

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function SearchInput({ label, className, ...props }: SearchInputProps) {
  return (
    <div className={styles.wrapper}>
      <Icon icon={Search} className={styles.icon} />
      <input
        type="search"
        aria-label={label}
        className={cx(controlStyles.control, styles.input, className)}
        {...props}
      />
    </div>
  )
}
