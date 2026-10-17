import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
export default function History() {
  const [rows, setRows] = useState(null), [names, setNames] = useState({}), [err, setErr] = useState('')
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('question_audit').select('*').order('created_at', { ascending: false }).limit(100)
      if (error) return setErr('Could not load history.')
      setRows(data)
      const ids = [...new Set(data.map(r => r.actor).filter(Boolean))]
      if (ids.length) { const p = await supabase.from('profiles').select('id,full_name').in('id', ids); setNames(Object.fromEntries((p.data || []).map(x => [x.id, x.full_name]))) }
    })()
  }, [])
  const text = r => r.action === 'verify' ? (r.verified ? 'Verified the answer' : 'Removed verification')
    : r.action === 'create' ? `Created: ${r.new_body}` : r.action === 'delete' ? `Deleted: ${r.old_body}`
    : r.old_status !== r.new_status ? `Status ${r.old_status} to ${r.new_status}: ${r.new_body}` : `Edited: ${r.new_body}`
  return (
    <div>
      <h2 className="font-semibold">Recent question changes</h2>
      {err && <p className="mt-3 rounded-md bg-mist p-3 text-sm" role="alert">{err}</p>}
      {!rows && !err && <p className="mt-3 text-sm text-slate">Loading…</p>}
      {rows && !rows.length && <p className="mt-3 text-sm text-slate">No changes recorded yet.</p>}
      <ul className="mt-3 divide-y divide-line rounded-md border border-line bg-white">
        {(rows || []).map(r => (
          <li key={r.id} className="p-3 text-sm">
            <p className="text-slate">{new Date(r.created_at).toLocaleString()} · {names[r.actor] || 'Unknown'}</p>
            <p className="mt-0.5">{text(r)}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
