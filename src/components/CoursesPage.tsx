import { STATUS } from '../constants'
import { useApp } from '../context'
import { daysUntil, fmtShort } from '../dates'
import { isOver } from '../logic'
import type { Course } from '../types'
import { Check, Pen } from './bits'
import { Head } from './Head'

export function CoursesPage() {
  const { data, openSheet } = useApp()
  const hasLoose = data.tasks.some((t) => !data.courses.some((c) => c.id === t.courseId))
  return (
    <>
      <Head />
      <h2 className="ptitle">Courses Planner</h2>
      {data.courses.map((c) => <CourseBlock key={c.id} c={c} />)}
      {hasLoose && <CourseBlock c={null} />}
      <button className="ghost" onClick={() => openSheet({ kind: 'course' })}>+ Add a course</button>
    </>
  )
}

function CourseBlock({ c }: { c: Course | null }) {
  const { data, openSheet, filterCourse, cycle } = useApp()
  const tasks = data.tasks
    .filter((t) => (c ? t.courseId === c.id : !data.courses.some((x) => x.id === t.courseId)))
    .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done') || ((a.due || '9999') < (b.due || '9999') ? -1 : 1))
  const done = tasks.filter((t) => t.status === 'done').length
  const exams = c
    ? ([['Mid-term exam', c.mid], ['Final exam', c.final]] as const).filter(([, date]) => date)
    : []
  const fillers = Math.max(0, 3 - tasks.length - exams.length)

  return (
    <section className="course">
      <div className="cf">
        {c ? (
          <>
            <div className="fl full">
              <span>Course</span>
              <b><span className="dotc" style={{ ['--dot' as string]: c.color }} />{c.title}</b>
              <button className="cnt" onClick={() => filterCourse(c.id)}>{done}/{tasks.length} done ›</button>
              <button className="pen" onClick={() => openSheet({ kind: 'course', editId: c.id })} aria-label={`Edit ${c.title}`}><Pen /></button>
            </div>
            <div className="fl"><span>Mid-Term Date</span><b>{c.mid && fmtShort(c.mid)}</b></div>
            <div className="fl"><span>Goal grade</span><b>{c.goal}</b></div>
            <div className="fl"><span>Final Date</span><b>{c.final && fmtShort(c.final)}</b></div>
            <div className="fl"><span>Final grade</span><b>{c.grade}</b></div>
          </>
        ) : (
          <div className="fl full"><span>Course</span><b>No course · personal</b></div>
        )}
      </div>

      <div className="tbl">
        <div className="th"><span>Assignments / Exams</span><span>Due Date</span><span>✓</span></div>
        {tasks.map((t) => {
          const sub = [t.est, ...t.tags].filter(Boolean).join(' · ')
          return (
            <div key={t.id} className="tr">
              <div className="a">
                <button className={'pt' + (t.status === 'done' ? ' isdone' : '')} onClick={() => openSheet({ kind: 'task', editId: t.id })}>
                  {t.priority && <span className="star">★</span>}
                  {t.title}
                </button>
                {sub && <span className="pg" style={{ textDecoration: 'none' }}>{sub}</span>}
              </div>
              <div className={'d' + (isOver(t) ? ' ov' : '')}>{t.due && fmtShort(t.due)}</div>
              <div className="c">
                <button className="cb" data-s={t.status} onClick={() => cycle(t.id)} aria-label={`${t.title} — ${STATUS[t.status]}. Tap to change status.`}>
                  <i>{t.status === 'done' && <Check />}</i>
                </button>
              </div>
            </div>
          )
        })}
        {exams.map(([label, date]) => {
          const past = daysUntil(date) < 0
          return (
            <div key={label} className="tr">
              <div className="a"><span className="ex">{label}</span></div>
              <div className="d">{fmtShort(date)}</div>
              <div className="c">
                <span className={'cb auto' + (past ? ' on' : '')} aria-label={past ? 'Passed' : 'Upcoming'}>
                  <i>{past && <Check />}</i>
                </span>
              </div>
            </div>
          )
        })}
        {Array.from({ length: fillers }, (_, i) => (
          <div key={'f' + i} className="tr"><div className="a" /><div className="d" /><div className="c" /></div>
        ))}
      </div>
      <button className="ghost sm" onClick={() => openSheet({ kind: 'task', courseId: c?.id ?? '', more: true })}>
        + Add a task{c ? ' to this course' : ''}
      </button>
    </section>
  )
}
