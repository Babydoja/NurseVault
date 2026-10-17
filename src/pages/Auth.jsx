import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { levels } from '../data.js'
import { Icon } from '../components/ui.jsx'
const perks = ['Past questions by course, level and session', 'Timed practice and study mode', 'Track your scores and weak topics']
export default function Auth({ mode }) {
  const reg = mode === 'register'
  const nav = useNavigate(), loc = useLocation()
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState(''), [err, setErr] = useState('')
  const submit = async e => {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true)
    const d = Object.fromEntries(new FormData(e.target))
    const { data, error } = reg
      ? await supabase.auth.signUp({ email: d.email, password: d.password, options: { data: { full_name: d.name, level: d.level } } })
      : await supabase.auth.signInWithPassword({ email: d.email, password: d.password })
    setBusy(false)
    if (error) return setErr(error.message)
    if (reg && !data.session) return setMsg('Account created. Check your email to confirm it, then log in.')
    nav(loc.state?.from || '/dashboard', { replace: true })
  }
  return (
    <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2 md:items-stretch">
      <aside className="hero hero-pattern hidden flex-col justify-between rounded-2xl p-8 md:flex">
        <div>
          <h2 className="font-serif text-3xl font-semibold leading-tight" style={{ color: '#fff' }}>Revise with real past questions.</h2>
          <ul className="mt-6 grid gap-3 text-sm" style={{ color: '#cfe0f5' }}>
            {perks.map(p => <li key={p} className="flex items-start gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" />{p}</li>)}
          </ul>
        </div>
        <p className="mt-10 text-xs" style={{ color: '#9db8d8' }}>NurseVault is built for Babcock University nursing students.</p>
      </aside>
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold">{reg ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-1 text-sm text-slate">{reg ? 'It takes about a minute.' : 'Log in to continue revising.'}</p>
        <form className="mt-6 grid gap-4" onSubmit={submit}>
          {reg && <label className="grid gap-1 text-sm font-medium">Full name<input name="name" className="field" required/></label>}
          <label className="grid gap-1 text-sm font-medium">Email<input name="email" type="email" className="field" required/></label>
          {reg && <label className="grid gap-1 text-sm font-medium">Level<select name="level" className="field">{levels.map(l=><option key={l}>{l}</option>)}</select></label>}
          <label className="grid gap-1 text-sm font-medium">Password<input name="password" type="password" minLength={8} className="field" required/></label>
          {!reg && <Link className="text-sm underline" to="/forgot-password">Forgot password?</Link>}
          {err && <p className="rounded-lg bg-mist p-3 text-sm" role="alert">{err}</p>}
          {msg && <p className="rounded-lg bg-sky p-3 text-sm" role="status">{msg}</p>}
          <button className="btn-primary btn-lg" disabled={busy}>{busy ? 'Please wait…' : reg ? 'Create account' : 'Log in'}</button>
        </form>
        <p className="mt-4 text-sm text-slate">{reg ? 'Already registered?' : 'New here?'} <Link className="underline" to={reg?'/login':'/register'}>{reg?'Log in':'Create an account'}</Link></p>
      </div>
    </div>
  )
}
