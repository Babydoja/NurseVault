import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
export default function ForgotPassword() {
  const [sent, setSent] = useState(false), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true)
    const email = new FormData(e.target).get('email')
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    setBusy(false)
    if (error) return setErr(error.message)
    setSent(true)
  }
  return (
    <div className="card mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      {sent ? (
        <p className="mt-6 rounded-md bg-sky p-4 text-sm" role="status">If an account exists for that email, a reset link is on its way. Check your spam folder too.</p>
      ) : (
        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <label className="grid gap-1 text-sm font-medium">Email<input name="email" type="email" className="field" required /></label>
          {err && <p className="rounded-md bg-mist p-3 text-sm" role="alert">{err}</p>}
          <button className="btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
        </form>
      )}
      <p className="mt-4 text-sm"><Link className="underline" to="/login">Back to log in</Link></p>
    </div>
  )
}
