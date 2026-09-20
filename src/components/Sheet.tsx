import { useState } from 'react'
import { COLORS, REM, TAGS } from '../constants'
import { useApp, type SheetState } from '../context'
import { uid } from '../logic'
import type { Data, Reminder } from '../types'

interface Form {
  title: string
  courseId: string
  due: string
  reminder: Reminder
  tags: string[]
  est: string
  priority: boolean
  notes: string
  color: string
  mid: string
  final: string
  goal: string
  grade: string
}

function initialForm(sheet: SheetState, data: Data, courseFilter: string): Form {
  const f: Form = {
    title: '', courseId: sheet.courseId ?? courseFilter, due: '', reminder: '2', tags: [], est: '', priority: false,
    notes: '', color: COLORS[0], mid: '', final: '', goal: '', grade: '',
  }
  if (!sheet.editId) return f
  if (sheet.kind === 'task') {
    const t = data.tasks.find((x) => x.id === sheet.editId)
    if (t) Object.assign(f, { title: t.title, courseId: t.courseId, due: t.due, reminder: t.reminder, tags: [...t.tags], est: t.est, priority: t.priority, notes: t.notes })
  } else {
    const c = data.courses.find((x) => x.id === sheet.editId)
    if (c) Object.assign(f, { title: c.title, color: c.color, mid: c.mid, final: c.final, goal: c.goal, grade: c.grade })
  }
  return f
}

/** Keyed by the parent so the form starts fresh each time the sheet opens. */
export function SheetHost() {
  const { sheet } = useApp()
  if (!sheet) return null
  return <SheetForm key={(sheet.editId ?? 'new') + sheet.kind + (sheet.courseId ?? '')} sheet={sheet} />
}

