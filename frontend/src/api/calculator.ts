import type { CalculateRequest, CalculateResponse } from '../types'
import { requestJson } from './http'

const BASE = '/api/calc/v1'

/** Client for the calculator-service. */
export interface CalculatorApi {
  calculate(request: CalculateRequest): Promise<CalculateResponse>
}

export const calculatorApi: CalculatorApi = {
  calculate: (request) => requestJson<CalculateResponse>(`${BASE}/calculate`, { method: 'POST', body: request }),
}
