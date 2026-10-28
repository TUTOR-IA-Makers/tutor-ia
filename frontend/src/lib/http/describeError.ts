import { HttpError, NetworkError, ResponseShapeError, TimeoutError } from './errors'

export interface ErrorDescription {
  title: string
  message: string
}

const BY_STATUS: Record<number, ErrorDescription> = {
  400: { title: 'Dados inválidos', message: 'Confira os campos e tente de novo.' },
  401: { title: 'Sessão expirada', message: 'Entre de novo para continuar.' },
  403: {
    title: 'Acesso negado',
    message: 'Você não tem permissão para esta ação. Fale com a coordenação.',
  },
  404: { title: 'Não encontrado', message: 'O item pode ter sido removido. Volte à biblioteca.' },
  409: {
    title: 'A questão mudou de estado',
    message: 'Carregamos a versão mais recente. Confira antes de continuar.',
  },
  422: { title: 'Dados inválidos', message: 'Confira os campos destacados e tente de novo.' },
  429: { title: 'Muitas solicitações', message: 'Aguarde alguns segundos e tente de novo.' },
  503: {
    title: 'Geração indisponível',
    message: 'O serviço de geração está fora do ar. Tente de novo em alguns minutos.',
  },
}

const SERVER_ERROR: ErrorDescription = {
  title: 'Erro no servidor',
  message: 'O servidor teve um problema. Tente de novo em instantes.',
}

const UNKNOWN_ERROR: ErrorDescription = {
  title: 'Algo deu errado',
  message: 'Tente de novo. Se continuar, avise a equipe do CodeExpert.',
}

export function describeError(error: unknown): ErrorDescription {
  if (error instanceof HttpError) {
    const known = BY_STATUS[error.status] ?? (error.status >= 500 ? SERVER_ERROR : UNKNOWN_ERROR)
    const useDetail = error.status < 500 && error.detail.trim().length > 0
    return useDetail ? { title: known.title, message: error.detail } : known
  }
  if (error instanceof TimeoutError) {
    return { title: 'Tempo esgotado', message: 'O servidor demorou a responder. Tente de novo.' }
  }
  if (error instanceof NetworkError) {
    return {
      title: 'Sem conexão',
      message: 'Não foi possível falar com o servidor. Confira sua rede.',
    }
  }
  if (error instanceof ResponseShapeError) {
    return {
      title: 'Resposta inesperada',
      message: 'O servidor respondeu em um formato que esta tela não reconhece. Avise a equipe.',
    }
  }
  return UNKNOWN_ERROR
}
