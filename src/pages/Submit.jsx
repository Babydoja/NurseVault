import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { sessions } from '../data.js'
export default function Submit() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([]), [sent, setSent] = useState(false), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  useEffect(() => { supabase.from('courses').select('id,code,title').order('code').then(({ data }) => setCourses(data || [])) }, [])
  const submit = async e => {
    e.preventDefault(); setErr('')
    const d = Object.fromEntries(new FormData(e.target))
    const letters = ['A', 'B', 'C', 'D']
    const kept = letters.map((l, i) => ({ l, t: (d['opt' + i] || '').trim() })).filter(o => o.t)
    if (kept.length < 2) return setErr('Add at least two answer options.')
    let proposed = null
    if (d.answer) { proposed = kept.findIndex(o => o.l === d.answer); if (proposed < 0) return setErr('The answer you chose has no option text.') }
    setBusy(true)
    const { error } = await supabase.from('question_submissions').insert({
      submitted_by: user.id, course_id: d.course, session: d.session, topic: d.topic.trim() || null,
      question_text: d.question.trim(), options: kept.map(o => o.t), proposed_answer: proposed })
    setBusy(false)
    if (error) return setErr('Could not submit. Please try again.')
    setSent(true)
  }
  if (sent) return <div className="max-w-xl rounded-md bg-sky p-5" role="status"><p className="font-semibold">Question submitted for review.</p><p className="mt-1 text-sm">It stays pending until it is reviewed. <Link className="underline" to="/my-submissions">See my submissions</Link></p><button className="btn-ghost mt-4" onClick={() => setSent(false)}>Submit another</button></div>
  return (
    <form className="max-w-xl grid gap-4" onSubmit={submit}>
      <h1 className="text-2xl font-bold">Submit a question you remember</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">Course<select name="course" className="field" required><option value="">Choose</option>{courses.map(c => <option key={c.id} value={c.id}>{c.code} {c.title}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-medium">Session<select name="session" className="field" required><option value="">Choose</option>{sessions.map(s => <option key={s}>{s}</option>)}</select></label>
      </div>
      <label className="grid gap-1 text-sm font-medium">Topic (optional)<input name="topic" className="field"/></label>
      <label className="grid gap-1 text-sm font-medium">Question<textarea name="question" className="field" rows={4} required/></label>
      <div className="grid gap-3 sm:grid-cols-2">{['A', 'B', 'C', 'D'].map((l, i) => <label key={l} className="grid gap-1 text-sm font-medium">Option {l}<input name={'opt' + i} className="field"/></label>)}</div>
      <label className="grid gap-1 text-sm font-medium">Answer you think is correct<select name="answer" className="field"><option value="">Not sure</option>{['A', 'B', 'C', 'D'].map(l => <option key={l}>{l}</option>)}</select></label>
      {err && <p className="rounded-md bg-mist p-3 text-sm" role="alert">{err}</p>}
      <button className="btn-primary justify-self-start" disabled={busy}>{busy ? 'Submitting…' : 'Submit for review'}</button>
    </form>
  )
}
