import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import QuestionImage from './QuestionImage.jsx'
const letter = i => String.fromCharCode(65 + i)
export default function QuestionCards() {
  const [courses, setCourses] = useState([]), [topics, setTopics] = useState([]), [f, setF] = useState({ course: '', topic: '', count: '10' })
  const [deck, setDeck] = useState(null), [i, setI] = useState(0), [flip, setFlip] = useState(false), [ans, setAns] = useState({}), [tally, setTally] = useState({})
  const [busy, setBusy] = useState(false), [err, setErr] = useState('')
  useEffect(() => { supabase.from('courses').select('id,code').order('code').then(({ data }) => setCourses(data || [])) }, [])
  useEffect(() => { supabase.rpc('list_topics', { p_course: f.course || null }).then(({ data }) => setTopics(data || [])) }, [f.course])
  const start = async () => {
    setErr(''); setBusy(true)
    const { data, error } = await supabase.rpc('get_practice_questions', { p_course: f.course || null, p_topic: f.topic || null, p_count: +f.count })
    setBusy(false)
    if (error) return setErr('Could not load questions. Please try again.')
    if (!data.length) return setErr('No questions match these choices yet.')
    setDeck(data); setI(0); setFlip(false); setAns({}); setTally({})
  }
  const show = async q => {
    setFlip(true)
    if (!ans[q.id]) { const { data } = await supabase.rpc('reveal_answer', { p_question: q.id }); setAns(a => ({ ...a, [q.id]: data || {} })) }
  }
  const mark = (q, got) => { setTally(t => ({ ...t, [q.id]: got })); setI(x => x + 1); setFlip(false) }

  if (!deck) return (
    <div className="max-w-xl">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium">Course<select className="field" value={f.course} onChange={e => setF({ ...f, course: e.target.value })}><option value="">All</option>{courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-medium">Topic<select className="field" value={f.topic} onChange={e => setF({ ...f, topic: e.target.value })}><option value="">All</option>{topics.map(t => <option key={t}>{t}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-medium">Cards<select className="field" value={f.count} onChange={e => setF({ ...f, count: e.target.value })}>{[10, 20, 30, 50].map(n => <option key={n}>{n}</option>)}</select></label>
      </div>
      {err && <p className="mt-4 rounded-lg bg-mist p-3 text-sm" role="alert">{err}</p>}
      <p className="mt-4 text-sm text-slate">See the question, think of the answer, then flip to check it.</p>
      <button className="btn-primary mt-4" onClick={start} disabled={busy}>{busy ? 'Loading…' : 'Start flashcards'}</button>
    </div>
  )

  if (i >= deck.length) {
    const got = Object.values(tally).filter(Boolean).length
    return (
      <div className="card max-w-xl p-8 text-center">
        <p className="font-serif text-2xl font-semibold">Deck finished</p>
        <p className="mt-2 text-sm text-slate">You got {got} of {deck.length} right on the first look.</p>
        <div className="mt-5 flex justify-center gap-2"><button className="btn-primary" onClick={start}>New deck</button><button className="btn-ghost" onClick={() => setDeck(null)}>Change setup</button></div>
      </div>
    )
  }
  const q = deck[i], a = ans[q.id], right = a ? q.options.findIndex(o => o.id === a.correct_option_id) : -1
  return (
    <div className="max-w-2xl">
      <p className="mb-2 text-sm text-slate">Card {i + 1} of {deck.length} · {q.course_code}{q.topic ? ` · ${q.topic}` : ''}</p>
      <div className="paper min-h-56 p-6">
        <p className="q-text">{q.body}</p>
        <QuestionImage path={q.image_path} />
        {!flip ? (
          <ol className="mt-4 grid gap-2 text-sm">{q.options.map((o, k) => <li key={o.id} className="rounded-lg border border-line px-3 py-2">{letter(k)}. {o.body}</li>)}</ol>
        ) : (
          <div className="mt-4 rounded-lg bg-sky p-4 text-sm" role="status">
            {right >= 0 ? <p><strong>Answer: {letter(right)}.</strong> {q.options[right].body}</p> : <p>No answer on file for this question.</p>}
            {a?.verified === false && <p className="mt-1 text-slate">This answer has not been verified yet.</p>}
            {a?.explanation && <p className="mt-2">{a.explanation}</p>}
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button className="btn-ghost" onClick={() => { setI(i - 1); setFlip(false) }} disabled={i === 0}>Previous</button>
        {flip ? <span className="flex gap-2"><button className="btn-ghost" onClick={() => mark(q, false)}>Missed it</button><button className="btn-primary" onClick={() => mark(q, true)}>Got it</button></span>
              : <button className="btn-primary" onClick={() => show(q)}>Show answer</button>}
        <button className="btn-ghost" onClick={() => { setI(i + 1); setFlip(false) }}>Skip</button>
      </div>
    </div>
  )
}
