import { act, renderHook } from '@testing-library/react'
import { useTheme } from './useTheme'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
  delete (document as { startViewTransition?: unknown }).startViewTransition
})

describe('useTheme', () => {
  it('defaults to dark and applies it to <html>', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('respects a stored preference', () => {
    localStorage.setItem('sezzlemath-theme', 'light')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('toggles and persists without View Transitions support', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggle())
    expect(result.current.theme).toBe('light')
    expect(localStorage.getItem('sezzlemath-theme')).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('uses a circular view transition when available', () => {
    const startViewTransition = vi.fn((cb: () => void) => cb())
    Object.assign(document, { startViewTransition })
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggle({ x: 10, y: 20 }))
    expect(startViewTransition).toHaveBeenCalledOnce()
    expect(document.documentElement.style.getPropertyValue('--reveal-x')).toBe('10px')
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
