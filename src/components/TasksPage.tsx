import { STATUS } from '../constants'
import { useApp } from '../context'
import { dueLabel } from '../dates'
import { courseOf, isOver, isSoon } from '../logic'
import type { Status, Task } from '../types'
import { AlertBox, StatusBtn } from './bits'
import { Head } from './Head'

const TABS: Status[] = ['todo', 'doing', 'done']

export function TasksPage() {
  const { data, status, setStatus, courseFilter, clearCourse } = useApp()
  const tasks = data.tasks.filter((t) => !courseFilter || t.courseId === courseFilter)
  const count = (s: Status) => tasks.filter((t) => t.status === s).length
  const shown = tasks
    .filter((t) => t.status === status)
    .sort((a, b) => ((a.due || '9999') < (b.due || '9999') ? -1 : 1))
  const filter = courseOf(data, courseFilter)

  return (
    <>
      <Head />
      <h2 className="ptitle">To-do list</h2>
      <AlertBox />
      <div className="tabs">
        {TABS.map((s) => (
          <button key={s} onClick={() => setStatus(s)} aria-pressed={status === s}>
            {STATUS[s]}<sup>{count(s)}</sup>
          </button>
        ))}
      </div>
      {courseFilter && (
        <div className="chipbar">
          <span className="chip">
            {filter?.title}
            <button onClick={clearCourse} aria-label="Show all courses">×</button>
          </span>
        </div>
      )}
      {!shown.length && <p className="hint">Nothing under “{STATUS[status]}” yet. Tap + to write one down.</p>}
      <div style={{ marginTop: 6 }}>
        {shown.map((t) => <TaskRow key={t.id} t={t} />)}
        {Array.from({ length: Math.max(0, 4 - shown.length) }, (_, i) => <div key={i} className="trow" />)}
      </div>
    </>
  )
}

function TaskRow({ t }: { t: Task }) {
  const { data, openSheet } = useApp()
  const c = courseOf(data, t.courseId)
  return (
    <div className={'trow' + (t.status === 'done' ? ' isdone' : '')}>
      <StatusBtn t={t} />
      <div className="tbody">
        <button className="ttl" onClick={() => openSheet({ kind: 'task', editId: t.id })}>
          {t.priority && <span className="star">★ </span>}
          {t.title}
        </button>
        <div className="sub">
          {t.due && <span className={isOver(t) ? 'ov' : isSoon(t) ? 'sn' : ''}>{dueLabel(t.due)}</span>}
          {c && (
            <span className="pd">
              <span className="dotc" style={{ ['--dot' as string]: c.color }} />
              {c.title}
            </span>
          )}
          {t.est && <span>{t.est}</span>}
          {t.tags.length > 0 && <span>{t.tags.join(' · ')}</span>}
        </div>
        {t.notes && <p className="note">{t.notes}</p>}
      </div>
    </div>
  )
}
