import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { describeRequest, OPERATION_SYMBOL } from '../lib/calculatorModel'
import { formatResult, withGrouping } from '../lib/format'
import type { CalculateRequest, HistoryEntry, OperationName } from '../types'
import { CloseIcon, EditIcon, TrashIcon } from './icons'

interface HistoryPanelProps {
  entries: HistoryEntry[]
  error: string | null
  loaded: boolean
  onRestore: (entry: HistoryEntry) => void
  onUpdate: (id: number, input: CalculateRequest) => Promise<boolean>
  onRemove: (id: number) => void
  onClear: () => void
  /** Shown only in the mobile drawer. */
  onClose?: () => void
}

const OPERATION_OPTIONS: { value: OperationName; label: string }[] = [
  { value: 'add', label: `Add (${OPERATION_SYMBOL.add})` },
  { value: 'subtract', label: `Subtract (${OPERATION_SYMBOL.subtract})` },
  { value: 'multiply', label: `Multiply (${OPERATION_SYMBOL.multiply})` },
  { value: 'divide', label: `Divide (${OPERATION_SYMBOL.divide})` },
  { value: 'power', label: 'Power (^)' },
  { value: 'percentage', label: 'Percentage (% of)' },
  { value: 'sqrt', label: 'Square root (√)' },
]

const toRequest = (e: HistoryEntry): CalculateRequest => ({ operation: e.operation, a: e.a, b: e.b })

export function HistoryPanel({ entries, error, loaded, onRestore, onUpdate, onRemove, onClear, onClose }: HistoryPanelProps) {
  const reduce = useReducedMotion()
  const [editingId, setEditingId] = useState<number | null>(null)

  return (
    <section aria-label="History" className="glass flex h-full min-h-0 flex-col rounded-[2rem] p-4 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-semibold tracking-tight">History</h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-edge px-2.5 py-1 font-display text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            {entries.length} saved
          </span>
          {entries.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:text-danger"
            >
              Clear all
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close history"
              className="grid size-8 cursor-pointer place-items-center rounded-full text-ink-muted hover:text-ink"
            >
              <CloseIcon width={18} height={18} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-3 rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {loaded && entries.length === 0 && !error && (
        <p className="py-8 text-center text-sm text-ink-muted">
          No calculations yet. Results you compute are saved here.
        </p>
      )}

      <ul className="-mr-2 scroll-themed min-h-0 flex-1 space-y-2.5 overflow-y-auto overflow-x-hidden py-3 pr-2">
        <AnimatePresence initial={false} mode="popLayout">
          {entries.map((entry) => (
            <motion.li
              key={entry.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, x: 28, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, x: -28, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className="rounded-2xl bg-screen"
            >
              {editingId === entry.id ? (
                <EditForm
                  entry={entry}
                  onCancel={() => setEditingId(null)}
                  onSave={async (input) => {
                    if (await onUpdate(entry.id, input)) setEditingId(null)
                  }}
                />
              ) : (
                <div className="group flex items-stretch">
                  <button
                    type="button"
                    onClick={() => onRestore(entry)}
                    aria-label={`Reload ${describeRequest(toRequest(entry))} = ${formatResult(entry.result)}`}
                    className="min-w-0 flex-1 cursor-pointer rounded-2xl p-3.5 text-left transition-colors hover:bg-key-fn/40"
                  >
                    <span className="flex items-center justify-between gap-2 text-xs text-ink-muted">
                      <span className="truncate font-display">{describeRequest(toRequest(entry))}</span>
                      <time dateTime={entry.createdAt} className="shrink-0 font-display tabular-nums">
                        {new Date(entry.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </time>
                    </span>
                    <span className="mt-1 block truncate font-display text-2xl font-medium tabular-nums">
                      = {withGrouping(formatResult(entry.result))}
                    </span>
                  </button>
                  <div className="flex flex-col justify-center gap-1 pr-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(entry.id)}
                      aria-label={`Edit ${describeRequest(toRequest(entry))}`}
                      className="grid size-8 cursor-pointer place-items-center rounded-full text-ink-muted transition-colors hover:bg-key-fn hover:text-ink"
                    >
                      <EditIcon width={16} height={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(entry.id)}
                      aria-label={`Delete ${describeRequest(toRequest(entry))}`}
                      className="grid size-8 cursor-pointer place-items-center rounded-full text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
                    >
                      <TrashIcon width={16} height={16} />
                    </button>
                  </div>
                </div>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  )
}

interface EditFormProps {
  entry: HistoryEntry
  onSave: (input: CalculateRequest) => Promise<void>
  onCancel: () => void
}

const fieldClass =
  'w-full rounded-xl border border-edge bg-key-digit px-3 py-2 font-display text-sm text-ink outline-none focus:border-accent'

function EditForm({ entry, onSave, onCancel }: EditFormProps) {
  const [operation, setOperation] = useState<OperationName>(entry.operation)
  const [a, setA] = useState(String(entry.a))
  const [b, setB] = useState(entry.b === undefined ? '' : String(entry.b))
  const [problem, setProblem] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const unary = operation === 'sqrt'

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const numA = Number(a)
    const numB = Number(b)
    if (a.trim() === '' || !Number.isFinite(numA)) return setProblem('First value must be a number.')
    if (!unary && (b.trim() === '' || !Number.isFinite(numB))) return setProblem('Second value must be a number.')
    setProblem(null)
    setSaving(true)
    await onSave(unary ? { operation, a: numA } : { operation, a: numA, b: numB })
    setSaving(false)
  }

  return (
    <form onSubmit={submit} className="space-y-2.5 p-3.5" aria-label="Edit calculation">
      <select
        aria-label="Operation"
        value={operation}
        onChange={(e) => setOperation(e.target.value as OperationName)}
        className={fieldClass}
      >
        {OPERATION_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2.5">
        <input aria-label="First value" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} className={fieldClass} />
        <input
          aria-label="Second value"
          inputMode="decimal"
          value={unary ? '' : b}
          disabled={unary}
          placeholder={unary ? 'n/a' : ''}
          onChange={(e) => setB(e.target.value)}
          className={`${fieldClass} disabled:opacity-40`}
        />
      </div>
      {problem && (
        <p role="alert" className="text-xs font-medium text-danger">
          {problem}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="cursor-pointer rounded-full px-3.5 py-1.5 text-sm text-ink-muted hover:text-ink">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="cursor-pointer rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
