import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Icon, TextInput, type TextInputProps } from '@/components/ui'
import { cx } from '@/lib/cx'
import styles from './PasswordInput.module.css'

export type PasswordInputProps = Omit<TextInputProps, 'type'>

// The toggle keeps one label and reports its state through aria-pressed, so a
// screen reader hears "Mostrar senha, pressionado" instead of a name that flips.
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={styles.wrapper}>
      <TextInput
        {...props}
        type={visible ? 'text' : 'password'}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cx(styles.input, className)}
      />
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={visible}
        aria-controls={props.id}
        onClick={() => {
          setVisible((current) => !current)
        }}
      >
        <Icon icon={visible ? EyeOff : Eye} size="md" />
        <span className="visually-hidden">Mostrar senha</span>
      </button>
    </div>
  )
}
