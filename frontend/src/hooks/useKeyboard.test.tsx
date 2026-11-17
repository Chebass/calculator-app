import { fireEvent, render } from '@testing-library/react'
import type { KeyId } from './useCalculator'
import { keyFromEvent, useKeyboard } from './useKeyboard'

describe('keyFromEvent', () => {
  it.each([
    ['7', '7'],
    ['+', 'add'],
    ['-', 'subtract'],
    ['*', 'multiply'],
    ['/', 'divide'],
    ['^', 'power'],
    ['%', 'percentage'],
    ['.', 'decimal'],
    ['Enter', 'equals'],
    ['Backspace', 'backspace'],
    ['Escape', 'clear'],
  ])('maps %s to %s', (key, expected) => {
    expect(keyFromEvent(key)).toBe(expected)
  })
  it('ignores unrelated keys', () => {
    expect(keyFromEvent('q')).toBeNull()
  })
})

function Harness({ press }: { press: (k: KeyId) => void }) {
  useKeyboard(press)
  return (
    <>
      <button>focusable</button>
      <input aria-label="field" />
    </>
  )
}

describe('useKeyboard', () => {
  it('forwards mapped keys and prevents default', () => {
    const press = vi.fn()
    render(<Harness press={press} />)
    const notCancelled = fireEvent.keyDown(window, { key: '5' })
    expect(press).toHaveBeenCalledWith('5')
    expect(notCancelled).toBe(false)
  })
  it('ignores shortcuts with modifiers and typing in inputs', () => {
    const press = vi.fn()
    const { getByLabelText } = render(<Harness press={press} />)
    fireEvent.keyDown(window, { key: 'c', ctrlKey: true })
    fireEvent.keyDown(window, { key: '1', metaKey: true })
    fireEvent.keyDown(getByLabelText('field'), { key: '1' })
    expect(press).not.toHaveBeenCalled()
  })
  it('lets Enter activate a focused button natively', () => {
    const press = vi.fn()
    const { getByText } = render(<Harness press={press} />)
    fireEvent.keyDown(getByText('focusable'), { key: 'Enter' })
    expect(press).not.toHaveBeenCalled()
  })
})
