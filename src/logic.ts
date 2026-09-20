import { REM } from './constants'
import { daysUntil, fmtShort } from './dates'
import type { Data, MonthData, Notif, Task } from './types'

export const courseOf = (d: Data, id: string) => d.courses.find((c) => c.id === id)

export const isSoon = (t: Task) => {
  if (t.status === 'done' || !t.due || t.reminder === 'none') return false
  const d = daysUntil(t.due)
  return d >= 0 && d <= parseInt(t.reminder, 10)
}
export const isOver = (t: Task) => t.status !== 'done' && !!t.due && daysUntil(t.due) < 0

export const alertsOf = (d: Data) =>
  d.tasks.filter((t) => isSoon(t) || isOver(t)).sort((a, b) => (a.due < b.due ? -1 : 1))

export const emptyMonth = (): MonthData => ({
  win: '', fail: '', proud: '', focus: '', grateful: '', rating: {},
  goals: Array.from({ length: 5 }, () => ({ text: '', done: false })),
})

export const uid = () => 'x' + Math.random().toString(36).slice(2, 9)

/**
 * What a real push would have sent: one message per task per due date when the
 * reminder window opens, and one "overdue" per task. Returns only the new ones.
 */
export function syncNotifs(d: Data): Notif[] {
  const have = new Set(d.notifs.map((n) => n.k))
  const out: Notif[] = []
  for (const t of d.tasks) {
    const kind = isOver(t) ? 'over' : isSoon(t) ? 'soon' : null
    if (!kind) continue
    const k = `${t.id}|${kind}|${t.due}`
    if (have.has(k)) continue
    const c = courseOf(d, t.courseId)
    const pre = c ? c.title + ' · ' : ''
    const days = daysUntil(t.due)
    out.push({
      id: 'n_' + k, k, ts: Date.now() + out.length, taskId: t.id, read: false,
      title: kind === 'over'
        ? `Overdue: ${t.title}`
        : (days === 0 ? 'Due today: ' : days === 1 ? 'Due tomorrow: ' : `Due in ${days} days: `) + t.title,
      body: kind === 'over' ? `${pre}was due ${fmtShort(t.due)}` : `${pre}reminder set ${REM[t.reminder].toLowerCase()}`,
    })
  }
  return out
}
