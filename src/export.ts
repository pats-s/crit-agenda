import { addDays, parse, pad } from './dates'
import { courseOf } from './logic'
import { normalize } from './storage'
import type { Data } from './types'

/** Save a text file. Works from a normal tap; iOS may show its own share/save sheet. */
export function download(name: string, mime: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export const backupJson = (d: Data) => JSON.stringify({ app: 'crit-agenda', version: 1, data: d }, null, 2)

/** Returns null when the file is not one of our backups. */
export function parseBackup(text: string): Data | null {
  try {
    const j = JSON.parse(text)
    const raw = j && j.app === 'crit-agenda' ? j.data : null
    if (!raw || !Array.isArray(raw.tasks) || !Array.isArray(raw.courses)) return null
    return normalize(raw)
  } catch {
    return null
  }
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
const fold = (line: string) => line.replace(/(.{1,73})/g, '$1\r\n ').replace(/\r\n $/, '')
const ymd = (s: string) => s.replace(/-/g, '')
const stamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`

/**
 * One all-day event per open task with a due date, plus an alert at 8:00 on the
 * reminder day. The phone's calendar fires these even when the app is closed.
 */
export function buildIcs(d: Data): string {
  const now = stamp(new Date())
  const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Crit Agenda//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Crit Agenda']
  for (const t of d.tasks) {
    if (!t.due || t.status === 'done') continue
    const c = courseOf(d, t.courseId)
    const desc = [c?.title, t.est && `Time needed: ${t.est}`, t.notes].filter(Boolean).join('\n')
    const end = addDays(parse(t.due), 1)
    out.push(
      'BEGIN:VEVENT',
      `UID:${t.id}@crit-agenda`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${ymd(t.due)}`,
      `DTEND;VALUE=DATE:${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}`,
      fold(`SUMMARY:${t.priority ? '★ ' : ''}${esc(t.title)}`),
    )
    if (desc) out.push(fold(`DESCRIPTION:${esc(desc)}`))
    if (t.reminder !== 'none') {
      const n = parseInt(t.reminder, 10)
      // event starts 00:00 on the due date; alert at 08:00 on (due date - n days)
      const trigger = n === 0 ? 'PT8H' : n === 1 ? '-PT16H' : `-P${n - 1}DT16H`
      out.push('BEGIN:VALARM', 'ACTION:DISPLAY', fold(`DESCRIPTION:${esc(t.title)}`), `TRIGGER:${trigger}`, 'END:VALARM')
    }
    out.push('END:VEVENT')
  }
  out.push('END:VCALENDAR')
  return out.join('\r\n') + '\r\n'
}
