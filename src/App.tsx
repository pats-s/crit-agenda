import { useEffect, useState } from 'react'
import { Bell } from './components/bits'
import { CoursesPage } from './components/CoursesPage'
import { Login } from './components/Login'
import { MonthPage } from './components/MonthPage'
import { NotifsPage } from './components/NotifsPage'
import { SheetHost } from './components/Sheet'
import { TasksPage } from './components/TasksPage'
import { WeekPage } from './components/WeekPage'
import { AppProvider, useApp, type Page, type User } from './context'
import { supabase } from './supabase'

const TABS: [Page, string][] = [['week', 'Week'], ['month', 'Month'], ['tasks', 'Tasks'], ['courses', 'Courses']]

function footText(status: string, message: string, email: string) {
  if (status === 'syncing') return 'Saving…'
  if (status === 'offline') return 'Offline · changes are kept on this device and will sync'
  if (status === 'error') return `Couldn’t sync: ${message}`
  if (status === 'synced') return `Synced · ${email}`
  return `Signed in · ${email}`
}

function Shell() {
  const { page, go, openSheet, toast, sync, user } = useApp()
  return (
    <div className="wrap">
      <main className="paper">
        {page === 'week' && <WeekPage />}
        {page === 'month' && <MonthPage />}
        {page === 'tasks' && <TasksPage />}
        {page === 'courses' && <CoursesPage />}
        {page === 'notifs' && <NotifsPage />}
        <div className="foot">{footText(sync.status, sync.message, user.email)}</div>
      </main>

      <nav className="nav" aria-label="Planner pages">
        <div className="in">
          {TABS.map(([p, label]) => (
            <button key={p} aria-current={page === p} onClick={() => go(p)}>{label}</button>
          ))}
        </div>
      </nav>
      {page !== 'notifs' && (
        <button className="fab" aria-label="Add new" onClick={() => openSheet({ kind: 'task' })}>+</button>
      )}

      <SheetHost />
      {toast && (
        <div className="push" role="status">
          <div className="ic"><Bell /></div>
          <div><b>{toast.title}</b><p>{toast.body}</p></div>
        </div>
      )}
    </div>
  )
}

/** Shows the sign-in screen until there is a session, then the planner. */
export default function App() {
  const [auth, setAuth] = useState<{ ready: boolean; user: User | null }>({ ready: false, user: null })

  useEffect(() => {
    const toUser = (s: { user: { id: string; email?: string } } | null): User | null =>
      s ? { id: s.user.id, email: s.user.email ?? '' } : null
    supabase.auth.getSession().then(({ data }) => setAuth({ ready: true, user: toUser(data.session) }))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      const u = toUser(s)
      setAuth((prev) => (prev.ready && prev.user?.id === u?.id && prev.user?.email === u?.email ? prev : { ready: true, user: u }))
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!auth.ready) return <div className="wrap"><main className="paper" style={{ minHeight: 240 }} aria-busy="true" /></div>
  if (!auth.user) return <Login />
  return (
    <AppProvider key={auth.user.id} user={auth.user}>
      <Shell />
    </AppProvider>
  )
}