function SheetForm({ sheet }: { sheet: SheetState }) {
  const { data, update, closeSheet, courseFilter, page, go } = useApp()
  const editing = !!sheet.editId
  const [kind, setKind] = useState(sheet.kind)
  const [f, setF] = useState<Form>(() => initialForm(sheet, data, courseFilter))
  const [more, setMore] = useState(editing || !!sheet.more)
  const [armDelete, setArmDelete] = useState(false)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }))
  const title = f.title.trim()

  const save = () => {
    if (!title) return
    update((d) => {
      if (kind === 'task') {
        const fields = { title, courseId: f.courseId, due: f.due, priority: f.priority, tags: f.tags, reminder: f.reminder, notes: f.notes.trim(), est: f.est.trim() }
        const t = editing ? d.tasks.find((x) => x.id === sheet.editId) : undefined
        if (t) Object.assign(t, fields)
        else d.tasks.push({ id: uid(), status: 'todo', ...fields })
      } else {
        const fields = { title, color: f.color, mid: f.mid, final: f.final, goal: f.goal.trim(), grade: f.grade.trim() }
        const c = editing ? d.courses.find((x) => x.id === sheet.editId) : undefined
        if (c) Object.assign(c, fields)
        else d.courses.push({ id: uid(), ...fields })
      }
    })
    if (!editing && kind === 'task' && (page === 'month' || page === 'notifs')) go('tasks')
    if (!editing && kind === 'course') go('courses')
    closeSheet()
  }

  const remove = () => {
    if (!armDelete) return setArmDelete(true)
    update((d) => {
      if (kind === 'task') {
        d.tasks = d.tasks.filter((x) => x.id !== sheet.editId)
        d.notifs = d.notifs.filter((n) => n.taskId !== sheet.editId)
      } else {
        d.courses = d.courses.filter((x) => x.id !== sheet.editId)
        d.tasks.forEach((t) => { if (t.courseId === sheet.editId) t.courseId = '' })
      }
    })
    closeSheet()
  }

  return (
    <>
      <div className="veil" onClick={closeSheet} />
      <div className="sheet" role="dialog" aria-label={`${editing ? 'Edit' : 'New'} ${kind}`}>
        <div className="in">
          <header>
            <h2>{editing ? 'Edit' : 'New'} {kind}</h2>
            <button className="sx" onClick={closeSheet} aria-label="Close">×</button>
          </header>

          {!editing && (
            <div className="kind">
              {(['task', 'course'] as const).map((k) => (
                <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{k[0].toUpperCase() + k.slice(1)}</button>
              ))}
            </div>
          )}

          <label className="f" htmlFor="f-title">
            <span>{kind === 'course' ? 'Course name' : 'Title'} <span className="req">required</span></span>
            <input
              className="big"
              type="text"
              id="f-title"
              autoComplete="off"
              placeholder={kind === 'task' ? 'e.g. Sketch 10 logo directions' : 'e.g. Typography II'}
              value={f.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </label>

          {kind === 'task' && (
            <button className="more" aria-expanded={more} onClick={() => setMore(!more)}>
              {more ? '− Hide extra fields' : '+ Add details (all optional)'}
            </button>
          )}

          {(more || kind === 'course') && (
            <div className="details">
              {kind === 'task' ? (
                <>
                  <label className="f" htmlFor="f-course">
                    <span>Course</span>
                    <select id="f-course" value={f.courseId} onChange={(e) => set('courseId', e.target.value)}>
                      <option value="">None</option>
                      {data.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </label>
                  <div className="two">
                    <label className="f" htmlFor="f-due">
                      <span>Due date</span>
                      <input type="date" id="f-due" value={f.due} onChange={(e) => set('due', e.target.value)} />
                    </label>
                    <label className="f" htmlFor="f-rem">
                      <span>Remind me</span>
                      <select id="f-rem" value={f.reminder} onChange={(e) => set('reminder', e.target.value as Reminder)}>
                        {(Object.keys(REM) as Reminder[]).map((k) => <option key={k} value={k}>{REM[k]}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="grp">
                    <span>Type of work</span>
                    <div className="chips">
                      {TAGS.map((g) => (
                        <button key={g} aria-pressed={f.tags.includes(g)} onClick={() => set('tags', f.tags.includes(g) ? f.tags.filter((x) => x !== g) : [...f.tags, g])}>{g}</button>
                      ))}
                    </div>
                  </div>
                  <div className="two">
                    <label className="f" htmlFor="f-est">
                      <span>Time needed</span>
                      <input type="text" id="f-est" placeholder="e.g. 2h" value={f.est} onChange={(e) => set('est', e.target.value)} />
                    </label>
                    <div className="grp">
                      <span>Priority</span>
                      <div className="chips"><button aria-pressed={f.priority} onClick={() => set('priority', !f.priority)}>★ Important</button></div>
                    </div>
                  </div>
                  <label className="f" htmlFor="f-notes">
                    <span>Notes / brief</span>
                    <textarea id="f-notes" placeholder="Brief, feedback from crit, links…" value={f.notes} onChange={(e) => set('notes', e.target.value)} />
                  </label>
                </>
              ) : (
                <>
                  <div className="two">
                    <label className="f" htmlFor="f-mid"><span>Mid-term date</span><input type="date" id="f-mid" value={f.mid} onChange={(e) => set('mid', e.target.value)} /></label>
                    <label className="f" htmlFor="f-final"><span>Final date</span><input type="date" id="f-final" value={f.final} onChange={(e) => set('final', e.target.value)} /></label>
                  </div>
                  <div className="two">
                    <label className="f" htmlFor="f-goal"><span>Goal grade</span><input type="text" id="f-goal" placeholder="e.g. 90%" value={f.goal} onChange={(e) => set('goal', e.target.value)} /></label>
                    <label className="f" htmlFor="f-grade"><span>Final grade</span><input type="text" id="f-grade" value={f.grade} onChange={(e) => set('grade', e.target.value)} /></label>
                  </div>
                  <div className="grp">
                    <span>Colour label</span>
                    <div className="chips sw">
                      {COLORS.map((c) => (
                        <button key={c} style={{ ['--dot' as string]: c }} aria-pressed={f.color === c} aria-label={`Colour ${c}`} onClick={() => set('color', c)} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <button className="save" disabled={!title} onClick={save}>{editing ? 'Save changes' : `Add ${kind}`}</button>
          {editing && <button className="del" onClick={remove}>{armDelete ? 'Tap again to delete for good' : `Delete this ${kind}`}</button>}
        </div>
      </div>
    </>
  )
}
