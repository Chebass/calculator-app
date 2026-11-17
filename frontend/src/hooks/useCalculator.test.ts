import { act, renderHook, waitFor } from '@testing-library/react'
import { ApiError } from '../api/http'
import type { CalculatorApi } from '../api/calculator'
import { useCalculator, type KeyId } from './useCalculator'

const defaultImpl: CalculatorApi['calculate'] = async ({ operation, a, b }) => ({
  operation,
  result: operation === 'add' ? a + (b ?? 0) : operation === 'multiply' ? a * (b ?? 1) : Math.sqrt(a),
})

function setup(impl: CalculatorApi['calculate'] = defaultImpl) {
  const calculate = vi.fn(impl)
  const onCalculated = vi.fn()
  const hook = renderHook(() => useCalculator({ api: { calculate }, onCalculated }))
  const press = async (...keys: KeyId[]) => {
    for (const key of keys) {
      await act(async () => hook.result.current.press(key))
    }
  }
  return { ...hook, calculate, onCalculated, press }
}

describe('useCalculator', () => {
  it('calculates a binary operation and reports it', async () => {
    const { result, calculate, onCalculated, press } = setup()
    await press('2', '5', '0', 'multiply', '1', '4', 'equals')
    expect(calculate).toHaveBeenCalledWith({ operation: 'multiply', a: 250, b: 14 })
    expect(result.current.state.entry).toBe('3500')
    expect(result.current.state.expression).toBe('250 × 14 =')
    expect(onCalculated).toHaveBeenCalledWith({
      request: { operation: 'multiply', a: 250, b: 14 },
      result: 3500,
      expression: '250 × 14 =',
    })
    expect(result.current.latencyMs).not.toBeNull()
  })

  it('computes the pending operation when chaining operators', async () => {
    const { result, calculate, press } = setup()
    await press('2', 'add', '3', 'multiply')
    expect(calculate).toHaveBeenCalledWith({ operation: 'add', a: 2, b: 3 })
    expect(result.current.state).toMatchObject({ entry: '5', operation: 'multiply', awaitingOperand: true })
    await press('4', 'equals')
    expect(result.current.state.entry).toBe('20')
  })

  it('supports square root immediately', async () => {
    const { result, calculate, press } = setup()
    await press('1', '4', '4', 'sqrt')
    expect(calculate).toHaveBeenCalledWith({ operation: 'sqrt', a: 144 })
    expect(result.current.state.entry).toBe('12')
  })

  it('does nothing on equals without an operation', async () => {
    const { calculate, press } = setup()
    await press('5', 'equals')
    expect(calculate).not.toHaveBeenCalled()
  })

  it('validates division by zero without calling the server', async () => {
    const { result, calculate, press } = setup()
    await press('8', 'divide', '0', 'equals')
    expect(calculate).not.toHaveBeenCalled()
    expect(result.current.state.error?.code).toBe('DIVISION_BY_ZERO')
    // The user can fix the operand and retry.
    await press('backspace', '2')
    expect(result.current.state.error).toBeNull()
  })

  it('surfaces server errors', async () => {
    const { result, press } = setup(async () => {
      throw new ApiError({ code: 'UNDEFINED_RESULT', message: 'too big' }, 422)
    })
    await press('9', 'power', '9', 'equals')
    expect(result.current.state.error).toEqual({ code: 'UNDEFINED_RESULT', message: 'too big' })
  })

  it('maps unexpected failures to a generic message', async () => {
    const { result, press } = setup(async () => {
      throw new Error('boom')
    })
    await press('1', 'add', '1', 'equals')
    expect(result.current.state.error?.code).toBe('UNKNOWN_ERROR')
  })

  it('ignores input while a request is in flight', async () => {
    let release: () => void = () => {}
    const { result, calculate, press } = setup(
      () => new Promise((resolve) => (release = () => resolve({ operation: 'add', result: 3 }))),
    )
    await press('1', 'add', '2')
    act(() => result.current.press('equals'))
    await waitFor(() => expect(result.current.loading).toBe(true))
    act(() => result.current.press('9'))
    expect(calculate).toHaveBeenCalledTimes(1)
    await act(async () => release())
    expect(result.current.state.entry).toBe('3')
    expect(result.current.loading).toBe(false)
  })

  it('handles clear, decimal, sign and backspace keys', async () => {
    const { result, press } = setup()
    await press('1', 'decimal', '5', 'negate')
    expect(result.current.state.entry).toBe('-1.5')
    await press('backspace')
    expect(result.current.state.entry).toBe('-1.')
    await press('clear')
    expect(result.current.state.entry).toBe('0')
  })
})
