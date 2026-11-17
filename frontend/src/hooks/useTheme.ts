import { useCallback, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'sezzlemath-theme'

function readInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage can be unavailable (private mode); fall through.
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/**
 * Theme state persisted in localStorage and mirrored on <html data-theme>.
 * `toggle` plays a circular reveal from the clicked point when the browser
 * supports the View Transitions API and the user has not asked for reduced motion.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  const toggle = useCallback((origin?: { x: number; y: number }) => {
    const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduceMotion) {
      setTheme(next)
      return
    }
    const root = document.documentElement
    root.style.setProperty('--reveal-x', `${origin?.x ?? window.innerWidth / 2}px`)
    root.style.setProperty('--reveal-y', `${origin?.y ?? 0}px`)
    document.startViewTransition(() => {
      // Apply synchronously so the browser captures the new theme as the "after" frame.
      flushSync(() => setTheme(next))
      root.dataset.theme = next
    })
  }, [])

  return { theme, toggle }
}
