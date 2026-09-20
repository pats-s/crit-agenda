import { QUOTES } from '../constants'
import { useApp } from '../context'
import { addDays, fmt, iso, mondayOf, parse } from '../dates'
import { courseOf, isOver, isSoon } from '../logic'
import { AlertBox, StatusBtn } from './bits'
import { Head } from './Head'

export function WeekPage() {
  const { weekOff } = useApp()
  const mon = addDays(mondayOf(new Date()), weekOff * 7)
  const weekNo = Math.floor(mon.getTime() / 6048e5)
  return (
    <>
      <Head />
      <p className="quote">{QUOTES[weekNo % QUOTES.length]}</p>
      <AlertBox />
      {Array.from({ length: 7 }, (_, i) => (
        <DayBlock key={i} d={addDays(mon, i)} idx={i} />
      ))}
    </>
  )
}

function DayBlock({ d, idx }: { d: Date; idx: number }) {
  const { data, openSheet } = useApp()
  const key = iso(d)
  const isToday = key === iso(new Date())

  const tasks = data.tasks
    .filter((t) => t.due === key)
    .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'))

  // "Due today:" = the things that matter most: ★ tasks and exams
  const dues: { t: string; s: string }[] = []
  for (const t of tasks) {
    if (t.priority && t.status !== 'done') dues.push({ t: '★ ' + t.title, s: courseOf(data, t.courseId)?.title ?? '' })
  }
  for (const c of data.courses) {
    if (c.mid === key) dues.push({ t: 'Mid-term exam', s: c.title })
    if (c.final === key) dues.push({ t: 'Final exam', s: c.title })
  }

  // "Reminder:" = tasks whose reminder fires today
  const rems = data.tasks.filter(
    (t) => t.status !== 'done' && t.due && t.reminder !== 'none' && iso(addDays(parse(t.due), -parseInt(t.reminder, 10))) === key,
  )

  const blanks = Math.max(0, (idx > 4 ? 2 : 3) - tasks.length)

  return (
    <section className="day">
      <h3 className="dayh">
        <span>{fmt(d, { weekday: 'long' })} {d.getDate()}</span>
        {isToday && <em>today</em>}
      </h3>
      <div className="dayb">
        <div>
          {tasks.map((t) => {
            const c = courseOf(data, t.courseId)
            return (
              <div key={t.id} className={'row' + (t.status === 'done' ? ' isdone' : '')}>
                <StatusBtn t={t} />
                <button className="ttl" onClick={() => openSheet({ kind: 'task', editId: t.id })}>{t.title}</button>
                <span className="rm">
                  {isOver(t) ? <span className="flag over">overdue</span> : isSoon(t) ? <span className="flag soon">soon</span> : null}
                  {t.priority && <span className="star" aria-label="Priority">★</span>}
                  {c && <span className="dotc" style={{ ['--dot' as string]: c.color }} title={c.title} />}
                </span>
              </div>
            )
          })}
          {Array.from({ length: blanks }, (_, i) => <div key={'b' + i} className="row blank" />)}
        </div>
        <div className="boxes">
          <div className="box">
            <span className="bl">Due today:</span>
            {dues.map((x, i) => (
              <div key={i} className="bi">{x.t}{x.s && <small>{x.s}</small>}</div>
            ))}
          </div>
          <div className="box">
            <span className="bl">Reminder:</span>
            {rems.map((t) => (
              <div key={t.id} className="bi">
                {t.title}
                <small>{t.reminder === '0' ? 'due today' : 'due ' + fmt(parse(t.due), { weekday: 'short', day: 'numeric' })}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
