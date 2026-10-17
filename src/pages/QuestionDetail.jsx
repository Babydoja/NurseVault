import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import QuestionImage from '../components/QuestionImage.jsx'
const reasons = [['wrong_answer', 'The marked answer looks wrong'], ['typo', 'Typo or unclear wording'], ['duplicate', 'Duplicate of another question'], ['other', 'Something else']]
export default function QuestionDetail() {
  const { id } = useParams(), { user } = useAuth()
  const [q, setQ] = useState(null), [ans, setAns] = useState(null), [similar, setSimilar] = useState([]), [state, setState] = useState('loading')
  const [saved, setSaved] = useState(false), [rep, setRep] = useState(null), [msg, setMsg] = useState('')
  useEffect(() => {
    let off = false; setState('loading')
    supabase.from('bookmarks').select('question_id').eq('question_id', id).maybeSingle().then(({ data }) => { if (!off) setSaved(!!data) })
    Promise.all([
      supabase.from('questions').select('id,body,topic,session,source,explanation,image_path,courses(code,title),answer_options(id,position,body)').eq('id', id).maybeSingle(),
      supabase.rpc('reveal_answer', { p_question: id }),
    ]).then(async ([{ data, error }, a]) => {
      if (off) return
      if (error) return setState('error')
      if (!data) return setState('missing')
      data.answer_options.sort((x, y) => x.position - y.position)
      setQ(data); setAns(a.data); setState('ok')
      const s = await supabase.rpc('similar_questions', { p_text: data.body, p_exclude: data.id })
      if (!off) setSimilar(s.data || [])
    })
    return () => { off = true }
  }, [id])
  const toggle = async () => {
    const { error } = saved ? await supabase.from('bookmarks').delete().eq('question_id', id).eq('user_id', user.id)
                            : await supabase.from('bookmarks').insert({ user_id: user.id, question_id: id })
    if (error) return setMsg('Could not update your saved questions.')
    setSaved(!saved)
  }
  const send = async e => {
    e.preventDefault()
    const { error } = await supabase.from('question_reports').insert({ question_id: id, reported_by: user.id, reason: rep.reason, note: rep.note.trim() || null })
    setRep(null)
    setMsg(error ? (error.code === '23505' ? 'You already reported this question. It is waiting for review.' : 'Could not send your report.') : 'Thanks. Your report has been sent for review.')
  }
  if (state === 'loading') return <p className="text-slate">Loading…</p>
  if (state === 'error') return <p role="alert">Could not load this question. <Link className="underline" to="/library">Back to library</Link></p>
  if (state === 'missing') return <p>Question not found. <Link className="underline" to="/library">Back to library</Link></p>
  return (
    <div className="max-w-2xl">
      <Link className="text-sm underline" to="/library">Back to library</Link>
      <p className="mt-4 text-sm text-slate">{q.courses.code} · {q.courses.title} · {q.session}</p>
      <div className="paper mt-3 p-6">
        <p className="q-text">{q.body}</p>
        <QuestionImage path={q.image_path} />
        <ol className="mt-4 grid gap-2 text-sm">{q.answer_options.map((o, i) => (
          <li key={o.id} className={`rounded-md border px-3 py-2 ${ans?.correct_option_id === o.id ? 'border-navy bg-sky' : 'border-line'}`}>{String.fromCharCode(65 + i)}. {o.body}</li>
        ))}</ol>
        {q.explanation && <p className="mt-4 text-sm"><strong>Explanation.</strong> {q.explanation}</p>}
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        {q.topic && <div><dt className="text-slate">Topic</dt><dd>{q.topic}</dd></div>}
        <div><dt className="text-slate">Source</dt><dd>{q.source}</dd></div>
        <div><dt className="text-slate">Answer status</dt><dd>{!ans ? 'No answer on file' : ans.verified ? 'Verified' : 'Proposed, not yet verified'}</dd></div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        <button className="btn-ghost" onClick={toggle} aria-pressed={saved}>{saved ? 'Saved. Remove' : 'Save for later'}</button>
        {!rep && <button className="btn-ghost" onClick={() => { setMsg(''); setRep({ reason: 'wrong_answer', note: '' }) }}>Report a problem</button>}
      </div>
      {msg && <p className="mt-3 rounded-md bg-sky p-3 text-sm" role="status">{msg}</p>}
      {rep && (
        <form className="paper mt-3 grid gap-3 p-4" onSubmit={send}>
          <label className="grid gap-1 text-sm font-medium">What is wrong?<select className="field" value={rep.reason} onChange={e => setRep({ ...rep, reason: e.target.value })}>{reasons.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-medium">Details (optional)<textarea className="field" rows={3} value={rep.note} onChange={e => setRep({ ...rep, note: e.target.value })} /></label>
          <div className="flex gap-2"><button className="btn-primary">Send report</button><button type="button" className="btn-ghost" onClick={() => setRep(null)}>Cancel</button></div>
        </form>
      )}
      {similar.length > 0 && <section className="mt-8">
        <h2 className="font-semibold">Similar questions from other sessions</h2>
        <ul className="mt-3 grid gap-2">{similar.map(s => (
          <li key={s.id}><Link to={`/library/${s.id}`} className="paper block p-3 text-sm hover:bg-sky/40"><span className="badge mr-2">{s.course_code} · {s.session}</span>{s.body}</Link></li>
        ))}</ul>
      </section>}
    </div>
  )
}
