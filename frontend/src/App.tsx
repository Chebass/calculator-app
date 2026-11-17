import { motion, useReducedMotion } from 'motion/react'
import { Display } from './components/Display'
import { Header } from './components/Header'
import { Keypad } from './components/Keypad'
import { useCalculator } from './hooks/useCalculator'
import { useKeyboard } from './hooks/useKeyboard'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const reduce = useReducedMotion()
  const { theme, toggle } = useTheme()
  const { state, loading, latencyMs, press } = useCalculator()
  useKeyboard(press)

  return (
    <>
      <div className="ambient" aria-hidden="true" />
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 md:px-10">
        <Header theme={theme} onToggleTheme={toggle} onOpenHistory={() => {}} historyCount={0} />

        <main className="grid flex-1 content-start gap-6 pb-10 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
          <motion.section
            aria-label="Calculator"
            className="glass w-full rounded-[2rem] p-4 sm:p-6"
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Display
              entry={state.entry}
              expression={state.expression}
              error={state.error}
              loading={loading}
              latencyMs={latencyMs}
              resultId={state.resultId}
            />
            <Keypad
              onPress={press}
              activeOperation={state.awaitingOperand ? state.operation : null}
              disabled={loading}
            />
            <p className="mt-4 hidden text-center text-xs text-ink-muted sm:block">
              Press <kbd className="font-display">Enter</kbd> to calculate · <kbd className="font-display">Esc</kbd> to
              clear
            </p>
          </motion.section>
        </main>

        <footer className="py-6 text-center text-xs text-ink-muted">
          SezzleMath · React + Go microservices
        </footer>
      </div>
    </>
  )
}
