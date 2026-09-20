export const pad = (n: number) => String(n).padStart(2, '0')
export const midnight = (d: Date | number) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
export const addDays = (d: Date, n: number) => {
  const x = midnight(d)
  x.setDate(x.getDate() + n)
  return x
}
export const iso = (d: Date) => {
  const x = midnight(d)
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}
export const isoIn = (n: number) => iso(addDays(new Date(), n))
export const parse = (s: string) => new Date(s + 'T00:00:00')
export const daysUntil = (s: string) => Math.round((parse(s).getTime() - midnight(new Date()).getTime()) / 864e5)
export const mondayOf = (d: Date) => {
  const x = midnight(d)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}
export const weekIso = (k: number) => iso(addDays(mondayOf(new Date()), k))
export const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en', o)
export const fmtShort = (s: string) => fmt(parse(s), { month: 'short', day: 'numeric' })
export const timeOf = (ts: number) => new Date(ts).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })
export const dayLabel = (ts: number) => {
  const d = midnight(ts)
  const n = daysUntil(iso(d))
  return n === 0 ? 'Today' : n === -1 ? 'Yesterday' : fmt(d, { weekday: 'long', day: 'numeric', month: 'short' })
}
export const dueLabel = (s: string) => {
  const d = daysUntil(s)
  if (d < 0) return `Overdue ${-d}d`
  if (d === 0) return 'Due today'
  if (d === 1) return 'Tomorrow'
  if (d < 7) return `In ${d} days`
  return fmtShort(s)
}
export const monthKey = (off: number) => {
  const n = new Date()
  const d = new Date(n.getFullYear(), n.getMonth() + off, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}
