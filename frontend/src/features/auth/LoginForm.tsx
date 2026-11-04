import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, Field, TextInput } from '@/components/ui'
import { ACCESS_URL } from '@/features/landing'
import { AuthFeedback } from './AuthFeedback'
import styles from './AuthForm.module.css'
import { PasswordInput } from './PasswordInput'
import { LOGIN_DEFAULTS, loginSchema, type LoginValues } from './schema'
import { useLogin } from './useAuthSubmit'

export function LoginForm() {
  const { submit, isPending, error, lockSeconds } = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: LOGIN_DEFAULTS,
    mode: 'onTouched',
  })
  const onSubmit = handleSubmit(submit)
  const locked = lockSeconds > 0

  return (
    <form className={styles.form} noValidate onSubmit={(event) => void onSubmit(event)}>
      <AuthFeedback error={error} locked={locked} />

      <Field label="E-mail" required error={errors.email?.message}>
        {(field) => (
          <TextInput
            {...field}
            {...register('email')}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
          />
        )}
      </Field>

      <Field label="Senha" required error={errors.password?.message}>
        {(field) => (
          <PasswordInput {...field} {...register('password')} autoComplete="current-password" />
        )}
      </Field>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        block
        isLoading={isPending}
        disabled={locked}
      >
        {locked ? `Aguarde ${String(lockSeconds)} s` : 'Entrar'}
      </Button>

      <p className={styles.aside}>
        <a href={ACCESS_URL}>Problemas para entrar?</a>
      </p>
    </form>
  )
}
