import { STATUS } from '../constants'
import { useApp } from '../context'
import { dueLabel } from '../dates'
import { alertsOf, isOver } from '../logic'
import type { Task } from '../types'

const svg = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const Check = () => (
  <svg viewBox="0 0 24 24" {...svg} strokeWidth={3.4}><path d="M5 12.5 10 17.5 19 7" /></svg>
)
export const Bell = () => (
  <svg viewBox="0 0 24 24" {...svg} strokeWidth={1.7}>
    <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
)
export const Prev = () => (
  <svg viewBox="0 0 24 24" {...svg} strokeWidth={1.8}><path d="m14 6-6 6 6 6" /></svg>
)
export const Next = () => (
  <svg viewBox="0 0 24 24" {...svg} strokeWidth={1.8}><path d="m10 6 6 6-6 6" /></svg>
)
export const Pen = () => (
  <svg viewBox="0 0 24 24" {...svg} strokeWidth={1.7}>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </svg>
)

/** The circle you tap to move a task: empty, half, done. */
export function StatusBtn({ t }: { t: Task }) {
  const { cycle } = useApp()
  return (
    <button
      className="st"
      data-s={t.status}
      onClick={() => cycle(t.id)}
      aria-label={`${t.title} — ${STATUS[t.status]}. Tap to change status.`}
    >
      <i>{t.status === 'done' && <Check />}</i>
    </button>
  )
}

/** "Reminder: needs you now" — overdue and inside-the-reminder-window tasks. */
export function AlertBox() {
  const { data, openBell } = useApp()
  const al = alertsOf(data)
  if (!al.length) return null
  return (
    <section className="alert" aria-label="Due soon">
      <span className="bl">Reminder: needs you now</span>
      <ul>
        {al.slice(0, 4).map((t) => (
          <li key={t.id} className={isOver(t) ? 'over' : ''}>
            <span>{t.title}</span>
            <em>{dueLabel(t.due)}</em>
          </li>
        ))}
      </ul>
      <button className="link" onClick={openBell}>See all notifications</button>
    </section>
  )
}
