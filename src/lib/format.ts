const inrFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

/** ₹1,50,000 (Indian digit grouping). */
export function inr(amount: number): string {
  return `₹${inrFormat.format(Math.round(amount))}`
}

/** Compact Indian count: 950, 12,400, 1.3 lakh, 2.1 crore. */
export function count(n: number): string {
  if (n >= 10000000) return `${trim(n / 10000000)} crore`
  if (n >= 100000) return `${trim(n / 100000)} lakh`
  return inrFormat.format(Math.round(n))
}

export function range(low: number, high: number): string {
  return `${count(low)}–${count(high)}`
}

export function percent(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`
}

export function daysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(ms / 86400000) + 1
}

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, '')
}
