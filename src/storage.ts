import { seed } from './seed'
import type { Data } from './types'

/**
 * The only place the app reads or writes saved data.
 * Today: this device's localStorage. Later: Supabase (keeping localStorage as the offline copy).
 */
const KEY = 'crit-planner-v3'

export function loadData(): Data {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return normalize(JSON.parse(raw))
  } catch {
    /* private mode or corrupt data: fall through to example data */
  }
  return seed()
}

export function saveData(d: Data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
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
