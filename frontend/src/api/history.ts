import type { CalculateRequest, HistoryEntry } from '../types'
import { requestJson } from './http'

const BASE = '/api/history/v1/history'

/** Client for the history-service. Results are always computed server-side. */
export interface HistoryApi {
  list(limit?: number): Promise<HistoryEntry[]>
  create(input: CalculateRequest): Promise<HistoryEntry>
  update(id: number, input: CalculateRequest): Promise<HistoryEntry>
  remove(id: number): Promise<void>
  clear(): Promise<void>
}

export const historyApi: HistoryApi = {
  async list(limit = 100) {
    const { entries } = await requestJson<{ entries: HistoryEntry[] }>(`${BASE}?limit=${limit}`)
    return entries
  },
  create: (input) => requestJson<HistoryEntry>(BASE, { method: 'POST', body: input }),
  update: (id, input) => requestJson<HistoryEntry>(`${BASE}/${id}`, { method: 'PUT', body: input }),
  remove: (id) => requestJson<void>(`${BASE}/${id}`, { method: 'DELETE' }),
  clear: () => requestJson<void>(BASE, { method: 'DELETE' }),
}
