import type { z } from 'zod/mini'
import { download, request, type DownloadedFile, type Query, type RequestOptions } from './client'

type CallOptions = Omit<RequestOptions, 'method' | 'body'>
type BodyOptions = CallOptions & { body?: unknown }

export interface HttpClient {
  get<S extends z.ZodMiniType>(path: string, schema: S, options?: CallOptions): Promise<z.infer<S>>
  post<S extends z.ZodMiniType>(path: string, schema: S, options?: BodyOptions): Promise<z.infer<S>>
  put<S extends z.ZodMiniType>(path: string, schema: S, options?: BodyOptions): Promise<z.infer<S>>
  patch<S extends z.ZodMiniType>(
    path: string,
    schema: S,
    options?: BodyOptions,
  ): Promise<z.infer<S>>
  delete<S extends z.ZodMiniType>(
    path: string,
    schema: S,
    options?: CallOptions,
  ): Promise<z.infer<S>>
  download(path: string, fallbackName: string, options?: RequestOptions): Promise<DownloadedFile>
}

export interface HttpClientConfig {
  baseUrl?: string
  timeoutMs?: number
  defaultQuery?: Query
}

export function joinPath(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, '')
  const tail = path.startsWith('/') ? path : `/${path}`
  return `${base}${tail}`
}

export function createHttpClient({ baseUrl = '', timeoutMs }: HttpClientConfig = {}): HttpClient {
  const withDefaults = (options: RequestOptions): RequestOptions =>
    timeoutMs === undefined || options.timeoutMs !== undefined ? options : { ...options, timeoutMs }
  const call =
    (method: NonNullable<RequestOptions['method']>) =>
    <S extends z.ZodMiniType>(path: string, schema: S, options: BodyOptions = {}) =>
      request(joinPath(baseUrl, path), schema, withDefaults({ ...options, method }))

  return {
    get: call('GET'),
    post: call('POST'),
    put: call('PUT'),
    patch: call('PATCH'),
    delete: call('DELETE'),
    download: (path, fallbackName, options = {}) =>
      download(joinPath(baseUrl, path), fallbackName, withDefaults(options)),
  }
}
