import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
const letter = k => String.fromCharCode(65 + k)
export default function Submissions() {
  const [items, setItems] = useState(null), [courses, setCourses] = useState([]), [err, setErr] = useState('')
  const [verify, setVerify] = useState({}), [dups, setDups] = useState({}), [ed, setEd] = useState(null), [chk, setChk] = useState({}), [bulkMsg, setBulkMsg] = useState('')
  const load = useCallback(async () => {
    const [s, c] = await Promise.all([
      supabase.from('question_submissions').select('*, courses(code), profiles!submitted_by(full_name)').eq('status', 'pending').order('created_at'),
      supabase.from('courses').select('id,code,title').order('code')])
    if (s.error) return setErr('Could not load submissions.')
    setItems(s.data); setCourses(c.data || [])
  }, [])
  useEffect(() => { load() }, [load])
  const run = async p => { setErr(''); const { error } = await p; if (error) return setErr(error.message); load() }
  const setCourse = (id, course_id) => run(supabase.rpc('set_submission_course', { p_submission: id, p_course: course_id }))
  const approve = i => run(supabase.rpc('approve_submission', { p_submission: i.id, p_verified: !!verify[i.id] }))
  const reject = i => { const note = window.prompt('Reason for rejecting (the student will see this)'); if (note !== null) run(supabase.rpc('reject_submission', { p_submission: i.id, p_note: note || null })) }
  const check = async i => { const { data } = await supabase.rpc('similar_questions', { p_text: i.question_text }); setDups({ ...dups, [i.id]: data || [] }) }
  const picked = (items || []).filter(i => chk[i.id])
  const bulkApprove = async () => {
    let ok = 0, skip = 0; setErr(''); setBulkMsg('')
    for (const i of picked) {
      if (!i.course_id) { skip++; continue }
      const { error } = await supabase.rpc('approve_submission', { p_submission: i.id, p_verified: false })
      if (error) { setErr(error.message); break }
      ok++
    }
    setChk({}); setBulkMsg(`Approved ${ok}.${skip ? ` Skipped ${skip} with no course assigned.` : ''}`); load()
  }
  const bulkReject = async () => {
    const note = window.prompt(`Reason for rejecting ${picked.length} submission${picked.length !== 1 ? 's' : ''} (students will see this)`)
    if (note === null) return
    setErr(''); setBulkMsg('')
    for (const i of picked) { const { error } = await supabase.rpc('reject_submission', { p_submission: i.id, p_note: note || null }); if (error) { setErr(error.message); break } }
    setChk({}); setBulkMsg(`Rejected ${picked.length}.`); load()
  }
  const startEdit = i => setEd({ id: i.id, text: i.question_text, opts: i.options.join('\n'), topic: i.topic || '', proposed: i.proposed_answer === null ? '' : String(i.proposed_answer) })
  const optList = ed => ed.opts.split('\n').map(x => x.trim()).filter(Boolean)
  const saveEdit = async () => {
    const o = optList(ed)
    if (o.length < 2) return setErr('Keep at least two options, one per line.')
    await run(supabase.rpc('edit_submission', { p_submission: ed.id, p_text: ed.text.trim(), p_options: o, p_proposed: ed.proposed === '' || +ed.proposed >= o.length ? null : +ed.proposed, p_topic: ed.topic.trim() }))
    setEd(null)
  }
  return (
    <div>
      <h2 className="font-semibold">Submissions to review</h2>
      {err && <p className="mt-3 rounded-md bg-mist p-3 text-sm" role="alert">{err}</p>}
      {bulkMsg && <p className="mt-3 rounded-lg bg-sky p-3 text-sm" role="status">{bulkMsg}</p>}
      {items && items.length > 0 && (
        <div className="card mt-3 flex flex-wrap items-center gap-2 p-3 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={picked.length === items.length} onChange={e => setChk(e.target.checked ? Object.fromEntries(items.map(i => [i.id, true])) : {})} />Select all</label>
          <span className="text-slate">{picked.length} selected</span>
          <button className="btn-primary" disabled={!picked.length} onClick={bulkApprove}>Approve selected</button>
          <button className="btn-ghost" disabled={!picked.length} onClick={bulkReject}>Reject selected</button>
        </div>
      )}
      {!items && !err && <p className="mt-3 text-sm text-slate">Loading…</p>}
      {items && !items.length && <p className="mt-3 text-sm text-slate">Nothing waiting for review.</p>}
      <ul className="mt-3 grid gap-3">
        {(items || []).map(i => (
          <li key={i.id} className="paper p-4">
            <label className="mb-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={!!chk[i.id]} onChange={e => setChk({ ...chk, [i.id]: e.target.checked })} />Select</label>
            <p className="text-sm text-slate">{i.session}{i.topic ? ` · ${i.topic}` : ''}{i.profiles?.full_name ? ` · from ${i.profiles.full_name}` : ''}</p>
            <p className="q-text mt-1">{i.question_text}</p>
            <ol className="mt-2 text-sm">{i.options.map((o, k) => <li key={k} className={k === i.proposed_answer ? 'font-semibold' : ''}>{letter(k)}. {o}{k === i.proposed_answer && ' (proposed answer)'}</li>)}</ol>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <select aria-label="Course" className="field w-auto" value={i.course_id || ''} onChange={e => setCourse(i.id, e.target.value)}>
                <option value="">Assign course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
              </select>
              {i.proposed_answer !== null && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!verify[i.id]} onChange={e => setVerify({ ...verify, [i.id]: e.target.checked })} />Mark answer verified</label>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-primary" disabled={!i.course_id} onClick={() => approve(i)}>Approve</button>
              <button className="btn-ghost" onClick={() => startEdit(i)}>Edit</button>
              <button className="btn-ghost" onClick={() => reject(i)}>Reject</button>
              <button className="btn-ghost" onClick={() => check(i)}>Check duplicates</button>
            </div>
            {ed?.id === i.id && (
              <div className="mt-3 grid gap-2 rounded-md border border-line p-3">
                <textarea className="field" rows={3} aria-label="Question text" value={ed.text} onChange={e => setEd({ ...ed, text: e.target.value })} />
                <textarea className="field" rows={4} aria-label="Options, one per line" value={ed.opts} onChange={e => setEd({ ...ed, opts: e.target.value })} />
                <div className="flex flex-wrap gap-2">
                  <input className="field w-auto" placeholder="Topic" aria-label="Topic" value={ed.topic} onChange={e => setEd({ ...ed, topic: e.target.value })} />
                  <select className="field w-auto" aria-label="Proposed answer" value={ed.proposed} onChange={e => setEd({ ...ed, proposed: e.target.value })}>
                    <option value="">No answer</option>{optList(ed).map((_, k) => <option key={k} value={k}>{letter(k)}</option>)}
                  </select>
                </div>
                <div className="flex gap-2"><button className="btn-primary" onClick={saveEdit}>Save changes</button><button className="btn-ghost" onClick={() => setEd(null)}>Cancel</button></div>
              </div>
            )}
            {dups[i.id] && <div className="mt-3 text-sm">{dups[i.id].length ? <><p className="font-semibold">Similar published questions</p><ul className="mt-1 list-disc pl-5">{dups[i.id].map(d => <li key={d.id}>{d.course_code} {d.session}: {d.body}</li>)}</ul></> : <p className="text-slate">No similar questions found.</p>}</div>}
          </li>
        ))}
      </ul>
    </div>
  )
}
