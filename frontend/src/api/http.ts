import type { ApiErrorBody } from '../types'

/** Error thrown for any failed request; `code` is stable and safe to branch on. */
export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor({ code, message }: ApiErrorBody, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

/** JSON request helper shared by every service client. */
export async function requestJson<T>(
  path: string,
  init: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      method: init.method ?? 'GET',
      headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init.signal,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError(
      { code: 'NETWORK_ERROR', message: 'Cannot reach the server. Check your connection.' },
      0,
    )
  }

  if (response.status === 204) return undefined as T

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new ApiError(
      { code: 'BAD_RESPONSE', message: 'The server sent an unreadable response.' },
      response.status,
    )
  }

  if (!response.ok) {
    throw new ApiError(extractError(payload), response.status)
  }
  return payload as T
}

function extractError(payload: unknown): ApiErrorBody {
  const error = (payload as { error?: Partial<ApiErrorBody> } | null)?.error
  if (error && typeof error.code === 'string' && typeof error.message === 'string') {
    return { code: error.code, message: error.message }
  }
  return { code: 'UNKNOWN_ERROR', message: 'Something went wrong. Please try again.' }
}
