import type { Course, Data, Habit, MonthData, Notif, Task } from './types'

/**
 * The app keeps one Data object. The database keeps one row per item.
 * These helpers convert between the two.
 */
export type Kind = 'course' | 'task' | 'habit' | 'marks' | 'month' | 'notif'
export interface Rec {
  kind: Kind
  id: string
  data: unknown
}

export const keyOf = (kind: Kind, id: string) => `${kind}|${id}`
export const splitKey = (k: string): [Kind, string] => {
  const i = k.indexOf('|')
  return [k.slice(0, i) as Kind, k.slice(i + 1)]
}

/** JSON with sorted keys, so two copies of the same record always compare equal. */
export function canon(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']'
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    return '{' + Object.keys(o).sort().map((k) => JSON.stringify(k) + ':' + canon(o[k])).join(',') + '}'
  }
  return JSON.stringify(v)
}

export function toRecords(d: Data): Map<string, Rec> {
  const m = new Map<string, Rec>()
  const add = (kind: Kind, id: string, data: unknown) => m.set(keyOf(kind, id), { kind, id, data })
  d.courses.forEach((c, pos) => add('course', c.id, { ...c, pos }))
  d.habits.forEach((h, pos) => add('habit', h.id, { ...h, pos }))
  d.tasks.forEach((t) => add('task', t.id, t))
  d.notifs.forEach((n) => add('notif', n.id, n))
  for (const [k, v] of Object.entries(d.marks)) add('marks', k, v)
  for (const [k, v] of Object.entries(d.months)) add('month', k, v)
  return m
}

export const canonMap = (d: Data) => {
  const out = new Map<string, string>()
  for (const [k, r] of toRecords(d)) out.set(k, canon(r.data))
  return out
}

function upsert<T extends { id: string }>(list: T[], item: T) {
  const i = list.findIndex((x) => x.id === item.id)
  if (i > -1) list[i] = item
  else list.push(item)
}

/** Apply one row from the database to a Data object (mutates it). */
export function applyRecord(d: Data, kind: Kind, id: string, data: unknown, deleted: boolean) {
  switch (kind) {
    case 'course': d.courses = d.courses.filter((x) => x.id !== id); if (!deleted) d.courses.push(data as Course); break
    case 'habit': d.habits = d.habits.filter((x) => x.id !== id); if (!deleted) d.habits.push(data as Habit); break
    case 'task': if (deleted) d.tasks = d.tasks.filter((x) => x.id !== id); else upsert(d.tasks, data as Task); break
    case 'notif': if (deleted) d.notifs = d.notifs.filter((x) => x.id !== id); else upsert(d.notifs, data as Notif); break
    case 'marks': if (deleted) delete d.marks[id]; else d.marks[id] = data as Record<string, number[]>; break
    case 'month': if (deleted) delete d.months[id]; else d.months[id] = data as MonthData; break
  }
}

/** Courses and habits keep the order they had on the device that saved them. */
export function sortByPos(d: Data) {
  const by = (a: { pos?: number }, b: { pos?: number }) => (a.pos ?? 1e9) - (b.pos ?? 1e9)
  d.courses.sort(by)
  d.habits.sort(by)
}
