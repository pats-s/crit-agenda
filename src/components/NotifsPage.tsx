import { useRef, useState, type FormEvent } from 'react'
import { useApp } from '../context'
import { dayLabel, daysUntil, dueLabel, timeOf } from '../dates'
import { backupJson, download, parseBackup } from '../export'
import { alertsOf, courseOf } from '../logic'
import { supabase } from '../supabase'
import { Head } from './Head'

export function NotifsPage() {
  const { data, update, unread, openSheet, notify } = useApp()
  const list = [...data.notifs].sort((a, b) => b.ts - a.ts)

  const sendTest = () => {
    const al = alertsOf(data)[0]
    if (!al) return notify('All clear', 'Nothing due in the next few days.')
    const c = courseOf(data, al.courseId)
    notify(`Due ${daysUntil(al.due) <= 0 ? 'now' : 'soon'}: ${al.title}`, dueLabel(al.due) + (c ? ` · ${c.title}` : ''))
  }
  const open = (id: string) => {
    const n = data.notifs.find((x) => x.id === id)
    if (!n) return
    update((d) => { const x = d.notifs.find((y) => y.id === id); if (x) x.read = true })
    if (data.tasks.some((t) => t.id === n.taskId)) openSheet({ kind: 'task', editId: n.taskId })
  }

  let last = ''
  return (
    <>
      <Head />
      <div className="nact">
        {unread > 0 && (
          <button className="link" onClick={() => update((d) => d.notifs.forEach((n) => { n.read = true }))}>Mark all read</button>
        )}
        <button className="link" onClick={sendTest}>Send a test notification</button>
      </div>
      {!list.length && <p className="hint">Nothing sent yet. Set a reminder on a task and it will show up here.</p>}
      {list.map((n) => {
        const g = dayLabel(n.ts)
        const heading = g !== last ? <h3 className="dayh" style={{ marginTop: 18 }}><span>{g}</span></h3> : null
        last = g
        return (
          <div key={n.id}>
            {heading}
            <button className={'nrow' + (n.read ? '' : ' unread')} onClick={() => open(n.id)}>
              <span className="nd" />
              <span className="nb"><b>{n.title}</b><span>{n.body}</span></span>
              <time>{timeOf(n.ts)}</time>
            </button>
          </div>
        )
      })}

      <div className="alert" style={{ marginTop: 24 }}>
        <span className="bl">While the app is closed</span>
        <div style={{ fontSize: 13 }}>
          This list shows what the planner would send. Alerts on your lock screen while the app is closed are coming in a later update.
        </div>
      </div>
      <DataTools />
    </>
  )
}

/** Backup, restore, start fresh, and the account. */
function DataTools() {
  const { data, replaceData, clearAll, signOut, user } = useApp()
  const file = useRef<HTMLInputElement>(null)

  const onFile = async (f: File | undefined) => {
    if (!f) return
    const parsed = parseBackup(await f.text())
    if (!parsed) return alert('That file is not a Crit Agenda backup.')
    if (confirm('Replace everything in the app with this backup?')) replaceData(parsed)
    if (file.current) file.current.value = ''
  }

  return (
    <div style={{ marginTop: 22 }}>
      <h3 className="sh" style={{ margin: '0 0 4px' }}><span style={{ font: 'italic 700 18px var(--serif)', color: 'var(--ink)' }}>Your data</span></h3>
      <div className="nact" style={{ flexDirection: 'column', gap: 2 }}>
        <button className="link" style={{ textAlign: 'left' }} onClick={() => download('crit-agenda-backup.json', 'application/json', backupJson(data))}>
          Export a backup
        </button>
        <button className="link" style={{ textAlign: 'left' }} onClick={() => file.current?.click()}>
          Import a backup
        </button>
        <button className="link" style={{ textAlign: 'left' }} onClick={() => confirm('Delete every course, task, habit and month page from this device AND your account, and start with a blank planner?') && clearAll()}>
          Start fresh (delete everything)
        </button>
      </div>
      <h3 className="sh" style={{ margin: '20px 0 4px' }}><span style={{ font: 'italic 700 18px var(--serif)', color: 'var(--ink)' }}>Account</span></h3>
      <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--ink-2)' }}>Signed in as {user.email}</p>
      <ChangePassword />
      <div className="nact">
        <button className="link" onClick={() => void signOut()}>Sign out</button>
      </div>
      <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  )
}

/** Lets a signed-in person choose a new password. No email needed. */
function ChangePassword() {
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [again, setAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (pw.length < 8) return setMsg({ ok: false, text: 'Use at least 8 characters.' })
    if (pw !== again) return setMsg({ ok: false, text: 'The two passwords don’t match.' })
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) {
      const m = error.message
      return setMsg({
        ok: false,
        text: /same|different/i.test(m) ? 'Pick a password different from the current one.'
          : /reauth|recent/i.test(m) ? 'For safety, sign out and back in, then try again.'
          : m,
      })
    }
    setPw('')
    setAgain('')
    setOpen(false)
    setMsg({ ok: true, text: 'Password changed.' })
  }

  return (
    <>
      <div className="nact">
        <button className="link" onClick={() => { setOpen(!open); setMsg(null) }} aria-expanded={open}>Change password</button>
        {msg?.ok && <span style={{ fontSize: 13, color: 'var(--ink-2)' }} role="status">{msg.text}</span>}
      </div>
      {open && (
        <form className="login" style={{ marginTop: 8 }} onSubmit={submit}>
          <label htmlFor="cp-new">
            <span>New password (8 or more characters)</span>
            <input id="cp-new" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </label>
          <label htmlFor="cp-again">
            <span>Repeat it</span>
            <input id="cp-again" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
          </label>
          {msg && !msg.ok && <p className="err" role="alert">{msg.text}</p>}
          <button className="save" type="submit" disabled={busy || !pw}>{busy ? 'Saving…' : 'Save password'}</button>
        </form>
      )}
    </>
  )
}
