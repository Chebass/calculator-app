import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { withGrouping } from '../lib/format'
import type { ApiErrorBody } from '../types'
import { CheckIcon, CopyIcon } from './icons'

interface DisplayProps {
  entry: string
  expression: string
  error: ApiErrorBody | null
  resultId: number
}

function sizeClass(length: number): string {
  if (length <= 8) return 'text-5xl sm:text-6xl'
  if (length <= 11) return 'text-4xl sm:text-5xl'
  if (length <= 14) return 'text-3xl sm:text-4xl'
  return 'text-2xl sm:text-3xl'
}

export function Display({ entry, expression, error, resultId }: DisplayProps) {
  const reduce = useReducedMotion()
  const [copied, setCopied] = useState(false)
  const shown = withGrouping(entry)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(entry)
      setCopied(true)
    } catch {
      // Clipboard may be blocked; the button simply does nothing.
    }
  }

  return (
    <motion.section
      aria-label="Calculator display"
      className="rounded-3xl bg-screen p-4 shadow-[var(--screen-shadow)] sm:p-6"
      animate={error && !reduce ? { x: [0, -10, 10, -7, 7, -3, 0] } : { x: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex items-center justify-end gap-2 text-xs">
        <button
          type="button"
          onClick={copy}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 font-display font-medium uppercase tracking-wider text-ink-muted transition-colors hover:text-ink"
          aria-label="Copy result"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={copied ? 'done' : 'copy'}
              initial={reduce ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduce ? undefined : { scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid place-items-center"
            >
              {copied ? <CheckIcon width={16} height={16} /> : <CopyIcon width={16} height={16} />}
            </motion.span>
          </AnimatePresence>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div
        className="mt-4 flex min-h-8 justify-end overflow-hidden whitespace-nowrap font-display text-lg text-ink-muted sm:text-xl"
        data-testid="expression"
      >
        {expression || ' '}
      </div>

      <div className="overflow-hidden pb-1 text-right">
        <motion.output
          key={resultId}
          aria-label="Result"
          aria-live="polite"
          initial={reduce || resultId === 0 ? false : { opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className={`block font-display font-medium tabular-nums tracking-tight ${sizeClass(shown.length)} ${error ? 'text-ink-muted' : ''}`}
        >
          {shown}
        </motion.output>
      </div>

      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            key={error.code}
            role="alert"
            className="mt-2 overflow-hidden rounded-xl bg-danger-soft px-3 py-2 text-left text-sm font-medium text-danger"
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduce ? undefined : { opacity: 0, height: 0 }}
          >
            {error.message}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
