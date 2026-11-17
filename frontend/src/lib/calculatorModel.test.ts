import {
  calcReducer,
  describeBinary,
  describeSqrt,
  initialState,
  MAX_DIGITS,
  readyToEvaluate,
  validateRequest,
  type CalcAction,
  type CalcState,
} from './calculatorModel'

const run = (actions: CalcAction[], from: CalcState = initialState) => actions.reduce(calcReducer, from)
const digits = (s: string): CalcAction[] => [...s].map((digit) => ({ type: 'digit', digit }))

describe('typing', () => {
  it('replaces the initial zero and appends digits', () => {
    expect(run(digits('0070')).entry).toBe('70')
  })
  it('allows a single decimal point', () => {
    const s = run([...digits('1'), { type: 'decimal' }, ...digits('5'), { type: 'decimal' }])
    expect(s.entry).toBe('1.5')
  })
  it('starts with 0. when the decimal comes first', () => {
    expect(run([{ type: 'decimal' }]).entry).toBe('0.')
  })
  it('caps the number of digits', () => {
    expect(run(digits('9'.repeat(MAX_DIGITS + 5))).entry).toHaveLength(MAX_DIGITS)
  })
  it('toggles the sign but ignores zero', () => {
    expect(run([{ type: 'negate' }]).entry).toBe('0')
    expect(run([...digits('5'), { type: 'negate' }]).entry).toBe('-5')
    expect(run([...digits('5'), { type: 'negate' }, { type: 'negate' }]).entry).toBe('5')
  })
  it('backspace edits and never leaves an empty entry', () => {
    expect(run([...digits('123'), { type: 'backspace' }]).entry).toBe('12')
    expect(run([...digits('1'), { type: 'backspace' }]).entry).toBe('0')
    expect(run([...digits('1'), { type: 'negate' }, { type: 'backspace' }]).entry).toBe('0')
  })
  it('does not trim a result in exponent notation', () => {
    const result = run([{ type: 'resolved', result: 1e21, expression: '' }])
    expect(result.entry).toBe('1e+21')
    expect(calcReducer(result, { type: 'backspace' })).toBe(result)
  })
  it('keeps typing after a negative zero-ish entry', () => {
    expect(calcReducer({ ...initialState, entry: '-0' }, { type: 'digit', digit: '4' }).entry).toBe('-4')
  })
})

describe('operators', () => {
  it('stores the left operand and waits for the right one', () => {
    const s = run([...digits('250'), { type: 'operator', operation: 'multiply' }])
    expect(s).toMatchObject({ operand: 250, operation: 'multiply', awaitingOperand: true, expression: '250 ×' })
    expect(readyToEvaluate(s)).toBe(false)
  })
  it('lets the user change the operator before typing the right operand', () => {
    const s = run([...digits('8'), { type: 'operator', operation: 'add' }, { type: 'operator', operation: 'power' }])
    expect(s).toMatchObject({ operand: 8, operation: 'power', expression: '8 ^' })
  })
  it('is ready to evaluate once the right operand is typed', () => {
    const s = run([...digits('8'), { type: 'operator', operation: 'add' }, ...digits('2')])
    expect(s.entry).toBe('2')
    expect(readyToEvaluate(s)).toBe(true)
  })
  it('ignores backspace and sign while waiting for the right operand', () => {
    const base = run([...digits('8'), { type: 'operator', operation: 'add' }])
    expect(calcReducer(base, { type: 'backspace' })).toBe(base)
    expect(calcReducer(base, { type: 'negate' })).toBe(base)
  })
})

describe('results and errors', () => {
  it('shows the result and replaces it on the next digit', () => {
    const s = run([{ type: 'resolved', result: 3500, expression: '250 × 14 =' }])
    expect(s).toMatchObject({ entry: '3500', expression: '250 × 14 =', overwrite: true, resultId: 1, operation: null })
    expect(calcReducer(s, { type: 'digit', digit: '7' }).entry).toBe('7')
    expect(calcReducer(s, { type: 'decimal' }).entry).toBe('0.')
  })
  it('continues a chain from the result', () => {
    const s = run([{ type: 'resolved', result: 5, expression: '2 + 3 =', next: 'multiply' }])
    expect(s).toMatchObject({ operand: 5, operation: 'multiply', awaitingOperand: true, expression: '5 ×' })
  })
  it('keeps state on failure and clears the error on the next key', () => {
    const failed = run([...digits('5'), { type: 'failed', error: { code: 'X', message: 'boom' } }])
    expect(failed.error?.message).toBe('boom')
    expect(failed.entry).toBe('5')
    expect(calcReducer(failed, { type: 'digit', digit: '6' })).toMatchObject({ entry: '56', error: null })
  })
  it('clear resets everything but keeps the result counter', () => {
    const s = run([{ type: 'resolved', result: 1, expression: '' }, { type: 'clear' }])
    expect(s).toEqual({ ...initialState, resultId: 1 })
  })
})

describe('helpers', () => {
  it('describes calculations for the expression line', () => {
    expect(describeBinary(1250, 'percentage', 18)).toBe('1,250 % of 18 =')
    expect(describeSqrt(144)).toBe('√(144) =')
  })
  it('validates obvious mistakes like the server does', () => {
    expect(validateRequest({ operation: 'divide', a: 1, b: 0 })?.code).toBe('DIVISION_BY_ZERO')
    expect(validateRequest({ operation: 'sqrt', a: -1 })?.code).toBe('NEGATIVE_SQRT')
    expect(validateRequest({ operation: 'divide', a: 0, b: 2 })).toBeNull()
  })
})
