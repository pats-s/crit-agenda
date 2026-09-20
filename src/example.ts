import type { Data } from './types'

/**
 * Early builds shipped demo data (Visual Identity 301, Typography II, ...). Anyone who opened
 * the app back then may still have it saved, and it can have been uploaded to their account.
 * This removes exactly those demo items, matched by their fixed ids. Real items get random
 * ids ("x…"), so they can never match. Safe to delete this file once no account has demo data.
 */
const ids = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => prefix + (i + 1))
const COURSES = new Set(ids('c', 3))
const TASKS = new Set(ids('t', 12))
const HABITS = new Set(ids('h', 4))
const NOTIFS = new Set(ids('n', 3))

const isDemoMonth = (m: Data['months'][string]) =>
  m.win === 'Finished the type specimen layout' && m.focus === 'Brand identity + portfolio site'

/** Returns the same object when there is nothing to remove, so callers can compare by reference. */
export function purgeExample(d: Data): Data {
  const courses = d.courses.filter((c) => !COURSES.has(c.id))
  const tasks = d.tasks.filter((t) => !TASKS.has(t.id))
  const habits = d.habits.filter((h) => !HABITS.has(h.id))
  const notifs = d.notifs.filter((n) => !NOTIFS.has(n.id) && !TASKS.has(n.taskId))

  const marks: Data['marks'] = {}
  let marksChanged = false
  for (const [month, byHabit] of Object.entries(d.marks)) {
    const kept = Object.fromEntries(Object.entries(byHabit).filter(([hid]) => !HABITS.has(hid)))
    if (Object.keys(kept).length !== Object.keys(byHabit).length) marksChanged = true
    if (Object.keys(kept).length) marks[month] = kept
    else if (Object.keys(byHabit).length === 0) marks[month] = byHabit
  }
  const months = Object.fromEntries(Object.entries(d.months).filter(([, m]) => !isDemoMonth(m)))

  const changed =
    courses.length !== d.courses.length || tasks.length !== d.tasks.length || habits.length !== d.habits.length ||
    notifs.length !== d.notifs.length || marksChanged || Object.keys(months).length !== Object.keys(d.months).length
  return changed ? { courses, tasks, habits, marks, months, notifs } : d
}
