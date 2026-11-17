import type { CalculateRequest, HistoryEntry } from '../types'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const failure = (status: number, code: string, message: string) => json({ error: { code, message } }, status)

function compute({ operation, a, b = 0 }: CalculateRequest): number {
  switch (operation) {
    case 'add':
      return a + b
    case 'subtract':
      return a - b
    case 'multiply':
      return a * b
    case 'divide':
      return a / b
    case 'power':
      return a ** b
    case 'percentage':
      return (a * b) / 100
    case 'sqrt':
      return Math.sqrt(a)
  }
}

interface Options {
  entries?: HistoryEntry[]
  /** Make every history-service call fail with 502. */
  historyDown?: boolean
  /** Make the calculator-service reject every request with this error. */
  calculatorError?: { status: number; code: string; message: string }
}

/** In-memory stand-in for both microservices, installed over `fetch`. */
export function installFakeBackend(options: Options = {}) {
  const entries = [...(options.entries ?? [])]
  let nextId = Math.max(0, ...entries.map((e) => e.id)) + 1

  const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    const body = init?.body ? (JSON.parse(String(init.body)) as CalculateRequest) : undefined

    if (url.startsWith('/api/calc/v1/calculate')) {
      if (options.calculatorError) {
        const { status, code, message } = options.calculatorError
        return failure(status, code, message)
      }
      return json({ operation: body!.operation, result: compute(body!) })
    }

    if (url.startsWith('/api/history/v1/history')) {
      if (options.historyDown) return failure(502, 'CALCULATOR_UNAVAILABLE', 'the history service is unavailable')
      const id = Number(url.split('?')[0].split('/').pop())
      const now = new Date().toISOString()

      if (method === 'GET') return json({ entries: [...entries].reverse() })
      if (method === 'POST') {
        const entry: HistoryEntry = { id: nextId++, ...body!, result: compute(body!), createdAt: now, updatedAt: now }
        entries.push(entry)
        return json(entry, 201)
      }
      if (method === 'PUT') {
        const index = entries.findIndex((e) => e.id === id)
        if (index < 0) return failure(404, 'NOT_FOUND', 'history entry not found')
        entries[index] = { ...entries[index], ...body!, b: body!.b, result: compute(body!), updatedAt: now }
        return json(entries[index])
      }
      if (method === 'DELETE') {
        if (Number.isNaN(id)) entries.length = 0
        else entries.splice(entries.findIndex((e) => e.id === id), 1)
        return new Response(null, { status: 204 })
      }
    }
    return failure(404, 'NOT_FOUND', `unexpected request ${method} ${url}`)
  })

  return { spy, entries }
}

export function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 1,
    operation: 'add',
    a: 1,
    b: 2,
    result: 3,
    createdAt: '2026-01-02T03:04:05Z',
    updatedAt: '2026-01-02T03:04:05Z',
    ...overrides,
  }
}
