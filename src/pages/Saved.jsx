import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import QuestionCard from '../components/QuestionCard.jsx'
export default function Saved() {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    supabase.from('bookmarks').select('created_at, questions(id,body,topic,session,answer_verified,courses(code,title,level,semester))').order('created_at', { ascending: false })
      .then(({ data }) => setRows((data || []).map(b => b.questions).filter(Boolean)))
  }, [])
  return (
    <div>
      <h1 className="text-2xl font-bold">Saved questions</h1>
      {!rows && <p className="mt-4 text-sm text-slate">Loading…</p>}
      {rows && !rows.length && <p className="mt-4 text-sm text-slate">Nothing saved yet. Open a question and choose "Save for later". <Link className="underline" to="/library">Browse past questions</Link></p>}
      <div className="mt-4 grid gap-4">{(rows || []).map(q => <QuestionCard key={q.id} q={q} />)}</div>
    </div>
  )
}
