import { useCallback, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { ApiError } from '../api/http'
import { calculatorApi, type CalculatorApi } from '../api/calculator'
import {
  calcReducer,
  describeBinary,
  describeSqrt,
  initialState,
  parseEntry,
  readyToEvaluate,
  validateRequest,
  type CalcState,
} from '../lib/calculatorModel'
import type { ApiErrorBody, BinaryOperation, CalculateRequest } from '../types'

export type KeyId =
  | `${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | 'decimal'
  | 'negate'
  | 'backspace'
  | 'clear'
  | 'sqrt'
  | 'equals'
  | BinaryOperation

export interface CalculationRecord {
  request: CalculateRequest
  result: number
  expression: string
}

interface Options {
  api?: CalculatorApi
  /** Called after every successful calculation (used to save history). */
  onCalculated?: (record: CalculationRecord) => void
}

const OPERATIONS: ReadonlySet<string> = new Set<BinaryOperation>([
  'add',
  'subtract',
  'multiply',
  'divide',
  'power',
  'percentage',
])

function toError(cause: unknown): ApiErrorBody {
  if (cause instanceof ApiError) return { code: cause.code, message: cause.message }
  return { code: 'UNKNOWN_ERROR', message: 'Something went wrong. Please try again.' }
}

/** Connects the pure keypad model to the calculator-service. */
export function useCalculator({ api = calculatorApi, onCalculated }: Options = {}) {
  const [state, dispatch] = useReducer(calcReducer, initialState)
  const [loading, setLoading] = useState(false)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)

  // Handlers read the latest state without being recreated on every keystroke.
  const stateRef = useRef<CalcState>(state)
  useLayoutEffect(() => {
    stateRef.current = state
  }, [state])
  const busyRef = useRef(false)

  const run = useCallback(
    async (request: CalculateRequest, expression: string, next?: BinaryOperation) => {
      const invalid = validateRequest(request)
      if (invalid) {
        dispatch({ type: 'failed', error: invalid })
        return
      }
      busyRef.current = true
      setLoading(true)
      const started = performance.now()
      try {
        const { result } = await api.calculate(request)
        setLatencyMs(performance.now() - started)
        dispatch({ type: 'resolved', result, expression, next })
        onCalculated?.({ request, result, expression })
      } catch (cause) {
        dispatch({ type: 'failed', error: toError(cause) })
      } finally {
        busyRef.current = false
        setLoading(false)
      }
    },
    [api, onCalculated],
  )

  const press = useCallback(
    (key: KeyId) => {
      const current = stateRef.current
      if (busyRef.current) return

      if (key === 'clear') return dispatch({ type: 'clear' })
      if (key === 'backspace') return dispatch({ type: 'backspace' })
      if (key === 'negate') return dispatch({ type: 'negate' })
      if (key === 'decimal') return dispatch({ type: 'decimal' })

      if (key === 'equals') {
        if (!readyToEvaluate(current) || !current.operation) return
        const a = current.operand as number
        const b = parseEntry(current.entry)
        void run({ operation: current.operation, a, b }, describeBinary(a, current.operation, b))
        return
      }

      if (key === 'sqrt') {
        const a = parseEntry(current.entry)
        void run({ operation: 'sqrt', a }, describeSqrt(a))
        return
      }

      if (OPERATIONS.has(key)) {
        const operation = key as BinaryOperation
        // "2 + 3 +" computes 2 + 3 first, then continues the chain from 5.
        if (readyToEvaluate(current) && current.operation) {
          const a = current.operand as number
          const b = parseEntry(current.entry)
          void run({ operation: current.operation, a, b }, describeBinary(a, current.operation, b), operation)
          return
        }
        return dispatch({ type: 'operator', operation })
      }

      dispatch({ type: 'digit', digit: key })
    },
    [run],
  )

  /** Puts a past result back on the display (used by the history panel). */
  const restore = useCallback((result: number, expression: string) => {
    if (!busyRef.current) dispatch({ type: 'restore', result, expression })
  }, [])

  return { state, loading, latencyMs, press, restore }
}
