import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import type { KeyId } from '../hooks/useCalculator'
import type { BinaryOperation } from '../types'
import { BackspaceIcon } from './icons'

type Variant = 'digit' | 'fn' | 'op' | 'clear' | 'equals'

interface KeyDef {
  id: KeyId
  label: ReactNode
  name: string
  variant: Variant
  span?: 2
}

const KEYS: KeyDef[] = [
  { id: 'power', label: <>x<sup className="text-[0.6em]">y</sup></>, name: 'Power', variant: 'fn' },
  { id: 'sqrt', label: '√x', name: 'Square root', variant: 'fn' },
  { id: 'percentage', label: '%', name: 'Percentage', variant: 'fn' },
  { id: 'negate', label: '±', name: 'Toggle sign', variant: 'fn' },
  { id: 'clear', label: 'AC', name: 'All clear', variant: 'clear', span: 2 },
  { id: 'backspace', label: <BackspaceIcon />, name: 'Backspace', variant: 'fn' },
  { id: 'divide', label: '÷', name: 'Divide', variant: 'op' },
  { id: '7', label: '7', name: '7', variant: 'digit' },
  { id: '8', label: '8', name: '8', variant: 'digit' },
  { id: '9', label: '9', name: '9', variant: 'digit' },
  { id: 'multiply', label: '×', name: 'Multiply', variant: 'op' },
  { id: '4', label: '4', name: '4', variant: 'digit' },
  { id: '5', label: '5', name: '5', variant: 'digit' },
  { id: '6', label: '6', name: '6', variant: 'digit' },
  { id: 'subtract', label: '−', name: 'Subtract', variant: 'op' },
  { id: '1', label: '1', name: '1', variant: 'digit' },
  { id: '2', label: '2', name: '2', variant: 'digit' },
  { id: '3', label: '3', name: '3', variant: 'digit' },
  { id: 'add', label: '+', name: 'Add', variant: 'op' },
  { id: '0', label: '0', name: '0', variant: 'digit', span: 2 },
  { id: 'decimal', label: '.', name: 'Decimal point', variant: 'digit' },
  { id: 'equals', label: '=', name: 'Equals', variant: 'equals' },
]

const VARIANT_CLASS: Record<Variant, string> = {
  digit: 'bg-key-digit text-ink text-2xl',
  fn: 'bg-key-fn text-ink-fn text-lg',
  op: 'bg-key-op text-accent text-3xl dark:text-accent-soft',
  clear: 'bg-key-fn text-accent text-xl',
  equals: 'bg-accent text-accent-ink text-3xl shadow-[0_0_28px_var(--accent-glow),var(--key-shadow)]',
}

interface KeypadProps {
  onPress: (key: KeyId) => void
  /** Operator waiting for its right-hand operand; highlighted on the keypad. */
  activeOperation: BinaryOperation | null
  disabled?: boolean
}

export function Keypad({ onPress, activeOperation, disabled }: KeypadProps) {
  const reduce = useReducedMotion()

  return (
    <div className="mt-4 grid min-h-0 flex-1 grid-cols-4 grid-rows-6 gap-2.5 sm:gap-3" role="group" aria-label="Calculator keypad">
      {KEYS.map((key) => {
        const active = activeOperation === key.id
        const isOperator = key.variant === 'op' || key.id === 'power' || key.id === 'percentage'
        return (
          <motion.button
            key={key.id}
            type="button"
            aria-label={key.name}
            aria-pressed={isOperator ? active : undefined}
            data-key={key.id}
            disabled={disabled && key.id !== 'clear'}
            onClick={() => onPress(key.id)}
            whileTap={reduce ? undefined : { scale: 0.92 }}
            whileHover={reduce ? undefined : { y: -2 }}
            transition={{ type: 'spring', stiffness: 520, damping: 26 }}
            className={`relative grid h-full min-h-0 cursor-pointer place-items-center overflow-hidden rounded-full border border-edge font-display font-medium shadow-[var(--key-shadow)] transition-colors select-none disabled:cursor-wait disabled:opacity-70 ${
              key.span === 2 ? 'col-span-2' : ''
            } ${VARIANT_CLASS[key.variant]} ${key.variant === 'equals' ? 'border-transparent' : ''}`}
          >
            {active && (
              <motion.span
                layoutId="active-operator"
                className="absolute inset-0 rounded-full bg-accent shadow-[0_0_22px_var(--accent-glow)]"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span className={`relative z-10 ${active ? 'text-accent-ink' : ''}`}>{key.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
