import { seed } from './seed'
import type { Data } from './types'

/**
 * The only place the app reads or writes this device's copy of the data.
 * The cloud copy lives in Supabase and is handled by sync.ts.
 */
const KEY = 'crit-planner-v3'
const TOUCHED = 'crit-touched'
const META = 'crit-sync-v1'

export const emptyData = (): Data => ({ courses: [], tasks: [], habits: [], marks: {}, months: {}, notifs: [] })

/** True once the person has changed anything themselves (so example data is no longer just a demo). */
export const getTouched = () => {
  try { return localStorage.getItem(TOUCHED) === '1' } catch { return false }
}
export const setTouched = (v: boolean) => {
  try { localStorage.setItem(TOUCHED, v ? '1' : '0') } catch { /* storage blocked */ }
}

export function loadData(): Data {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      if (localStorage.getItem(TOUCHED) === null) setTouched(true) // saved by an older build: assume it is real
      return normalize(JSON.parse(raw))
    }
  } catch {
    /* private mode or corrupt data: fall through to example data */
  }
  setTouched(false)
  return seed()
}

export function saveData(d: Data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    /* storage blocked */
  }
}

/** Wipe everything this device holds (used on sign-out). */
export function clearLocal() {
  try {
    for (const k of [KEY, TOUCHED, META]) localStorage.removeItem(k)
  } catch {
    /* storage blocked */
  }
}

/** Accepts anything shaped like our data and fills in whatever is missing. */
export function normalize(x: Partial<Data>): Data {
  return {
    courses: x.courses ?? [],
    tasks: x.tasks ?? [],
    habits: x.habits ?? [],
    marks: x.marks ?? {},
    months: x.months ?? {},
    notifs: x.notifs ?? [],
  }
}
