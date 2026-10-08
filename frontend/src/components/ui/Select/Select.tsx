import { ChevronsUpDown } from 'lucide-react'
import type { Ref, SelectHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'
import { Icon } from '../Icon'
import { controlStyles } from '../TextInput'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  ref?: Ref<HTMLSelectElement>
  options: readonly SelectOption[]
  placeholder?: string
}

export function Select({ options, placeholder, className, ...props }: SelectProps) {
  return (
    <div className={styles.wrapper}>
      <select className={cx(controlStyles.control, styles.select, className)} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon icon={ChevronsUpDown} className={styles.icon} />
    </div>
  )
}
