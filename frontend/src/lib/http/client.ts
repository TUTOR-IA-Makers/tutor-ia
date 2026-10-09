import type { z } from 'zod/mini'
import { HttpError, NetworkError, ResponseShapeError, TimeoutError } from './errors'

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type QueryValue = string | number | boolean | null | undefined
export type Query = Record<string, QueryValue | readonly QueryValue[]>

export interface RequestOptions {
  method?: Method
  body?: unknown
  query?: Query
  signal?: AbortSignal
  timeoutMs?: number
}

export interface DownloadedFile {
  filename: string
  blob: Blob
}

export const CSRF_HEADER = 'X-Requested-With'
export const CSRF_HEADER_VALUE = 'codeexpert-web'
export const DEFAULT_TIMEOUT_MS = 20_000

const SAFE_METHODS: ReadonlySet<Method> = new Set(['GET'])

export function assertRelativePath(path: string): void {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    throw new TypeError(`Somente caminhos relativos à origem são aceitos: "${path}"`)
  }
}

export function buildUrl(path: string, query: Query = {}): URL {
  assertRelativePath(path)
  const url = new URL(path, window.location.origin)
  for (const [key, raw] of Object.entries(query)) {
    const values: readonly QueryValue[] = Array.isArray(raw) ? raw : [raw as QueryValue]
    for (const value of values) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.append(key, String(value))
    }
  }
  return url
}

// Only a string `detail` is worth showing. statusText is English (and empty over HTTP/2),
// so an empty detail lets describeError fall back to its Portuguese message.
async function readDetail(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null)
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const { detail } = payload
    if (typeof detail === 'string') return detail
  }
  return ''
}

function linkAbort(timeoutMs: number, external?: AbortSignal) {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const forward = () => {
    controller.abort()
  }
  if (external?.aborted) controller.abort()
  external?.addEventListener('abort', forward, { once: true })
  return {
    signal: controller.signal,
    didTimeOut: () => timedOut,
    dispose: () => {
      clearTimeout(timer)
      external?.removeEventListener('abort', forward)
    },
  }
}

export async function send(path: string, options: RequestOptions = {}): Promise<Response> {
  const { method = 'GET', body, query, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options
  const url = buildUrl(path, query)

  const headers = new Headers({ Accept: 'application/json' })
  if (!SAFE_METHODS.has(method)) headers.set(CSRF_HEADER, CSRF_HEADER_VALUE)
  if (body !== undefined) headers.set('Content-Type', 'application/json')

  const abort = linkAbort(timeoutMs, signal)
  const init: RequestInit = {
    method,
    headers,
    credentials: 'same-origin',
    mode: 'same-origin',
    redirect: 'error',
    referrerPolicy: 'strict-origin-when-cross-origin',
    signal: abort.signal,
  }
  if (body !== undefined) init.body = JSON.stringify(body)

  try {
    const response = await fetch(url, init)
    if (!response.ok) throw new HttpError(response.status, await readDetail(response))
    return response
  } catch (error) {
    if (error instanceof HttpError) throw error
    if (abort.didTimeOut()) throw new TimeoutError(`Sem resposta de ${path}`)
    if (signal?.aborted) throw error
    throw new NetworkError(`Falha de rede em ${path}`)
  } finally {
    abort.dispose()
  }
}

export async function request<Schema extends z.ZodMiniType>(
  path: string,
  schema: Schema,
  options: RequestOptions = {},
): Promise<z.infer<Schema>> {
  const response = await send(path, options)
  const payload: unknown = response.status === 204 ? undefined : await response.json()
  const parsed = schema.safeParse(payload)
  if (!parsed.success) throw new ResponseShapeError(`Resposta inesperada de ${path}`)
  return parsed.data
}

const FILENAME = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i

export function filenameFrom(disposition: string | null, fallback: string): string {
  const match = disposition ? FILENAME.exec(disposition) : null
  const raw = match?.[1]
  if (!raw) return fallback
  return decodeOrKeep(raw).replace(/[/\\]/g, '_')
}

function decodeOrKeep(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export async function download(
  path: string,
  fallbackName: string,
  options: RequestOptions = {},
): Promise<DownloadedFile> {
  const response = await send(path, options)
  return {
    filename: filenameFrom(response.headers.get('Content-Disposition'), fallbackName),
    blob: await response.blob(),
  }
}
