import { useCallback, useEffect, useState } from 'react'
import { historyApi, type HistoryApi } from '../api/history'
import { ApiError } from '../api/http'
import type { CalculateRequest, HistoryEntry } from '../types'

function messageOf(cause: unknown): string {
  return cause instanceof ApiError ? cause.message : 'Something went wrong with the history service.'
}

/**
 * History state backed by the history-service. A failing history service never
 * blocks the calculator: errors are shown in the panel and everything else keeps working.
 */
export function useHistory(api: HistoryApi = historyApi) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .list()
      .then((list) => !cancelled && setEntries(list))
      .catch((cause: unknown) => !cancelled && setError(messageOf(cause)))
      .finally(() => !cancelled && setLoaded(true))
    return () => {
      cancelled = true
    }
  }, [api])

  const guard = useCallback(async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
    try {
      const value = await action()
      setError(null)
      return value
    } catch (cause) {
      setError(messageOf(cause))
      return undefined
    }
  }, [])

  const add = useCallback(
    async (input: CalculateRequest) => {
      const created = await guard(() => api.create(input))
      if (created) setEntries((current) => [created, ...current])
    },
    [api, guard],
  )

  /** Returns true when the update was saved (so the editor can close). */
  const update = useCallback(
    async (id: number, input: CalculateRequest) => {
      const updated = await guard(() => api.update(id, input))
      if (updated) setEntries((current) => current.map((e) => (e.id === id ? updated : e)))
      return updated !== undefined
    },
    [api, guard],
  )

  const remove = useCallback(
    async (id: number) => {
      const done = await guard(() => api.remove(id).then(() => true))
      if (done) setEntries((current) => current.filter((e) => e.id !== id))
    },
    [api, guard],
  )

  const clear = useCallback(async () => {
    const done = await guard(() => api.clear().then(() => true))
    if (done) setEntries([])
  }, [api, guard])

  return { entries, error, loaded, add, update, remove, clear }
}
