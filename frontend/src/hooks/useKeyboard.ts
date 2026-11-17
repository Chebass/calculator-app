import { useEffect } from 'react'
import type { KeyId } from './useCalculator'

const KEY_MAP: Record<string, KeyId> = {
  '.': 'decimal',
  ',': 'decimal',
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  x: 'multiply',
  '/': 'divide',
  '^': 'power',
  '%': 'percentage',
  Enter: 'equals',
  '=': 'equals',
  Backspace: 'backspace',
  Escape: 'clear',
  Delete: 'clear',
}

/** Maps a KeyboardEvent key to a keypad key, or null when it is not ours. */
export function keyFromEvent(key: string): KeyId | null {
  if (/^[0-9]$/.test(key)) return key as KeyId
  return KEY_MAP[key] ?? null
}

/** Physical keyboard support: digits, operators, Enter = calculate, Esc = clear. */
export function useKeyboard(press: (key: KeyId) => void, onPressed?: (key: KeyId) => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target as HTMLElement | null
      // Let Enter/Space activate a focused button natively instead of double-firing.
      if (target?.tagName === 'BUTTON' && (event.key === 'Enter' || event.key === ' ')) return
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      const key = keyFromEvent(event.key)
      if (!key) return
      event.preventDefault()
      press(key)
      onPressed?.(key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [press, onPressed])
}
