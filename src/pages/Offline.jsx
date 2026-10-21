import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { PageHeader, EmptyState } from '../components/ui.jsx'
const PREFIX = 'nv-pack-'
const letter = i => String.fromCharCode(65 + i)
const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }
const readPacks = () => {
  const out = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(PREFIX)) { const raw = localStorage.getItem(k); out.push({ id: k.slice(PREFIX.length), kb: Math.round(raw.length / 1024), ...JSON.parse(raw) }) }
    }
  } catch {}
  return out.sort((a, b) => a.course_code.localeCompare(b.course_code))
}

function OfflineQuiz({ pack, onExit }) {
  const [count, setCount] = useState('20'), [set, setSet] = useState(null), [i, setI] = useState(0), [picks, setPicks] = useState({})
  const begin = () => { const n = count === 'all' ? pack.questions.length : +count; setSet(shuffle(pack.questions).slice(0, n).map(q => ({ ...q, options: shuffle(q.options) }))); setI(0); setPicks({}) }
  if (!set) return (
    <div className="card max-w-xl p-5">
      <h2 className="text-lg font-semibold">{pack.course_code} · offline practice</h2>
      <p className="mt-1 text-sm text-slate">{pack.questions.length} saved questions. You see the answer right after each pick. Results here are not saved to your history.</p>
      <label className="mt-4 grid gap-1 text-sm font-medium">How many questions?
        <select className="field max-w-xs" value={count} onChange={e => setCount(e.target.value)}>{[10, 20, 50].map(n => <option key={n}>{n}</option>)}<option value="all">All {pack.questions.length}</option></select>
      </label>
      <div className="mt-4 flex gap-2"><button className="btn-primary" onClick={begin}>Start</button><button className="btn-ghost" onClick={onExit}>Back</button></div>
    </div>
  )
  if (i >= set.length) {
    const score = set.filter(q => picks[q.id] === q.correct_option_id).length
    const missed = set.filter(q => picks[q.id] !== q.correct_option_id)
    return (
      <div className="max-w-2xl">
        <p className="rounded-lg bg-sky p-4 text-lg font-semibold" role="status">You scored {score} of {set.length} ({Math.round((score / set.length) * 100)}%).</p>
        {missed.length > 0 && <div className="mt-4 grid gap-3">{missed.map(q => { const r = q.options.findIndex(o => o.id === q.correct_option_id); return (
          <div key={q.id} className="paper p-4 text-sm"><p className="q-text">{q.body}</p><p className="mt-2"><strong>Answer: {letter(r)}.</strong> {q.options[r].body}</p>{q.explanation && <p className="mt-1 text-slate">{q.explanation}</p>}</div>) })}</div>}
        <div className="mt-5 flex gap-2"><button className="btn-primary" onClick={begin}>Practise again</button><button className="btn-ghost" onClick={onExit}>Back</button></div>
      </div>
    )
  }
  const q = set[i], pick = picks[q.id], done = pick !== undefined
  return (
    <div className="max-w-2xl">
      <p className="text-sm text-slate">Question {i + 1} of {set.length} · {q.session}{q.topic ? ` · ${q.topic}` : ''}</p>
      <div className="paper mt-2 p-5">
        <p className="q-text">{q.body}</p>
        {q.has_image && <p className="mt-2 text-sm text-slate">This question has a diagram. Open it online to see the image.</p>}
        <div className="mt-4 grid gap-2">
          {q.options.map((o, k) => (
            <button key={o.id} disabled={done} onClick={() => setPicks({ ...picks, [q.id]: o.id })}
              className={`rounded-lg border px-3 py-2.5 text-left text-sm ${done ? (o.id === q.correct_option_id ? 'border-navy bg-sky' : pick === o.id ? 'border-slate bg-mist' : 'border-line') : 'border-line hover:bg-mist cursor-pointer'}`}>{letter(k)}. {o.body}</button>
          ))}
        </div>
        {done && <p className="mt-3 text-sm" role="status"><strong>{pick === q.correct_option_id ? 'Correct.' : 'Not quite.'}</strong> {q.explanation}</p>}
      </div>
      <div className="mt-4 flex justify-between"><button className="btn-ghost" onClick={onExit}>Stop</button><button className="btn-primary" disabled={!done} onClick={() => setI(i + 1)}>{i === set.length - 1 ? 'Finish' : 'Next'}</button></div>
    </div>
  )
}

