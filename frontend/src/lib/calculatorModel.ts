import type { ApiErrorBody, BinaryOperation, CalculateRequest } from '../types'
import { formatResult, withGrouping } from './format'

/**
 * Pure model of the calculator keypad ("chain calculator": a op b = ...).
 * It never talks to the network; the hook feeds it the results of API calls.
 */
export interface CalcState {
  /** Text of the number being typed (or the last result). */
  entry: string
  /** Left operand once a binary operator has been chosen. */
  operand: number | null
  operation: BinaryOperation | null
  /** An operator was just pressed; the next digit starts the right operand. */
  awaitingOperand: boolean
  /** `entry` is a computed result; the next digit replaces it. */
  overwrite: boolean
  /** Line shown above the result, e.g. "250 × 14 =". */
  expression: string
  error: ApiErrorBody | null
  /** Bumped whenever a new result is shown so the UI can animate it. */
  resultId: number
}

export type CalcAction =
  | { type: 'digit'; digit: string }
  | { type: 'decimal' }
  | { type: 'negate' }
  | { type: 'backspace' }
  | { type: 'clear' }
  | { type: 'operator'; operation: BinaryOperation }
  | { type: 'resolved'; result: number; expression: string; next?: BinaryOperation }
  | { type: 'failed'; error: ApiErrorBody }
  /** Load a past result (from history) back onto the display. */
  | { type: 'restore'; result: number; expression: string }

export const MAX_DIGITS = 15

export const OPERATION_SYMBOL: Record<BinaryOperation, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
  power: '^',
  percentage: '% of',
}

export const initialState: CalcState = {
  entry: '0',
  operand: null,
  operation: null,
  awaitingOperand: false,
  overwrite: false,
  expression: '',
  error: null,
  resultId: 0,
}

export function calcReducer(state: CalcState, action: CalcAction): CalcState {
  if (action.type === 'clear') return { ...initialState, resultId: state.resultId }
  if (action.type === 'resolved') return applyResult(state, action)
  if (action.type === 'failed') return { ...state, error: action.error }
  if (action.type === 'restore') {
    return {
      ...initialState,
      entry: formatResult(action.result),
      overwrite: true,
      expression: action.expression,
      resultId: state.resultId + 1,
    }
  }

  // Any other key dismisses a previous error.
  const base: CalcState = state.error ? { ...state, error: null } : state

  switch (action.type) {
    case 'digit':
      return typeDigit(base, action.digit)
    case 'decimal':
      return typeDecimal(base)
    case 'negate':
      return negate(base)
    case 'backspace':
      return backspace(base)
    case 'operator':
      return chooseOperator(base, action.operation)
  }
}

function startsNewEntry(state: CalcState): boolean {
  return state.overwrite || state.awaitingOperand
}

function typeDigit(state: CalcState, digit: string): CalcState {
  if (startsNewEntry(state)) {
    return { ...state, entry: digit, awaitingOperand: false, overwrite: false }
  }
  if (state.entry === '0') return { ...state, entry: digit }
  if (state.entry === '-0') return { ...state, entry: `-${digit}` }
  if (state.entry.replace(/[-.]/g, '').length >= MAX_DIGITS) return state
  return { ...state, entry: state.entry + digit }
}

function typeDecimal(state: CalcState): CalcState {
  if (startsNewEntry(state)) {
    return { ...state, entry: '0.', awaitingOperand: false, overwrite: false }
  }
  if (state.entry.includes('.')) return state
  return { ...state, entry: `${state.entry}.` }
}

function negate(state: CalcState): CalcState {
  if (state.awaitingOperand || parseEntry(state.entry) === 0) return state
  const entry = state.entry.startsWith('-') ? state.entry.slice(1) : `-${state.entry}`
  return { ...state, entry }
}

function backspace(state: CalcState): CalcState {
  // Trimming "1e+21" character by character would silently change its value.
  if (state.awaitingOperand || /e/i.test(state.entry)) return state
  const next = state.entry.slice(0, -1)
  const entry = next === '' || next === '-' ? '0' : next
  return { ...state, entry, overwrite: false }
}

function chooseOperator(state: CalcState, operation: BinaryOperation): CalcState {
  // Changing your mind about the operator before typing the right operand.
  if (state.operation && state.awaitingOperand && state.operand !== null) {
    return { ...state, operation, expression: describeLeft(state.operand, operation) }
  }
  const operand = parseEntry(state.entry)
  return {
    ...state,
    operand,
    operation,
    awaitingOperand: true,
    overwrite: false,
    expression: describeLeft(operand, operation),
  }
}

function applyResult(
  state: CalcState,
  { result, expression, next }: Extract<CalcAction, { type: 'resolved' }>,
): CalcState {
  return {
    ...state,
    entry: formatResult(result),
    operand: next ? result : null,
    operation: next ?? null,
    awaitingOperand: next !== undefined,
    overwrite: true,
    expression: next ? describeLeft(result, next) : expression,
    error: null,
    resultId: state.resultId + 1,
  }
}

export function parseEntry(entry: string): number {
  return Number.parseFloat(entry)
}

function describeLeft(operand: number, operation: BinaryOperation): string {
  return `${withGrouping(formatResult(operand))} ${OPERATION_SYMBOL[operation]}`
}

/** Text for a calculation without the trailing "=", e.g. "250 × 14" or "√(144)". */
export function describeRequest(request: CalculateRequest): string {
  if (request.operation === 'sqrt') return `√(${withGrouping(formatResult(request.a))})`
  return `${describeLeft(request.a, request.operation)} ${withGrouping(formatResult(request.b ?? 0))}`
}

/** Text for a finished binary calculation, e.g. "250 × 14 =". */
export function describeBinary(a: number, operation: BinaryOperation, b: number): string {
  return `${describeRequest({ operation, a, b })} =`
}

/** Text for a finished square root, e.g. "√(144) =". */
export function describeSqrt(a: number): string {
  return `${describeRequest({ operation: 'sqrt', a })} =`
}

/** True when pressing "=" (or another operator) should compute `operand op entry`. */
export function readyToEvaluate(state: CalcState): boolean {
  return state.operation !== null && state.operand !== null && !state.awaitingOperand
}

/** Mirrors the server's rules so obvious mistakes are reported instantly. */
export function validateRequest(request: CalculateRequest): ApiErrorBody | null {
  if (request.operation === 'divide' && request.b === 0) {
    return { code: 'DIVISION_BY_ZERO', message: 'Cannot divide by zero.' }
  }
  if (request.operation === 'sqrt' && request.a < 0) {
    return { code: 'NEGATIVE_SQRT', message: 'Cannot take the square root of a negative number.' }
  }
  return null
}
