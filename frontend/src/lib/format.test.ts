import { formatResult, withGrouping } from './format'

describe('formatResult', () => {
  it('hides floating point noise', () => {
    expect(formatResult(0.1 + 0.2)).toBe('0.3')
  })
  it('keeps integers and negatives', () => {
    expect(formatResult(3500)).toBe('3500')
    expect(formatResult(-12.5)).toBe('-12.5')
  })
  it('normalises negative zero', () => {
    expect(formatResult(-0)).toBe('0')
  })
  it('uses exponent notation for huge values', () => {
    expect(formatResult(1e21)).toBe('1e+21')
  })
})

describe('withGrouping', () => {
  it.each([
    ['0', '0'],
    ['1234', '1,234'],
    ['-1234567.891', '-1,234,567.891'],
    ['1234.', '1,234.'],
    ['', ''],
    ['1e+21', '1e+21'],
  ])('groups %s as %s', (input, expected) => {
    expect(withGrouping(input)).toBe(expected)
  })
})