export default function Offline() {
  const { session } = useAuth()
  const [packs, setPacks] = useState(readPacks), [courses, setCourses] = useState([]), [course, setCourse] = useState('')
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState(''), [err, setErr] = useState(''), [run, setRun] = useState(null)
  const online = navigator.onLine
  useEffect(() => { if (session && online) supabase.from('courses').select('id,code,title').order('code').then(({ data }) => setCourses(data || [])) }, [session, online])
  const save = async id => {
    const cid = id || course
    if (!cid) return
    setErr(''); setMsg(''); setBusy(true)
    const { data, error } = await supabase.rpc('get_offline_pack', { p_course: cid })
    setBusy(false)
    if (error || !data) return setErr('Could not download. Check your connection and try again.')
    if (!data.questions.length) return setErr('This course has no published questions with answers yet.')
    try { localStorage.setItem(PREFIX + cid, JSON.stringify(data)); setPacks(readPacks()); setMsg(`Saved ${data.questions.length} questions from ${data.course_code} on this device.`) }
    catch { setErr('Not enough space on this device. Remove a saved course and try again.') }
  }
  const remove = id => { try { localStorage.removeItem(PREFIX + id) } catch {} setPacks(readPacks()) }
  if (run) return <OfflineQuiz pack={run} onExit={() => setRun(null)} />
  return (
    <div className="max-w-2xl">
      <PageHeader title="Offline study">Save a course while you have data, then practise it later with no connection. Flashcards you have opened also work offline.</PageHeader>
      {err && <p className="mt-4 rounded-lg bg-mist p-3 text-sm" role="alert">{err}</p>}
      {msg && <p className="mt-4 rounded-lg bg-sky p-3 text-sm" role="status">{msg}</p>}
      <section className="card mt-5 p-4">
        <h2 className="font-semibold">Save a course for offline use</h2>
        {session && online ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <select className="field w-auto" aria-label="Course" value={course} onChange={e => setCourse(e.target.value)}><option value="">Choose a course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.code} · {c.title}</option>)}</select>
            <button className="btn-primary" disabled={!course || busy} onClick={() => save()}>{busy ? 'Saving…' : 'Save for offline'}</button>
          </div>
        ) : <p className="mt-2 text-sm text-slate">{session ? 'You are offline, so new courses cannot be saved right now.' : <>Log in while you are online to save courses. <Link className="underline" to="/login">Log in</Link></>}</p>}
      </section>
      <h2 className="mt-8 font-semibold">Saved on this device</h2>
      {!packs.length ? <div className="mt-3"><EmptyState icon="inbox" title="Nothing saved yet">Saved courses appear here and work without internet.</EmptyState></div> : (
        <ul className="mt-3 grid gap-2">
          {packs.map(p => (
            <li key={p.id} className="card flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
              <span><span className="font-semibold">{p.course_code}</span> · {p.title}<br /><span className="text-slate">{p.questions.length} questions · {p.kb} KB · saved {new Date(p.saved_at).toLocaleDateString()}</span></span>
              <span className="flex gap-2">
                <button className="btn-primary !py-1.5" onClick={() => setRun(p)}>Practise</button>
                {session && online && <button className="btn-ghost !py-1.5" disabled={busy} onClick={() => save(p.id)}>Update</button>}
                <button className="btn-ghost !py-1.5" onClick={() => remove(p.id)}>Remove</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm text-slate">Saved questions stay on this device only. Clearing your browser data removes them.</p>
    </div>
  )
}
