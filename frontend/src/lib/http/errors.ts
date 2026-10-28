export class HttpError extends Error {
  override readonly name = 'HttpError'

  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(`HTTP ${String(status)}: ${detail}`)
  }
}

export class ResponseShapeError extends Error {
  override readonly name = 'ResponseShapeError'
}

export class NetworkError extends Error {
  override readonly name = 'NetworkError'
}

export class TimeoutError extends Error {
  override readonly name = 'TimeoutError'
}

export function isHttpStatus(error: unknown, status: number): error is HttpError {
  return error instanceof HttpError && error.status === status
}
