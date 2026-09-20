import { useState } from 'react'
import { CATS } from '../constants'
import { useApp } from '../context'
import { monthKey } from '../dates'
import { emptyMonth, uid } from '../logic'
import type { Data, MonthData } from '../types'
import { Check } from './bits'
import { Head } from './Head'

const PROMPTS: [keyof MonthData, string][] = [
  ['win', 'Last month’s win'],
  ['fail', 'What didn’t work last month?'],
  ['proud', 'What am I proud of?'],
  ['focus', 'What will I work on this month?'],
  ['grateful', 'What am I grateful for?'],
]

export function MonthPage() {
  const { data, update, monthOff } = useApp()
  const [newHabit, setNewHabit] = useState('')
  const key = monthKey(monthOff)
  const m = data.months[key] ?? emptyMonth()
  const n = new Date()
  const base = new Date(n.getFullYear(), n.getMonth() + monthOff, 1)
  const dim = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()

  const editMonth = (fn: (m: MonthData) => void) =>
    update((d) => {
      d.months[key] ??= emptyMonth()
      fn(d.months[key])
    })
  const editMarks = (hid: string, day: number) =>
    update((d: Data) => {
      const mk = (d.marks[key] ??= {})
      const arr = (mk[hid] ??= [])
      const i = arr.indexOf(day)
      if (i > -1) arr.splice(i, 1)
      else arr.push(day)
    })

  return (
    <>
      <Head />
      <h2 className="ptitle big">Let’s get it done.</h2>

      <div className="rate">
        <span className="bl">Last month’s rating</span>
        <div className="rtab">
          {CATS.map((c) => (
            <div key={c} className="rr">
              <span className="rl">{c}</span>
              <div className="dots">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                  <button
                    key={v}
                    className="dot"
                    aria-pressed={v <= (m.rating[c] ?? 0)}
                    aria-label={`${c}: ${v} of 10`}
                    onClick={() => editMonth((mm) => { mm.rating[c] = mm.rating[c] === v ? 0 : v })}
                  >
                    <i />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {PROMPTS.map(([field, label]) => (
        <label key={field} className="ask" htmlFor={'m-' + field}>
          <span>{label}</span>
          <input
            type="text"
            id={'m-' + field}
            autoComplete="off"
            value={m[field] as string}
            onChange={(e) => editMonth((mm) => { (mm[field] as string) = e.target.value })}
          />
        </label>
      ))}

      <div className="sh"><h3>Monthly Goals</h3><span>Big goals, daily commitment.</span></div>
      {m.goals.map((g, i) => (
        <div key={i} className="goal">
          <button
            className="gc"
            aria-pressed={g.done}
            aria-label={`Goal ${i + 1} done`}
            onClick={() => editMonth((mm) => { mm.goals[i].done = !mm.goals[i].done })}
          >
            <i>{g.done && <Check />}</i>
          </button>
          <input
            type="text"
            id={'g-' + i}
            className={g.done ? 'done' : ''}
            autoComplete="off"
            aria-label={`Goal ${i + 1}`}
            value={g.text}
            onChange={(e) => editMonth((mm) => { mm.goals[i].text = e.target.value })}
          />
        </div>
      ))}

      <div className="sh"><h3>Habit tracker</h3></div>
      {data.habits.map((hb) => {
        const on = data.marks[key]?.[hb.id] ?? []
        return (
          <div key={hb.id} className="habit">
            <div className="hname">
              <input
                type="text"
                id={'hn-' + hb.id}
                aria-label="Habit name"
                autoFocus={hb.id === newHabit}
                value={hb.name}
                onChange={(e) => update((d) => { const h = d.habits.find((x) => x.id === hb.id); if (h) h.name = e.target.value })}
              />
              <button className="x" aria-label="Remove habit" onClick={() => update((d) => { d.habits = d.habits.filter((x) => x.id !== hb.id) })}>×</button>
            </div>
            <div className="hg">
              {Array.from({ length: 32 }, (_, i) => i + 1).map((day) =>
                day > dim ? (
                  <span key={day} className="hc" />
                ) : (
                  <button
                    key={day}
                    className={'hc' + (on.includes(day) ? ' on' : '') + (monthOff === 0 && day === n.getDate() ? ' now' : '')}
                    aria-pressed={on.includes(day)}
                    aria-label={`${hb.name}, day ${day}`}
                    onClick={() => editMarks(hb.id, day)}
                  >
                    {day}
                  </button>
                ),
              )}
            </div>
          </div>
        )
      })}
      <button
        className="ghost"
        onClick={() => {
          const id = uid()
          update((d) => { d.habits.push({ id, name: '' }) })
          setNewHabit(id)
        }}
      >
        + Add a habit
      </button>
    </>
  )
}
