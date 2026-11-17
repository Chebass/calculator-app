import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useState } from 'react'
import { Display } from './components/Display'
import { Header } from './components/Header'
import { HistoryPanel } from './components/HistoryPanel'
import { Keypad } from './components/Keypad'
import { useCalculator, type CalculationRecord } from './hooks/useCalculator'
import { useHistory } from './hooks/useHistory'
import { useKeyboard } from './hooks/useKeyboard'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useTheme } from './hooks/useTheme'
import { describeRequest } from './lib/calculatorModel'
import type { HistoryEntry } from './types'

export default function App() {
  const reduce = useReducedMotion()
  const { theme, toggle } = useTheme()
  const history = useHistory()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { add: addToHistory } = history
  const onCalculated = useCallback((record: CalculationRecord) => void addToHistory(record.request), [addToHistory])
  const { state, loading, latencyMs, press, restore } = useCalculator({ onCalculated })
  useKeyboard(press)

  const restoreEntry = (entry: HistoryEntry) => {
    restore(entry.result, `${describeRequest({ operation: entry.operation, a: entry.a, b: entry.b })} =`)
    setDrawerOpen(false)
  }

  const panel = (onClose?: () => void) => (
    <HistoryPanel
      entries={history.entries}
      error={history.error}
      loaded={history.loaded}
      onRestore={restoreEntry}
      onUpdate={history.update}
      onRemove={(id) => void history.remove(id)}
      onClear={() => void history.clear()}
      onClose={onClose}
    />
  )

  return (
    <>
      <div className="ambient" aria-hidden="true" />
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 md:px-10">
        <Header
          theme={theme}
          onToggleTheme={toggle}
          onOpenHistory={() => setDrawerOpen(true)}
          historyCount={history.entries.length}
        />

        <main className="grid flex-1 content-start items-start gap-6 pb-10 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
          <motion.section
            aria-label="Calculator"
            className="glass mx-auto w-full max-w-[560px] rounded-[2rem] p-4 sm:p-6 lg:mx-0"
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

          {isDesktop && (
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {panel()}
            </motion.div>
          )}
        </main>

        <footer className="py-6 text-center text-xs text-ink-muted">SezzleMath · React + Go microservices</footer>
      </div>

      <AnimatePresence>
        {!isDesktop && drawerOpen && (
          <div className="fixed inset-0 z-50">
            <motion.button
              type="button"
              aria-label="Close history"
              className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className="absolute inset-y-0 right-0 w-[min(92vw,400px)] p-3"
              initial={reduce ? false : { x: '100%' }}
              animate={{ x: 0 }}
              exit={reduce ? undefined : { x: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 38 }}
            >
              <div className="h-full [&>section]:h-full [&>section]:max-h-none">{panel(() => setDrawerOpen(false))}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
