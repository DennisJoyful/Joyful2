// lib/time/berlin.ts
export function addDaysBerlinLocalDate(days: number): string {
  // Europe/Berlin without external deps: approximate by using system tz if set to UTC; we compute from UTC and then get YYYY-MM-DD.
  const now = new Date()
  const plus = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  // Format YYYY-MM-DD from local time - acceptable for date column
  const y = plus.getFullYear()
  const m = String(plus.getMonth() + 1).padStart(2, '0')
  const d = String(plus.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}