import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { NEXT } from './constants'
import { alertsOf, syncNotifs } from './logic'
import { seed } from './seed'
import { loadData, saveData } from './storage'
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

interface Ctx {
  data: Data
  update: (fn: (d: Data) => void) => void
  replaceData: (d: Data) => void
  resetData: () => void
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

export function AppProvider({ children }: { children: ReactNode }) {
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

  useEffect(() => saveData(data), [data])

  const update = useCallback((fn: (d: Data) => void) => {
    setData((prev) => {
      const d = structuredClone(prev)
      fn(d)
      return d
    })
  }, [])

  // Log the notifications a real push would have sent. Deduped by key, so it settles after one pass.
  useEffect(() => {
    const added = syncNotifs(data)
    if (!added.length) return
    update((d) => {
      const have = new Set(d.notifs.map((n) => n.k))
      for (const n of added) if (!have.has(n.k)) d.notifs.push(n)
    })
  }, [data, update])

  const go = (p: Page) => {
    setPage(p)
    top()
  }
  const value: Ctx = {
    data,
    update,
    replaceData: setData,
    resetData: () => setData(seed()),
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

export { alertsOf }
