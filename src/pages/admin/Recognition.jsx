import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { EmptyState } from '../../components/ui.jsx'
export default function Recognition() {
  const { user } = useAuth()
  const [rows, setRows] = useState(null), [err, setErr] = useState('')
  useEffect(() => { supabase.rpc('contributor_stats').then(({ data, error }) => error ? setErr('Could not load contributor stats.') : setRows(data || [])) }, [])
  const mine = (rows || []).find(r => r.user_id === user.id)
  return (
    <div>
      <h2 className="font-semibold">Contributor recognition</h2>
      <p className="mt-1 text-sm text-slate">Reviews, verified answers and handled reports. Thank you to everyone who keeps the question bank accurate.</p>
      {err && <p className="mt-3 rounded-lg bg-mist p-3 text-sm" role="alert">{err}</p>}
      {mine && <p className="mt-4 rounded-lg bg-sky p-3 text-sm" role="status">Your contributions: {mine.verifications} verified, {mine.approvals} approved, {mine.rejections} rejected, {mine.reports} reports handled. {mine.last30} in the last 30 days.</p>}
      {!rows && !err && <p className="mt-3 text-sm text-slate">Loading…</p>}
      {rows && !rows.length && <div className="mt-4"><EmptyState icon="inbox" title="No activity yet">Counts appear as reviewers verify answers and handle submissions.</EmptyState></div>}
      <ul className="mt-4 grid gap-2">
        {(rows || []).map((r, k) => (
          <li key={r.user_id} className={`card flex flex-wrap items-center justify-between gap-3 p-3 text-sm ${r.user_id === user.id ? '!border-navy-soft' : ''}`}>
            <span><span className="mr-2 inline-block w-6 text-slate">{k + 1}.</span><span className="font-semibold">{r.name || 'Unnamed'}</span> <span className="badge ml-1">{r.role}</span></span>
            <span className="text-slate">{r.verifications} verified · {r.approvals} approved · {r.rejections} rejected · {r.reports} reports · <strong className="text-navy">{r.total} total</strong> ({r.last30} in 30 days)</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
