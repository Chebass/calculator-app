import { ApiError, requestJson } from './http'
import { calculatorApi } from './calculator'

const mockFetch = (impl: () => Promise<Response> | Response) =>
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => impl())

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('requestJson', () => {
  it('sends a JSON body and parses the response', async () => {
    const spy = mockFetch(() => json({ operation: 'add', result: 5 }))
    await expect(calculatorApi.calculate({ operation: 'add', a: 2, b: 3 })).resolves.toEqual({
      operation: 'add',
      result: 5,
    })
    const [url, init] = spy.mock.calls[0]
    expect(url).toBe('/api/calc/v1/calculate')
    expect(init).toMatchObject({ method: 'POST', body: '{"operation":"add","a":2,"b":3}' })
  })

  it('turns an error envelope into an ApiError', async () => {
    mockFetch(() => json({ error: { code: 'DIVISION_BY_ZERO', message: 'nope' } }, 422))
    await expect(requestJson('/x')).rejects.toMatchObject({ code: 'DIVISION_BY_ZERO', message: 'nope', status: 422 })
  })

  it('falls back to a generic error when the envelope is missing', async () => {
    mockFetch(() => json({ oops: true }, 500))
    await expect(requestJson('/x')).rejects.toMatchObject({ code: 'UNKNOWN_ERROR', status: 500 })
  })

  it('reports unreadable bodies', async () => {
    mockFetch(() => new Response('<html>', { status: 502 }))
    await expect(requestJson('/x')).rejects.toMatchObject({ code: 'BAD_RESPONSE', status: 502 })
  })

  it('reports network failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('failed'))
    const error = await requestJson('/x').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'NETWORK_ERROR', status: 0 })
  })

  it('rethrows aborts untouched', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('aborted', 'AbortError'))
    await expect(requestJson('/x')).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('supports 204 responses', async () => {
    mockFetch(() => new Response(null, { status: 204 }))
    await expect(requestJson('/x', { method: 'DELETE' })).resolves.toBeUndefined()
  })
})
