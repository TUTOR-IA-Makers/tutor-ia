import type { InputHTMLAttributes, Ref } from 'react'
import { cx } from '@/lib/cx'
import styles from './control.module.css'

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>
}

export function TextInput({ className, type = 'text', ...props }: TextInputProps) {
  return <input type={type} className={cx(styles.control, className)} {...props} />
}
