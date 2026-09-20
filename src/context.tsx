import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { NEXT } from './constants'
import { purgeExample } from './example'
import { syncNotifs } from './logic'
import { clearLocal, emptyData, loadData, saveData, setTouched } from './storage'
import { supabase } from './supabase'
import { useSync, type SyncState } from './sync'
import type { Data, Status } from './types'

export type Page = 'week' | 'month' | 'tasks' | 'courses' | 'notifs'
const PAGES: Page[] = ['week', 'month', 'tasks', 'courses', 'notifs']

/** What the add/edit sheet is showing. */
export interface SheetState {
  kind: 'task' | 'course'
  editId?: string
  courseId?: string
  more?: boolean
}

interface Toast {
  title: string
  body: string
}

export interface User {
  id: string
  email: string
}

interface Ctx {
  user: User
  data: Data
  update: (fn: (d: Data) => void) => void
  replaceData: (d: Data) => void
  clearAll: () => void
  signOut: () => Promise<void>
  sync: SyncState
  unread: number
  page: Page
  go: (p: Page) => void
  openBell: () => void
  goBack: () => void
  weekOff: number
  monthOff: number
  shift: (dir: number) => void
  status: Status
  setStatus: (s: Status) => void
  courseFilter: string
  filterCourse: (id: string) => void
  clearCourse: () => void
  sheet: SheetState | null
  openSheet: (s: SheetState) => void
  closeSheet: () => void
  toast: Toast | null
  notify: (title: string, body: string) => void
  cycle: (id: string) => void
}

const AppContext = createContext<Ctx>(null as never)
export const useApp = () => useContext(AppContext)

const startPage = (): Page => PAGES.find((p) => p === location.hash.slice(1)) ?? 'week'
const top = () => window.scrollTo(0, 0)

export function AppProvider({ user, children }: { user: User; children: ReactNode }) {
  const [data, setData] = useState<Data>(loadData)
  const [page, setPage] = useState<Page>(startPage)
  const [back, setBack] = useState<Page>('week')
  const [weekOff, setWeekOff] = useState(0)
  const [monthOff, setMonthOff] = useState(0)
  const [status, setStatus] = useState<Status>('todo')
  const [courseFilter, setCourseFilter] = useState('')
  const [sheet, setSheet] = useState<SheetState | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const toastTimer = useRef<number>(0)
  const sync = useSync(user.id, data, setData)

  useEffect(() => saveData(data), [data])

  /** Change data without counting it as the person's own edit (used for automatic notifications). */
  const change = useCallback((fn: (d: Data) => void) => {
    setData((prev) => {
      const d = structuredClone(prev)
      fn(d)
      return d
    })
  }, [])
  /** A change the person made. */
  const update = useCallback((fn: (d: Data) => void) => {
    setTouched(true)
    change(fn)
  }, [change])

  // Remove leftover demo items from early builds (see example.ts)
  useEffect(() => {
    const clean = purgeExample(data)
    if (clean !== data) setData(clean)
  }, [data])

  // Log the notifications a real push would have sent. Deduped by key, so it settles after one pass.
  useEffect(() => {
    const added = syncNotifs(data)
    if (!added.length) return
    change((d) => {
      const have = new Set(d.notifs.map((n) => n.k))
      for (const n of added) if (!have.has(n.k)) d.notifs.push(n)
    })
  }, [data, change])

  const go = (p: Page) => {
    setPage(p)
    top()
  }
  const replaceData = (d: Data) => {
    setTouched(true)
    setData(d)
  }
  const value: Ctx = {
    user,
    data,
    update,
    replaceData,
    clearAll: () => replaceData(emptyData()),
    signOut: async () => {
      if (sync.hasPending() && !confirm('Some changes have not reached your account yet. Sign out anyway and lose them?')) return
      await supabase.auth.signOut()
      clearLocal()
    },
    sync,
    unread: data.notifs.filter((n) => !n.read).length,
    page,
    go,
    openBell: () => {
      if (page !== 'notifs') setBack(page)
      go('notifs')
    },
    goBack: () => go(back),
    weekOff,
    monthOff,
    shift: (dir) => (page === 'week' ? setWeekOff((w) => w + dir) : setMonthOff((m) => m + dir)),
    status,
    setStatus,
    courseFilter,
    filterCourse: (id) => {
      setCourseFilter(id)
      setStatus('todo')
      go('tasks')
    },
    clearCourse: () => setCourseFilter(''),
    sheet,
    openSheet: setSheet,
    closeSheet: () => setSheet(null),
    toast,
    notify: (title, body) => {
      setToast({ title, body })
      window.clearTimeout(toastTimer.current)
      toastTimer.current = window.setTimeout(() => setToast(null), 4200)
    },
    cycle: (id) =>
      update((d) => {
        const t = d.tasks.find((x) => x.id === id)
        if (t) t.status = NEXT[t.status]
      }),
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
