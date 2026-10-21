import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { levels, sessions } from '../data.js'
import QuestionImage from '../components/QuestionImage.jsx'
import AttemptItems from '../components/AttemptItems.jsx'
const letter = i => String.fromCharCode(65 + i)
const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }

export default function CBT() {
  const [sp] = useSearchParams()
  const [phase, setPhase] = useState('setup') // setup | loading | test | submitting | done
  const [f, setF] = useState({ type: 'custom', course: sp.get('course') || '', level: '', session: '', topic: sp.get('topic') || '', count: '10', timed: true, mode: 'exam', paper: '' })
  const [kind, setKind] = useState('custom')
  const [courses, setCourses] = useState([]), [topics, setTopics] = useState([]), [papers, setPapers] = useState([]), [missed, setMissed] = useState(0)
  const [set, setSet] = useState([]), [i, setI] = useState(0), [a, setA] = useState({}), [left, setLeft] = useState(0), [rev, setRev] = useState({})
  const [result, setResult] = useState(null), [items, setItems] = useState([]), [err, setErr] = useState('')
  const study = f.mode === 'study'

  useEffect(() => {
    supabase.from('courses').select('id,code,title').order('code').then(({ data }) => setCourses(data || []))
    supabase.rpc('list_papers').then(({ data }) => setPapers(data || []))
    supabase.rpc('missed_count').then(({ data }) => setMissed(data || 0))
  }, [])
  useEffect(() => { supabase.rpc('list_topics', { p_course: f.course || null }).then(({ data }) => setTopics(data || [])) }, [f.course])

  const start = async (k = f.type) => {
    setErr(''); setKind(k)
    if (k === 'paper' && !f.paper) return setErr('Choose a past paper first.')
    setPhase('loading')
    let res
    if (k === 'missed') res = await supabase.rpc('get_missed_questions', { p_limit: +f.count })
    else if (k === 'paper') { const [cid, ses] = f.paper.split('|'); res = await supabase.rpc('get_past_paper', { p_course: cid, p_session: ses }) }
    else res = await supabase.rpc('get_practice_questions', { p_course: f.course || null, p_level: f.level || null, p_session: f.session || null, p_count: +f.count, p_topic: f.topic || null })
    const { data, error } = res
    if (error) { setErr('Could not load questions. Please try again.'); return setPhase('setup') }
    if (!data.length) { setErr(k === 'missed' ? 'You have no missed questions right now. Nice work.' : 'No practice questions match these choices yet.'); return setPhase('setup') }
    setSet(k === 'paper' ? data : data.map(q => ({ ...q, options: shuffle(q.options) })))
    setA({}); setRev({}); setI(0); setResult(null); setLeft(f.timed ? data.length * 60 : 0); setPhase('test')
  }
  useEffect(() => { if (sp.get('missed')) start('missed') }, [])

  const submit = async () => {
    setPhase('submitting')
    const { data, error } = await supabase.rpc('submit_attempt', {
      p_answers: set.map(q => ({ question_id: q.id, option_id: a[q.id] || null })),
      p_filters: { type: kind, course: f.course || null, level: f.level || null, session: f.session || null, topic: f.topic || null } })
    if (error) { setErr('Could not submit your answers. Check your connection and try again.'); setF(x => ({ ...x, timed: false })); return setPhase('test') }
    const att = await supabase.rpc('get_attempt', { p_attempt: data.attempt_id })
    const order = Object.fromEntries(set.map((q, k) => [q.id, k]))
    setItems([...(att.data?.items || [])].sort((x, y) => order[x.question_id] - order[y.question_id]))
    supabase.rpc('missed_count').then(({ data: n }) => setMissed(n || 0))
    setResult(data); setPhase('done')
  }
  useEffect(() => {
    if (phase !== 'test' || !f.timed) return
    if (left <= 0) { submit(); return }
    const t = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, left, f.timed])

  const pick = async (q, id) => {
    if (study && rev[q.id]) return
    setA(x => ({ ...x, [q.id]: id }))
    if (study) { const { data } = await supabase.rpc('reveal_answer', { p_question: q.id }); setRev(r => ({ ...r, [q.id]: data || {} })) }
  }
  const answered = Object.keys(a).length
  const finish = () => {
    const rest = set.length - answered
    if (rest && !window.confirm(`You have ${rest} unanswered question${rest > 1 ? 's' : ''}. Submit anyway?`)) return
    submit()
  }
  const sel = (key, label, opts) => (
    <label className="grid gap-1 text-sm font-medium">{label}
      <select className="field" value={f[key]} onChange={e => setF({ ...f, [key]: e.target.value })}>
        <option value="">All</option>{opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  )

  if (phase === 'loading' || phase === 'submitting') return <p className="text-slate">{phase === 'loading' ? 'Loading questions…' : 'Scoring your answers…'}</p>

  if (phase === 'setup') return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Set up your practice</h1>
      <label className="mt-5 grid gap-1 text-sm font-medium">What do you want to practise?
        <select className="field" value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>
          <option value="custom">A custom set (choose course, topic and more)</option>
          <option value="paper">A full past paper (one course and session, in order)</option>
          <option value="missed">Questions I missed{missed ? ` (${missed} waiting)` : ''}</option>
        </select>
      </label>
      {f.type === 'custom' && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {sel('course', 'Course', courses.map(c => ({ v: c.id, l: c.code })))}
          {sel('topic', 'Topic', topics.map(t => ({ v: t, l: t })))}
          {sel('level', 'Level', levels.map(l => ({ v: l, l })))}
          {sel('session', 'Session', sessions.map(s => ({ v: s, l: s })))}
        </div>
      )}
      {f.type === 'paper' && (
        <label className="mt-4 grid gap-1 text-sm font-medium">Past paper
          <select className="field" value={f.paper} onChange={e => setF({ ...f, paper: e.target.value })}>
            <option value="">Choose a paper</option>
            {papers.map(p => <option key={p.course_id + p.session} value={`${p.course_id}|${p.session}`}>{p.course_code} · {p.session} ({p.questions} questions)</option>)}
          </select>
          {!papers.length && <span className="font-normal text-slate">No papers yet. They appear once questions with answers are published.</span>}
        </label>
      )}
      {f.type === 'missed' && <p className="mt-4 rounded-lg bg-sky p-3 text-sm">{missed ? `You have ${missed} question${missed !== 1 ? 's' : ''} you got wrong or left blank last time. Practise them until you get them right.` : 'Nothing to retry yet. Questions you miss in a test will show up here.'}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {f.type !== 'paper' && (
          <label className="grid gap-1 text-sm font-medium">Number of questions
            <select className="field" value={f.count} onChange={e => setF({ ...f, count: e.target.value })}>{[5, 10, 20, 30, 50].map(c => <option key={c}>{c}</option>)}</select>
          </label>
        )}
        <label className="grid gap-1 text-sm font-medium">Mode
          <select className="field" value={f.mode} onChange={e => setF({ ...f, mode: e.target.value })}>
            <option value="exam">Exam mode: results at the end</option><option value="study">Study mode: answer after each question</option>
          </select>
        </label>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={f.timed} onChange={e => setF({ ...f, timed: e.target.checked })} />Timed (1 minute per question)
      </label>
      {err && <p className="mt-4 rounded-lg bg-mist p-3 text-sm" role="alert">{err}</p>}
      <p className="mt-4 text-sm text-slate">{f.type === 'paper' ? 'Past paper questions keep their original order and option order.' : 'If fewer questions match, you get all of them. Option order is shuffled each time.'}</p>
      <button className="btn-primary mt-4" onClick={() => start()} disabled={f.type === 'missed' && !missed}>Start</button>
    </div>
  )

  if (phase === 'done') return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Your result</h1>
      <p className="mt-4 rounded-lg bg-sky p-4 text-lg font-semibold" role="status">
        You scored {result.score} of {result.total}{result.total ? ` (${Math.round((result.score / result.total) * 100)}%)` : ''}.
        {f.timed && left <= 0 && ' Time ran out.'}
      </p>
      <div className="mt-6"><AttemptItems items={items} /></div>
      <div className="mt-6 flex flex-wrap gap-2">
        {kind !== 'paper' && <button className="btn-primary" onClick={() => start(kind)}>Take another set</button>}
        {kind === 'paper' && <button className="btn-primary" onClick={() => start('paper')}>Retake this paper</button>}
        {missed > 0 && kind !== 'missed' && <button className="btn-ghost" onClick={() => start('missed')}>Retry what I missed ({missed})</button>}
        <button className="btn-ghost" onClick={() => setPhase('setup')}>Change setup</button>
      </div>
    </div>
  )

  const q = set[i], total = set.length, r = rev[q.id]
  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{kind === 'paper' ? 'Past paper' : kind === 'missed' ? 'Retry missed' : study ? 'Study mode' : 'Practice test'}</h1>
        {f.timed && <p className={`rounded-lg px-3 py-1 text-sm font-semibold ${left <= 60 ? 'bg-navy text-white' : 'bg-sky'}`}>Time left {mmss(left)}</p>}
      </div>
      {err && <p className="mt-3 rounded-lg bg-mist p-3 text-sm" role="alert">{err}</p>}
      <div className="mt-3">
        <div className="flex justify-between text-sm text-slate"><span>Question {i + 1} of {total}</span><span>{answered} answered</span></div>
        <div className="mt-1 h-2 rounded-full bg-line" role="progressbar" aria-valuenow={answered} aria-valuemin={0} aria-valuemax={total}>
          <div className="h-2 rounded-full bg-navy" style={{ width: `${(answered / total) * 100}%` }} />
        </div>
      </div>
      <fieldset className="paper mt-5 p-5">
        <legend className="sr-only">Question {i + 1}</legend>
        <p className="q-text">{q.body}</p>
        <QuestionImage path={q.image_path} />
        <div className="mt-4 grid gap-2">
          {q.options.map((o, k) => {
            const style = r ? (o.id === r.correct_option_id ? 'border-navy bg-sky' : a[q.id] === o.id ? 'border-slate bg-mist' : 'border-line')
                            : (a[q.id] === o.id ? 'border-navy bg-sky' : 'border-line hover:bg-mist')
            return (
              <label key={o.id} className={`flex gap-2 rounded-lg border px-3 py-2.5 text-sm cursor-pointer ${style}`}>
                <input type="radio" name={`q${q.id}`} checked={a[q.id] === o.id} disabled={!!r} onChange={() => pick(q, o.id)} />{letter(k)}. {o.body}
              </label>
            )
          })}
        </div>
        {r && <p className="mt-3 text-sm" role="status"><strong>{a[q.id] === r.correct_option_id ? 'Correct.' : 'Not quite.'}</strong> {r.explanation}</p>}
      </fieldset>
      <div className="mt-4 flex items-center justify-between">
        <button className="btn-ghost" onClick={() => setI(i - 1)} disabled={i === 0}>Previous</button>
        {i < total - 1 ? <button className="btn-primary" onClick={() => setI(i + 1)}>Next</button>
                       : <button className="btn-primary" onClick={finish}>Submit answers</button>}
      </div>
      <nav className="mt-6" aria-label="Jump to question">
        <p className="text-sm text-slate">Jump to a question</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {set.map((x, k) => (
            <button key={x.id} onClick={() => setI(k)} aria-label={`Question ${k + 1}${a[x.id] ? ', answered' : ''}`} aria-current={k === i}
              className={`h-9 w-9 rounded-lg border text-sm font-semibold cursor-pointer ${k === i ? 'border-navy bg-navy text-white' : a[x.id] ? 'border-navy-soft bg-sky' : 'border-line bg-white'}`}>{k + 1}</button>
          ))}
        </div>
        <button className="btn-ghost mt-4" onClick={finish}>Finish early</button>
      </nav>
    </div>
  )
}
