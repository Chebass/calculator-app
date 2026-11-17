import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Theme } from '../hooks/useTheme'
import { HistoryIcon, LogoMark, MoonIcon, SunIcon } from './icons'

interface HeaderProps {
  theme: Theme
  onToggleTheme: (origin: { x: number; y: number }) => void
  onOpenHistory: () => void
  historyCount: number
}

const iconButton =
  'relative grid size-11 place-items-center rounded-full border border-edge bg-key-digit text-ink-fn ' +
  'shadow-[var(--key-shadow)] transition-colors hover:text-ink cursor-pointer'

export function Header({ theme, onToggleTheme, onOpenHistory, historyCount }: HeaderProps) {
  const reduce = useReducedMotion()
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <header className="flex items-center justify-between py-5">
      <motion.div
        className="flex items-center gap-3"
        initial={reduce ? false : { opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <span className="grid size-11 place-items-center rounded-2xl bg-accent text-accent-ink shadow-[0_8px_24px_-8px_var(--accent-glow)]">
          <LogoMark />
        </span>
        <div className="leading-tight">
          <h1 className="font-display text-xl font-semibold tracking-tight">SezzleMath</h1>
          <p className="text-xs text-ink-muted">Precise arithmetic, served by Go</p>
        </div>
      </motion.div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`${iconButton} lg:hidden`}
          onClick={onOpenHistory}
          aria-label={`Open history (${historyCount} entries)`}
        >
          <HistoryIcon />
          {historyCount > 0 && (
            <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-5 text-accent-ink">
              {historyCount > 99 ? '99+' : historyCount}
            </span>
          )}
        </button>
        <button
          type="button"
          className={iconButton}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            onToggleTheme({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
          }}
          aria-label={`Switch to ${next} mode`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              className="grid place-items-center"
              initial={reduce ? false : { rotate: -90, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={reduce ? undefined : { rotate: 90, scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </header>
  )
}
