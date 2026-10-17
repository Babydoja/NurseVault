import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
const label = { pending: 'Waiting for review', approved: 'Approved and published', rejected: 'Not published' }
export default function MySubmissions() {
  const { user } = useAuth(), [rows, setRows] = useState(null)
  useEffect(() => {
    supabase.from('question_submissions').select('id,question_text,status,review_note,session,created_at,courses(code)').eq('submitted_by', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setRows(data || []))
  }, [user.id])
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">My submissions</h1>
      {!rows && <p className="mt-4 text-sm text-slate">Loading…</p>}
      {rows && !rows.length && <p className="mt-4 text-sm text-slate">You have not submitted anything yet. <Link className="underline" to="/submit">Submit a question</Link></p>}
      <ul className="mt-4 grid gap-3">
        {(rows || []).map(r => (
          <li key={r.id} className="paper p-4">
            <p className="text-sm text-slate">{r.courses?.code ? `${r.courses.code} · ` : ''}{r.session} · {new Date(r.created_at).toLocaleDateString()}</p>
            <p className="q-text mt-1">{r.question_text}</p>
            <p className="mt-2"><span className="badge">{label[r.status]}</span></p>
            {r.status === 'rejected' && r.review_note && <p className="mt-2 text-sm text-slate">Reviewer's note: {r.review_note}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
