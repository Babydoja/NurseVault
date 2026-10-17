import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
const why = { wrong_answer: 'Answer looks wrong', typo: 'Typo or unclear', duplicate: 'Duplicate', unclear: 'Unclear', other: 'Other' }
export default function Reports() {
  const [rows, setRows] = useState(null), [err, setErr] = useState('')
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('question_reports')
      .select('id,reason,note,created_at,question_id,questions(id,body,courses(code)),profiles!reported_by(full_name)').eq('status', 'open').order('created_at')
    if (error) return setErr('Could not load reports.')
    setErr(''); setRows(data)
  }, [])
  useEffect(() => { load() }, [load])
  const close = async (id, status) => { const { error } = await supabase.rpc('resolve_report', { p_report: id, p_status: status }); if (error) return setErr(error.message); load() }
  return (
    <div>
      <h2 className="font-semibold">Reported questions</h2>
      {err && <p className="mt-3 rounded-md bg-mist p-3 text-sm" role="alert">{err}</p>}
      {!rows && !err && <p className="mt-3 text-sm text-slate">Loading…</p>}
      {rows && !rows.length && <p className="mt-3 text-sm text-slate">No open reports.</p>}
      <ul className="mt-3 grid gap-3">
        {(rows || []).map(r => (
          <li key={r.id} className="paper p-4">
            <p className="text-sm text-slate"><span className="badge mr-2">{why[r.reason]}</span>{r.questions?.courses?.code}{r.profiles?.full_name ? ` · reported by ${r.profiles.full_name}` : ''}</p>
            <p className="q-text mt-1">{r.questions?.body || 'This question is no longer published.'}</p>
            {r.note && <p className="mt-2 text-sm">Note: {r.note}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {r.questions && <Link className="btn-ghost" to={`/library/${r.question_id}`}>Open question</Link>}
              <button className="btn-primary" onClick={() => close(r.id, 'resolved')}>Mark resolved</button>
              <button className="btn-ghost" onClick={() => close(r.id, 'dismissed')}>Dismiss</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
