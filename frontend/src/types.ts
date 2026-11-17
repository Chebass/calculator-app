/** Operation names understood by the calculator-service. */
export type OperationName =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'power'
  | 'sqrt'
  | 'percentage'

/** Binary operations the user can chain from the keypad. */
export type BinaryOperation = Exclude<OperationName, 'sqrt'>

export interface CalculateRequest {
  operation: OperationName
  a: number
  b?: number
}

export interface CalculateResponse {
  operation: OperationName
  result: number
}

/** A stored calculation returned by the history-service. */
export interface HistoryEntry {
  id: number
  operation: OperationName
  a: number
  b?: number
  result: number
  createdAt: string
  updatedAt: string
}

/** Stable, machine-readable error returned by the services. */
export interface ApiErrorBody {
  code: string
  message: string
}
