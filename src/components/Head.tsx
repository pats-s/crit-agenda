import { useApp } from '../context'
import { addDays, fmt, mondayOf, pad } from '../dates'
import { Bell, Next, Prev } from './bits'

/** The running head at the top of every page: page number, month, arrows, bell. */
export function Head() {
  const { page, weekOff, monthOff, shift, openBell, goBack, unread } = useApp()

  if (page === 'notifs') {
    return (
      <header className="head">
        <button className="hb" onClick={goBack} aria-label="Back"><Prev /></button>
        <div className="hm" style={{ paddingLeft: 4 }}>
          <b>Notifications</b>
          <span>{unread ? `${unread} unread` : 'All caught up'}</span>
        </div>
      </header>
    )
  }

  const nav = page === 'week' || page === 'month'
  let ref: Date
  let sub: string
  if (page === 'week') {
    const mon = addDays(mondayOf(new Date()), weekOff * 7)
    const sun = addDays(mon, 6)
    ref = mon
    sub = `${fmt(mon, { day: 'numeric', month: 'short' })} – ${fmt(sun, { day: 'numeric', month: 'short' })} · ${mon.getFullYear()}`
  } else if (page === 'month') {
    const n = new Date()
    ref = new Date(n.getFullYear(), n.getMonth() + monthOff, 1)
    sub = ref.getFullYear() + (monthOff === 0 ? ' · this month' : '')
  } else {
    ref = new Date()
    sub = `${fmt(ref, { weekday: 'long' })} ${ref.getDate()} · ${ref.getFullYear()}`
  }

  return (
    <header className="head">
      <div className="num">{pad(ref.getMonth() + 1)}</div>
      <div className="hm">
        <b>{fmt(ref, { month: 'long' })}</b>
        <span>{sub}</span>
      </div>
      {nav && (
        <>
          <button className="hb" onClick={() => shift(-1)} aria-label="Previous"><Prev /></button>
          <button className="hb" onClick={() => shift(1)} aria-label="Next"><Next /></button>
        </>
      )}
      <button className="hb" onClick={openBell} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
        <Bell />
        {unread > 0 && <span className="n">{unread}</span>}
      </button>
    </header>
  )
}
