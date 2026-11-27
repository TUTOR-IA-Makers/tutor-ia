import { HttpError, NetworkError, ResponseShapeError, TimeoutError } from './errors'

export interface ErrorDescription {
  title: string
  message: string
  sessionExpired: boolean
}

interface Known {
  title: string
  reason: string
  next: string
}

const BY_STATUS: Record<number, Known> = {
  400: {
    title: 'Dados inválidos',
    reason: 'O servidor não aceitou os dados enviados.',
    next: 'Confira os campos e tente de novo.',
  },
  401: {
    title: 'Sessão expirada',
    reason: 'Sua sessão terminou.',
    next: 'Entre de novo para continuar. As questões já salvas continuam na biblioteca.',
  },
  403: {
    title: 'Acesso negado',
    reason: 'Você não tem permissão para esta ação.',
    next: 'Fale com a coordenação para liberar o acesso.',
  },
  404: {
    title: 'Não encontrado',
    reason: 'O item pode ter sido removido.',
    next: 'Volte à biblioteca e abra a questão de novo.',
  },
  409: {
    title: 'A questão mudou de estado',
    reason: 'Outra ação alterou esta questão enquanto você trabalhava.',
    next: 'Carregamos a versão mais recente. Confira antes de continuar.',
  },
  422: {
    title: 'Dados inválidos',
    reason: 'Alguns campos não passaram na validação.',
    next: 'Corrija os campos destacados e tente de novo.',
  },
  429: {
    title: 'Cota de gerações atingida',
    reason: 'Você usou todas as gerações disponíveis por enquanto.',
    next: 'As questões já geradas continuam na biblioteca. Tente gerar de novo mais tarde.',
  },
  502: {
    title: 'Provedor de IA indisponível',
    reason: 'O serviço de IA que escreve as questões não respondeu.',
    next: 'Nada foi perdido. Tente de novo em alguns minutos.',
  },
  503: {
    title: 'Geração indisponível',
    reason: 'A geração de questões está desligada no servidor.',
    next: 'A biblioteca continua funcionando. Avise a equipe do CodeExpert.',
  },
}

const SERVER_ERROR: Known = {
  title: 'Erro no servidor',
  reason: 'O servidor teve um problema.',
  next: 'Tente de novo em instantes. Se continuar, avise a equipe do CodeExpert.',
}

const UNKNOWN_ERROR: Known = {
  title: 'Algo deu errado',
  reason: 'A ação não foi concluída.',
  next: 'Tente de novo. Se continuar, avise a equipe do CodeExpert.',
}

function join(reason: string, next: string): string {
  return `${reason} ${next}`
}

function waitText(seconds: number): string {
  if (seconds < 60) return 'Tente de novo em alguns segundos.'
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) return `Tente de novo em ${String(minutes)} min.`
  const hours = Math.ceil(minutes / 60)
  return `Tente de novo em ${String(hours)} h.`
}

function describeHttp(error: HttpError): ErrorDescription {
  const known = BY_STATUS[error.status] ?? (error.status >= 500 ? SERVER_ERROR : UNKNOWN_ERROR)
  const { reason } = known
  const next =
    error.status === 429 && error.retryAfterSeconds !== undefined
      ? `As questões já geradas continuam na biblioteca. ${waitText(error.retryAfterSeconds)}`
      : known.next
  return { title: known.title, message: join(reason, next), sessionExpired: error.status === 401 }
}

export function describeError(error: unknown): ErrorDescription {
  if (error instanceof HttpError) return describeHttp(error)
  if (error instanceof TimeoutError) {
    return {
      title: 'Tempo esgotado',
      message: join('O servidor demorou a responder.', 'Tente de novo em instantes.'),
      sessionExpired: false,
    }
  }
  if (error instanceof NetworkError) {
    return {
      title: 'Sem conexão',
      message: join('Não foi possível falar com o servidor.', 'Confira sua rede e tente de novo.'),
      sessionExpired: false,
    }
  }
  if (error instanceof ResponseShapeError) {
    return {
      title: 'Resposta inesperada',
      message: join(
        'O servidor respondeu em um formato que esta tela não reconhece.',
        'Recarregue a página. Se continuar, avise a equipe do CodeExpert.',
      ),
      sessionExpired: false,
    }
  }
  return {
    title: UNKNOWN_ERROR.title,
    message: join(UNKNOWN_ERROR.reason, UNKNOWN_ERROR.next),
    sessionExpired: false,
  }
}
