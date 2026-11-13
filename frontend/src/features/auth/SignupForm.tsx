import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Circle } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Button, Field, Icon, TextInput } from '@/components/ui'
import { ACCESS_URL } from '@/features/landing'
import { cx } from '@/lib/cx'
import { AuthFeedback } from './AuthFeedback'
import styles from './AuthForm.module.css'
import { PasswordInput } from './PasswordInput'
import {
  PASSWORD_MIN,
  passwordRequirements,
  SIGNUP_DEFAULTS,
  signupSchema,
  type SignupValues,
} from './schema'
import { useSignup } from './useAuthSubmit'

export function SignupForm() {
  const { submit, isPending, error, lockSeconds } = useSignup()
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: SIGNUP_DEFAULTS,
    mode: 'onTouched',
  })
  const [password, email] = useWatch({ control, name: ['password', 'email'] })
  const requirements = passwordRequirements(password, email)
  const onSubmit = handleSubmit(submit)
  const locked = lockSeconds > 0

  return (
    <form className={styles.form} noValidate onSubmit={(event) => void onSubmit(event)}>
      <AuthFeedback error={error} locked={locked} />

      <Field label="Nome completo" required error={errors.name?.message}>
        {(field) => <TextInput {...field} {...register('name')} autoComplete="name" />}
      </Field>

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

      <div className={styles.group}>
        <Field
          label="Senha"
          required
          hint={`Pelo menos ${String(PASSWORD_MIN)} caracteres, diferente do seu e-mail.`}
          error={errors.password?.message}
        >
          {(field) => (
            <PasswordInput {...field} {...register('password')} autoComplete="new-password" />
          )}
        </Field>
        <ul className={styles.requirements} aria-label="Requisitos da senha">
          {requirements.map(({ id, label, met }) => (
            <li key={id} className={cx(styles.requirement, met && styles.met)}>
              <Icon icon={met ? Check : Circle} />
              <span>{label}</span>
              <span className="visually-hidden">{met ? '(atendido)' : '(pendente)'}</span>
            </li>
          ))}
        </ul>
      </div>

      <Field label="Confirme a senha" required error={errors.confirmPassword?.message}>
        {(field) => (
          <PasswordInput {...field} {...register('confirmPassword')} autoComplete="new-password" />
        )}
      </Field>

      <Field
        label="Código de convite"
        required
        hint={
          <>
            Quem libera o acesso envia o código. Não recebeu?{' '}
            <a href={ACCESS_URL}>Peça um convite</a>.
          </>
        }
        error={errors.inviteCode?.message}
      >
        {(field) => (
          <TextInput
            {...field}
            {...register('inviteCode')}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className={styles.code}
          />
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
        {locked ? `Aguarde ${String(lockSeconds)} s` : 'Criar conta'}
      </Button>
    </form>
  )
}
