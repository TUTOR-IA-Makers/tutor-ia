import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui'
import type { Question, QuestionDraft, Statement } from '@/domain'
import { describeError, isHttpStatus } from '@/lib/http'
import { useServices } from '@/services'
import { questionKeys } from './queryKeys'

function useOnError(id?: string) {
  const client = useQueryClient()
  const toast = useToast()
  return (error: unknown) => {
    if (id && isHttpStatus(error, 409))
      void client.invalidateQueries({ queryKey: questionKeys.detail(id) })
    const { title, message } = describeError(error)
    toast.show({ tone: 'danger', title, description: message })
  }
}

function storeQuestion(client: QueryClient, question: Question) {
  client.setQueryData(questionKeys.detail(question.id), question)
  void client.invalidateQueries({ queryKey: questionKeys.lists() })
}

export function useCreateQuestion() {
  const { questions } = useServices()
  const client = useQueryClient()
  return useMutation({
    mutationFn: (draft: QuestionDraft) => questions.create(draft),
    onSuccess: () => client.invalidateQueries({ queryKey: questionKeys.lists() }),
  })
}

export function useApproveQuestion(id: string) {
  const { questions } = useServices()
  const client = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: () => questions.approve(id),
    onSuccess: (question) => {
      storeQuestion(client, question)
      toast.show({
        tone: 'success',
        title: 'Questão aprovada',
        description: 'Ela já pode ser exportada pela biblioteca.',
      })
    },
    onError: useOnError(id),
  })
}

export function useRejectQuestion(id: string) {
  const { questions } = useServices()
  const client = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: () => questions.reject(id),
    onSuccess: (question) => {
      storeQuestion(client, question)
      toast.show({ tone: 'info', title: 'Questão rejeitada' })
    },
    onError: useOnError(id),
  })
}

export function useRegenerateQuestion(id: string) {
  const { questions } = useServices()
  const client = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: () => questions.regenerate(id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: questionKeys.generation(id) })
      await client.invalidateQueries({ queryKey: questionKeys.detail(id) })
      void client.invalidateQueries({ queryKey: questionKeys.lists() })
      toast.show({ tone: 'info', title: 'Gerando a questão de novo' })
    },
    onError: useOnError(id),
  })
}

export function useUpdateStatement(id: string) {
  const { questions } = useServices()
  const client = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (statement: Statement) => questions.updateStatement(id, statement),
    onSuccess: (question) => {
      storeQuestion(client, question)
      toast.show({ tone: 'success', title: 'Enunciado salvo' })
    },
    onError: useOnError(id),
  })
}

export function useExportMoodleXml() {
  const { questions } = useServices()
  return useMutation({
    mutationFn: (ids: readonly string[]) => questions.exportMoodleXml(ids),
    onError: useOnError(),
  })
}
