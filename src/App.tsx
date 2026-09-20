import { AppProvider, useApp, type Page } from './context'
import { Bell } from './components/bits'
import { CoursesPage } from './components/CoursesPage'
import { MonthPage } from './components/MonthPage'
import { NotifsPage } from './components/NotifsPage'
import { SheetHost } from './components/Sheet'
import { TasksPage } from './components/TasksPage'
import { WeekPage } from './components/WeekPage'

const TABS: [Page, string][] = [['week', 'Week'], ['month', 'Month'], ['tasks', 'Tasks'], ['courses', 'Courses']]

function Shell() {
  const { page, go, openSheet, toast } = useApp()
  return (
    <div className="wrap">
      <main className="paper">
        {page === 'week' && <WeekPage />}
        {page === 'month' && <MonthPage />}
        {page === 'tasks' && <TasksPage />}
        {page === 'courses' && <CoursesPage />}
        {page === 'notifs' && <NotifsPage />}
        <div className="foot">Example data · saved only on this device</div>
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

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
