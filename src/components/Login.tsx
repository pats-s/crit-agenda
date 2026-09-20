import { useEffect, useState, type FormEvent } from 'react'
import { ALLOW_SIGNUP } from '../config'
import { supabase } from '../supabase'

type Mode = 'in' | 'up'

const signInError = (m: string) =>
  /invalid login/i.test(m) ? 'That email and password don’t match. Check them and try again.'
    : /not confirmed/i.test(m) ? 'Confirm your email first: open the link we sent you, then sign in.'
    : /fetch|network/i.test(m) ? 'You’re offline. Connect to the internet to sign in.'
    : m

const signUpError = (m: string) =>
  /signups? (are )?(not allowed|disabled)|not allowed for this instance/i.test(m) ? 'New accounts are closed right now.'
    : /rate limit/i.test(m) ? 'Too many emails were sent recently. Wait an hour and try again.'
    : /already registered/i.test(m) ? 'That email already has an account. Sign in instead.'
    : /fetch|network/i.test(m) ? 'You’re offline. Connect to the internet to create an account.'
    : m

/** Sign in or create an account with an email and password. */
export function Login() {
  const [mode, setMode] = useState<Mode>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')
  // arriving from the confirmation link in the email
  const [confirmed] = useState(() => /access_token|type=signup/.test(location.hash))
  useEffect(() => {
    if (confirmed) history.replaceState(null, '', location.pathname + location.search)
  }, [confirmed])

  const switchTo = (m: Mode) => {
    setMode(m)
    setError('')
    setSentTo('')
    setRepeat('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const addr = email.trim()
    if (mode === 'in') {
      setBusy(true)
      const { error } = await supabase.auth.signInWithPassword({ email: addr, password })
      if (error) {
        setError(signInError(error.message))
        setBusy(false)
      }
      return // on success the app swaps this screen out by itself
    }
    if (password.length < 8) return setError('Use at least 8 characters for your password.')
    if (password !== repeat) return setError('The two passwords don’t match.')
    setBusy(true)
    const { data, error } = await supabase.auth.signUp({ email: addr, password, options: { emailRedirectTo: location.origin } })
    setBusy(false)
    if (error) return setError(signUpError(error.message))
    if (data.session) return // email confirmation is off: already signed in
    if (data.user?.identities?.length === 0) return setError('That email already has an account. Sign in instead.')
    setSentTo(addr)
  }

  if (sentTo) {
    return (
      <div className="wrap">
        <main className="paper">
          <h2 className="ptitle big">Check your email</h2>
          <p className="hint" style={{ marginTop: 6 }}>
            We sent a confirmation link to <b>{sentTo}</b>. Open it, then come back here and sign in. If nothing arrives in a few minutes, look in your spam folder.
          </p>
          <button className="save" style={{ marginTop: 18, width: '100%' }} onClick={() => switchTo('in')}>Back to sign in</button>
        </main>
      </div>
    )
  }

  const up = mode === 'up'
  return (
    <div className="wrap">
      <main className="paper">
        <h2 className="ptitle big">Crit Agenda</h2>
        <p className="hint" style={{ marginTop: 4 }}>{up ? 'Create an account to keep your planner safe and in sync.' : 'Sign in to open your planner.'}</p>
        {confirmed && !up && (
          <div className="alert"><span className="bl">Email confirmed</span>Sign in to continue.</div>
        )}
        <form className="login" onSubmit={submit}>
          <label htmlFor="l-email">
            <span>Email</span>
            <input id="l-email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label htmlFor="l-pass">
            <span>{up ? 'Password (8 or more characters)' : 'Password'}</span>
            <input id="l-pass" type="password" autoComplete={up ? 'new-password' : 'current-password'} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {up && (
            <label htmlFor="l-repeat">
              <span>Repeat the password</span>
              <input id="l-repeat" type="password" autoComplete="new-password" required value={repeat} onChange={(e) => setRepeat(e.target.value)} />
            </label>
          )}
          {error && <p className="err" role="alert">{error}</p>}
          <button className="save" type="submit" disabled={busy || !email || !password}>
            {busy ? (up ? 'Creating…' : 'Signing in…') : up ? 'Create account' : 'Sign in'}
          </button>
        </form>
        {ALLOW_SIGNUP && (
          <button className="link" style={{ marginTop: 14 }} onClick={() => switchTo(up ? 'in' : 'up')}>
            {up ? 'I already have an account' : 'New here? Create an account'}
          </button>
        )}
      </main>
    </div>
  )
}
