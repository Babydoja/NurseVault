import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
export default function CourseProgress() {
  const [rows, setRows] = useState(null)
  useEffect(() => { supabase.rpc('my_course_progress').then(({ data }) => setRows(data || [])) }, [])
  if (!rows || !rows.length) return null
  return (
    <section className="card mt-8 p-5">
      <h2 className="font-semibold">Progress by course</h2>
      <p className="mt-1 text-sm text-slate">Seen means you have answered the question. Mastered means your latest answer was correct.</p>
      <ul className="mt-3 grid gap-4">
        {rows.map(c => (
          <li key={c.course_id}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span><span className="font-semibold">{c.code}</span> <span className="text-slate">{c.title}</span></span>
              <Link className="underline" to={`/practice?course=${c.course_id}`}>Practise</Link>
            </div>
            <div className="relative mt-1 h-2.5 rounded-full bg-line" role="progressbar" aria-valuenow={c.mastered} aria-valuemin={0} aria-valuemax={c.total} aria-label={`${c.code} mastered`}>
              <div className="absolute inset-y-0 left-0 rounded-full bg-navy-soft/50" style={{ width: `${(c.seen / c.total) * 100}%` }} />
              <div className="absolute inset-y-0 left-0 rounded-full bg-navy" style={{ width: `${(c.mastered / c.total) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate">Mastered {c.mastered} of {c.total} · seen {c.seen}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
