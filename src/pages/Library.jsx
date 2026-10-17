import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { levels, semesters, sessions } from '../data.js'
import QuestionCard from '../components/QuestionCard.jsx'
import { PageHeader, EmptyState } from '../components/ui.jsx'
import { Link } from 'react-router-dom'
const PAGE = 20
export default function Library() {
  const [f, setF] = useState({ s:'', level:'', semester:'', session:'' })
  const [term, setTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([]), [count, setCount] = useState(0), [state, setState] = useState('loading')
  const set = k => e => { setF({ ...f, [k]: e.target.value }); setPage(0) }
  useEffect(() => { const t = setTimeout(() => setTerm(f.s.trim()), 300); return () => clearTimeout(t) }, [f.s])
  useEffect(() => {
    let off = false; setState('loading')
    let q = supabase.from('questions')
      .select('id,body,topic,session,answer_verified,courses!inner(code,title,level,semester)', { count: 'exact' })
      .eq('status', 'published')
    if (f.level) q = q.eq('courses.level', f.level)
    if (f.semester) q = q.eq('courses.semester', f.semester)
    if (f.session) q = q.eq('session', f.session)
    if (term) {
      const t = term.replace(/[%,()]/g, ' ')
      const code = t.match(/^([a-z]{3})\s?(\d{3})$/i)
      q = code ? q.eq('courses.code', `${code[1].toUpperCase()} ${code[2]}`) : q.or(`body.ilike.%${t}%,topic.ilike.%${t}%`)
    }
    q.order('created_at', { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1)
      .then(({ data, count, error }) => { if (off) return; if (error) return setState('error'); setRows(data); setCount(count); setState('ok') })
    return () => { off = true }
  }, [term, f.level, f.semester, f.session, page])
  const sel = (k, label, opts) => <select aria-label={label} className="field" value={f[k]} onChange={set(k)}><option value="">{label}</option>{opts.map(o=><option key={o}>{o}</option>)}</select>
  return (
    <div>
      <PageHeader title="Past questions">Search by course code or keyword, then narrow by level, semester and session.</PageHeader>
      <div className="card mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input className="field" placeholder="Course code or keyword" aria-label="Search" value={f.s} onChange={set('s')}/>
        {sel('level','All levels',levels)}{sel('semester','Both semesters',semesters)}{sel('session','All sessions',sessions)}
      </div>
      {state === 'error' && <p className="mt-4 rounded-md bg-mist p-3 text-sm" role="alert">Could not load questions. Check your connection and try again.</p>}
      {state === 'loading' && <p className="mt-4 text-sm text-slate">Loading…</p>}
      {state === 'ok' && <>
        <p className="mt-4 text-sm text-slate">{count} question{count !== 1 && 's'}</p>
        <div className="mt-3 grid gap-4">
          {rows.map(q => <QuestionCard key={q.id} q={q}/>)}
          {!rows.length && <EmptyState icon="search" title="No questions match these filters">Clear a filter, or <Link className="underline" to="/submit">submit one you remember</Link>.</EmptyState>}
        </div>
        {count > PAGE && <div className="mt-5 flex items-center justify-between">
          <button className="btn-ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="text-sm text-slate">Page {page + 1} of {Math.ceil(count / PAGE)}</span>
          <button className="btn-ghost" disabled={(page + 1) * PAGE >= count} onClick={() => setPage(page + 1)}>Next</button>
        </div>}
      </>}
    </div>
  )
}
