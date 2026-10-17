import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
export default function Topics() {
  const [courses, setCourses] = useState([]), [course, setCourse] = useState(''), [rows, setRows] = useState(null)
  useEffect(() => { supabase.from('courses').select('id,code').order('code').then(({ data }) => setCourses(data || [])) }, [])
  useEffect(() => { setRows(null); supabase.rpc('topic_frequency', { p_course: course || null }).then(({ data }) => setRows(data || [])) }, [course])
  return (
    <div>
      <h1 className="text-2xl font-bold">Topics across past questions</h1>
      <p className="mt-1 max-w-xl text-sm text-slate">How often each topic has appeared in the question bank. This shows patterns in past questions only; it does not predict what will be in any future exam.</p>
      <select aria-label="Course" className="field mt-4 max-w-xs" value={course} onChange={e => setCourse(e.target.value)}>
        <option value="">All courses</option>{courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
      </select>
      {!rows && <p className="mt-4 text-sm text-slate">Loading…</p>}
      {rows && !rows.length && <p className="mt-4 text-sm text-slate">No topics yet. They appear as questions with topics are published.</p>}
      <ul className="mt-4 grid gap-2">
        {(rows || []).map(t => (
          <li key={t.course_code + t.topic} className="flex items-center justify-between gap-3 rounded-md border border-line bg-white p-3 text-sm">
            <span><span className="font-semibold">{t.topic}</span> <span className="text-slate">· {t.course_code} · {t.questions} question{t.questions !== 1 && 's'} across {t.sessions} session{t.sessions !== 1 && 's'}</span></span>
            <Link className="btn-ghost" to={`/practice?topic=${encodeURIComponent(t.topic)}`}>Practise</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
