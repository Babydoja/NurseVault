import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
export default function ResetPassword() {
  const { session, loading } = useAuth()
  const [done, setDone] = useState(false), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  if (loading) return <p className="text-slate">Loading…</p>
  if (!session) return <p className="mx-auto max-w-sm">This reset link is invalid or has expired. <Link className="underline" to="/forgot-password">Request a new one</Link>.</p>
  const submit = async e => {
    e.preventDefault(); setErr('')
    const d = Object.fromEntries(new FormData(e.target))
    if (d.password !== d.confirm) return setErr('The two passwords do not match.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: d.password })
    setBusy(false)
    if (error) return setErr(error.message)
    setDone(true)
  }
  return (
    <div className="card mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      {done ? (
        <p className="mt-6 rounded-md bg-sky p-4 text-sm" role="status">Password updated. <Link className="underline" to="/dashboard">Go to your dashboard</Link></p>
      ) : (
        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <label className="grid gap-1 text-sm font-medium">New password<input name="password" type="password" minLength={8} className="field" required /></label>
          <label className="grid gap-1 text-sm font-medium">Confirm password<input name="confirm" type="password" minLength={8} className="field" required /></label>
          {err && <p className="rounded-md bg-mist p-3 text-sm" role="alert">{err}</p>}
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
        </form>
      )}
    </div>
  )
}
