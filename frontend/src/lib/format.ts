/**
 * Turns a result into a display string. Rounding to 12 significant digits hides
 * binary floating point noise (0.1 + 0.2 shows 0.3, not 0.30000000000000004).
 */
export function formatResult(value: number): string {
  if (Object.is(value, -0)) return '0'
  return String(Number(value.toPrecision(12)))
}

const DECIMAL = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i

/**
 * Strict decimal parser for typed input. Unlike Number(), it rejects hex/binary
 * literals ("0x10"), "Infinity" and empty strings; surrounding spaces are fine.
 */
export function parseDecimal(text: string): number | null {
  const trimmed = text.trim()
  if (!DECIMAL.test(trimmed)) return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

/** Adds thousands separators to the integer part of a numeric string for display only. */
export function withGrouping(numeric: string): string {
  if (numeric === '' || /[eE]/.test(numeric)) return numeric
  const negative = numeric.startsWith('-')
  const [integer, fraction] = (negative ? numeric.slice(1) : numeric).split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${negative ? '-' : ''}${grouped}${fraction === undefined ? '' : `.${fraction}`}`
}
