import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import {
  BackLink,
  Button,
  Callout,
  Field,
  NumberStepper,
  Panel,
  Select,
  Textarea,
} from '@/components/ui'
import { CONTENTS, type QuestionDraft } from '@/domain'
import { describeError } from '@/lib/http'
import { questionPath, useCreateQuestion } from '@/features/questions'
import { DifficultyField } from './DifficultyField'
import {
  CONTEXT_MAX,
  DEFAULT_VALUES,
  generateSchema,
  TEST_CASE_HINTS_MAX,
  TEST_CASES_MAX,
  TEST_CASES_MIN,
  type GenerateFormValues,
} from './schema'
import { StructuresPanel } from './StructuresPanel'
import styles from './GenerateForm.module.css'

const CONTENT_OPTIONS = CONTENTS.map(({ id, label }) => ({ value: id, label }))

export interface GenerateFormProps {
  defaultValues?: QuestionDraft
}

export function GenerateForm({ defaultValues = DEFAULT_VALUES }: GenerateFormProps) {
  const navigate = useNavigate()
  const create = useCreateQuestion()
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GenerateFormValues>({ resolver: zodResolver(generateSchema), defaultValues })

  const submit = handleSubmit((draft) => {
    create.mutate(draft, {
      onSuccess: ({ id }) => {
        void navigate(questionPath(id))
      },
    })
  })

  const failure = create.isError ? describeError(create.error) : null

  return (
    <form className={styles.form} noValidate onSubmit={(event) => void submit(event)}>
      <div className={styles.columns}>
        <Panel title="Conteúdo e dificuldade">
          <Field label="Conteúdo de programação" required error={errors.contentId?.message}>
            {(field) => (
              <Select
                {...field}
                {...register('contentId')}
                placeholder="Escolha um conteúdo"
                options={CONTENT_OPTIONS}
              />
            )}
          </Field>
          <Controller
            control={control}
            name="difficulty"
            render={({ field, fieldState }) => (
              <DifficultyField
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Field
            label="Quantidade de casos de teste"
            hint="Recomendado entre 4 e 8 casos para uma cobertura adequada."
            error={errors.testCaseCount?.message}
          >
            {(fieldProps) => (
              <Controller
                control={control}
                name="testCaseCount"
                render={({ field }) => (
                  <NumberStepper
                    {...fieldProps}
                    value={field.value}
                    min={TEST_CASES_MIN}
                    max={TEST_CASES_MAX}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    decrementLabel="Diminuir casos de teste"
                    incrementLabel="Aumentar casos de teste"
                  />
                )}
              />
            )}
          </Field>
          <Field
            label="Casos de teste específicos"
            optional
            hint='Descreva entradas ou situações que precisam aparecer, como "ano 1900" ou "vetor vazio". O texto vai junto com o pedido de geração.'
            error={errors.testCaseHints?.message}
          >
            {(field) => (
              <Controller
                control={control}
                name="testCaseHints"
                render={({ field: hints }) => (
                  <Textarea
                    {...field}
                    {...hints}
                    maxLength={TEST_CASE_HINTS_MAX}
                    showCount
                    placeholder="Ex.: incluir um ano divisível por 100 que não seja bissexto"
                  />
                )}
              />
            )}
          </Field>
          <Field
            label="Contexto do exercício"
            optional
            hint="Ajuda a dar um tema ao enunciado."
            error={errors.context?.message}
          >
            {(field) => (
              <Controller
                control={control}
                name="context"
                render={({ field: context }) => (
                  <Textarea
                    {...field}
                    {...context}
                    maxLength={CONTEXT_MAX}
                    placeholder="Ex.: verificar se um ano é bissexto ou calcular média ponderada"
                  />
                )}
              />
            )}
          </Field>
        </Panel>
        <Controller
          control={control}
          name="structures"
          render={({ field, fieldState }) => (
            <StructuresPanel
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>
      {failure && (
        <Callout tone="danger" title={failure.title} role="alert">
          {failure.message}
        </Callout>
      )}
      <div className={styles.footer}>
        <BackLink to="/biblioteca">Voltar à biblioteca</BackLink>
        <Button type="submit" variant="primary" size="lg" isLoading={create.isPending}>
          Gerar questão
        </Button>
      </div>
    </form>
  )
}
