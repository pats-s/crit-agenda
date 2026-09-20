import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { applyRecord, canonMap, keyOf, sortByPos, splitKey, toRecords, type Kind } from './records'
import { emptyData, getTouched } from './storage'
import { supabase } from './supabase'
import type { Data } from './types'

/**
 * Keeps this device's copy and the Supabase copy in step.
 *
 * - Every edit marks the affected rows "dirty"; dirty rows are uploaded shortly after.
 * - The app pulls newer rows on start, when it comes back to the foreground, and every minute.
 * - A row edited here and not yet uploaded is never overwritten by a pull (your edit wins).
 * - Offline is fine: dirty rows are remembered on the device and uploaded later.
 */
const META = 'crit-sync-v1'
const EPOCH = '1970-01-01T00:00:00Z'

interface Meta {
  user: string
  lastPull: string
  dirty: string[]
  done: boolean // first sync finished on this device
}
interface Row {
  kind: Kind
  id: string
  data: unknown
  deleted: boolean
  updated_at: string
}
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'
export interface SyncState {
  status: SyncStatus
  message: string
}

function loadMeta(user: string): Meta {
  try {
    const m = JSON.parse(localStorage.getItem(META) || 'null')
    if (m && m.user === user) return m
  } catch { /* fall through */ }
  return { user, lastPull: '', dirty: [], done: false }
}

const errText = (e: unknown) => (e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : String(e))

export function useSync(userId: string, data: Data, setData: Dispatch<SetStateAction<Data>>) {
  const [state, setState] = useState<SyncState>({ status: 'idle', message: '' })
  const dataRef = useRef(data)
  dataRef.current = data
  const meta = useRef<Meta>(loadMeta(userId))
  const known = useRef<Map<string, string> | null>(null)
  const dirty = useRef(new Map<string, number>(meta.current.dirty.map((k) => [k, 0])))
  const seq = useRef(0)
  const ready = useRef(false)
  const busy = useRef(false)
  const pulling = useRef(false)
  const timer = useRef(0)

  const persist = () => {
    meta.current.dirty = [...dirty.current.keys()]
    try { localStorage.setItem(META, JSON.stringify(meta.current)) } catch { /* storage blocked */ }
  }
  const fail = (e: unknown) => {
    const message = errText(e)
    setState({ status: !navigator.onLine || /fetch|network/i.test(message) ? 'offline' : 'error', message })
  }

  /** Upload every dirty row. */
  const flush = useCallback(async () => {
    if (busy.current || !ready.current || dirty.current.size === 0) return
    busy.current = true
    setState((s) => ({ ...s, status: 'syncing' }))
    try {
      while (dirty.current.size) {
        const snap = [...dirty.current.entries()]
        const recs = toRecords(dataRef.current)
        const rows = snap.map(([k]) => {
          const [kind, id] = splitKey(k)
          const r = recs.get(k)
          return r ? { kind, id, data: r.data, deleted: false } : { kind, id, data: {}, deleted: true }
        })
        for (let i = 0; i < rows.length; i += 200) {
          const { error } = await supabase.from('records').upsert(rows.slice(i, i + 200), { onConflict: 'user_id,kind,id' })
          if (error) throw error
        }
        // only forget a row if it was not edited again while we were uploading
        for (const [k, v] of snap) if (dirty.current.get(k) === v) dirty.current.delete(k)
        persist()
      }
      setState({ status: 'synced', message: '' })
    } catch (e) {
      fail(e)
    } finally {
      busy.current = false
    }
  }, [])

  /** Download rows changed elsewhere and merge them in. */
  const pull = useCallback(async () => {
    if (pulling.current) return
    pulling.current = true
    try {
      if (!ready.current) setState((s) => ({ ...s, status: 'syncing' }))
      const m = meta.current
      // start a little before the last row we saw, so a row committed late is never missed
      let since = m.lastPull ? new Date(Date.parse(m.lastPull) - 10000).toISOString() : EPOCH
      const rows: Row[] = []
      for (;;) {
        const { data: page, error } = await supabase
          .from('records')
          .select('kind,id,data,deleted,updated_at')
          .gt('updated_at', since)
          .order('updated_at', { ascending: true })
          .limit(500)
        if (error) throw error
        rows.push(...(page as Row[]))
        if (page.length < 500) break
        since = page[page.length - 1].updated_at
      }

      const apply = (replace: boolean) => {
        const next = replace ? emptyData() : structuredClone(dataRef.current)
        for (const r of rows) {
          if (!replace && dirty.current.has(keyOf(r.kind, r.id))) continue
          applyRecord(next, r.kind, r.id, r.data, r.deleted)
        }
        sortByPos(next)
        known.current = canonMap(next)
        dataRef.current = next
        setData(next)
      }
      const uploadEverything = () => {
        for (const k of canonMap(dataRef.current).keys()) dirty.current.set(k, ++seq.current)
      }

      if (!m.done) {
        // first time this device talks to this account
        const serverHas = rows.some((r) => !r.deleted)
        const keepLocal = getTouched()
        if (!keepLocal) dirty.current.clear() // example data is about to be thrown away: nothing of it should upload
        if (serverHas && !keepLocal) apply(true) // account wins; drop the example data
        else if (serverHas) { apply(false); uploadEverything() } // merge; both sides keep their items
        else if (keepLocal) uploadEverything() // new account, this device has real data
        else { // new account, only example data here: start clean
          const e = emptyData()
          known.current = canonMap(e)
          dataRef.current = e
          setData(e)
        }
        m.done = true
      } else if (rows.length) {
        apply(false)
      }
      if (rows.length) m.lastPull = rows[rows.length - 1].updated_at
      persist()
      ready.current = true
      setState((s) => (s.status === 'syncing' || s.status === 'idle' || s.status === 'offline' ? { status: 'synced', message: '' } : s))
    } catch (e) {
      fail(e)
    } finally {
      pulling.current = false
    }
  }, [setData])

  // Notice edits: any row whose content changed becomes dirty.
  useEffect(() => {
    const next = canonMap(data)
    const prev = known.current
    if (prev) {
      for (const [k, j] of next) if (prev.get(k) !== j) dirty.current.set(k, ++seq.current)
      for (const k of prev.keys()) if (!next.has(k)) dirty.current.set(k, ++seq.current)
      if (dirty.current.size) {
        persist()
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => void flush(), 700)
      }
    }
    known.current = next
  }, [data, flush])

  // Pull on start, when the app comes back to the foreground, when the network returns, and every minute.
  useEffect(() => {
    const run = () => {
      if (!navigator.onLine) return setState((s) => ({ ...s, status: 'offline' }))
      void pull().then(() => flush())
    }
    run()
    const iv = window.setInterval(run, 60000)
    const visible = () => document.visibilityState === 'visible' && run()
    document.addEventListener('visibilitychange', visible)
    window.addEventListener('online', run)
    return () => {
      window.clearInterval(iv)
      window.clearTimeout(timer.current)
      document.removeEventListener('visibilitychange', visible)
      window.removeEventListener('online', run)
    }
  }, [pull, flush])

  return { ...state, hasPending: () => dirty.current.size > 0 }
}
