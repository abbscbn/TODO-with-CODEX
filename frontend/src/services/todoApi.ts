import type { ApiProblem, Todo, TodoRequest } from '../types/todo'

const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${baseUrl}/api/todos${path}`, {
      ...options,
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new ApiError(`Sunucuya ulaşılamıyor. Backend’in ${baseUrl} adresinde çalıştığını ve API bağlantı ayarını kontrol edip tekrar deneyin.`)
  }
  if (!response.ok) {
    const problem: ApiProblem | null = await response.json().catch(() => null)
    const fallback = response.status === 404 ? 'Bu görev artık bulunamıyor. Listeyi yenileyin.'
      : response.status >= 500 ? 'Sunucuda bir sorun oluştu. Lütfen tekrar deneyin.'
      : 'İşlem tamamlanamadı. Lütfen tekrar deneyin.'
    throw new ApiError(problem?.errors?.title || (response.status === 404 || response.status >= 500 ? fallback : problem?.detail) || fallback, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const todoApi = {
  list: (signal?: AbortSignal) => request<Todo[]>('', { signal }),
  get: (id: number) => request<Todo>(`/${id}`),
  create: (todo: TodoRequest) => request<Todo>('', { method: 'POST', body: JSON.stringify(todo) }),
  update: (id: number, todo: TodoRequest) => request<Todo>(`/${id}`, { method: 'PUT', body: JSON.stringify(todo) }),
  toggle: (id: number) => request<Todo>(`/${id}/toggle`, { method: 'PATCH' }),
  remove: (id: number) => request<void>(`/${id}`, { method: 'DELETE' }),
}
