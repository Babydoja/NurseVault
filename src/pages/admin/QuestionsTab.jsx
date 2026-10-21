import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { sessions } from '../../data.js'
const letter = i => String.fromCharCode(65 + i)
const one = x => (Array.isArray(x) ? x[0] : x)
const blank = { explanation: '', image: '', file: null, removeImage: false, id: null, course: '', session: '', topic: '', body: '', opts: ['', '', '', ''], correct: '', verified: false, status: 'published' }

export default function QuestionsTab() {
  const [rows, setRows] = useState(null), [courses, setCourses] = useState([]), [err, setErr] = useState('')
  const [form, setForm] = useState(null), [term, setTerm] = useState(''), [text, setText] = useState(''), [status, setStatus] = useState('')
  const load = useCallback(async () => {
    let r = supabase.from('questions')
      .select('id,body,topic,session,status,answer_verified,explanation,image_path,course_id,courses(code),answer_options(id,position,body),question_answers(correct_option_id)')
      .order('created_at', { ascending: false }).limit(50)
    if (status) r = r.eq('status', status)
    if (term) r = r.ilike('body', `%${term.replace(/[%,()]/g, ' ')}%`)
    const { data, error } = await r
    if (error) return setErr('Could not load questions.')
    setErr(''); setRows(data)
  }, [term, status])
  useEffect(() => { load() }, [load])
  const [topicList, setTopicList] = useState([])
  const [sel, setSel] = useState({}), [bulk, setBulk] = useState(''), [bulkCourse, setBulkCourse] = useState(''), [info, setInfo] = useState('')
  useEffect(() => { supabase.from('courses').select('id,code,title').order('code').then(({ data }) => setCourses(data || [])); supabase.rpc('list_topics').then(({ data }) => setTopicList(data || [])) }, [])

  const edit = q => {
    const opts = [...q.answer_options].sort((a, b) => a.position - b.position)
    const cid = one(q.question_answers)?.correct_option_id
    const idx = opts.findIndex(o => o.id === cid)
    setForm({ id: q.id, course: q.course_id, session: q.session, topic: q.topic || '', body: q.body, opts: opts.map(o => o.body),
      correct: idx >= 0 ? String(idx) : '', verified: q.answer_verified, status: q.status, explanation: q.explanation || '', image: q.image_path || '', file: null, removeImage: false })
  }
  const save = async e => {
    e.preventDefault(); setErr('')
    const opts = form.opts.map(o => o.trim())
    if (opts.some(o => !o)) return setErr('Fill in every option, or remove the empty ones.')
    let image = form.removeImage ? '' : null
    if (form.file) {
      const ext = (form.file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')
      const path = `${crypto.randomUUID()}.${ext}`
      const up = await supabase.storage.from('question-images').upload(path, form.file)
      if (up.error) return setErr('Image upload failed: ' + up.error.message)
      image = path
    }
    const { error } = await supabase.rpc('admin_save_question', {
      p_id: form.id, p_course: form.course, p_session: form.session, p_topic: form.topic.trim(), p_body: form.body.trim(),
      p_options: opts, p_correct: form.correct === '' ? null : +form.correct, p_verified: form.verified, p_status: form.status, p_explanation: form.explanation.trim(), p_image: image })
    if (error) return setErr(error.message)
    setForm(null); load()
  }
  const del = async q => {
    if (!window.confirm('Delete this question permanently? Practice records for it are removed too. To hide it instead, edit it and set the status to Archived.')) return
    const { error } = await supabase.from('questions').delete().eq('id', q.id)
    if (error) return setErr(error.message)
    load()
  }
  const ids = Object.keys(sel).filter(k => sel[k] && (rows || []).some(r => r.id === k))
  const runBulk = async () => {
    if (!ids.length || !bulk) return
    if (bulk === 'move' && !bulkCourse) return setErr('Choose the course to move them to.')
    if (bulk === 'delete' && !window.confirm(`Delete ${ids.length} question${ids.length !== 1 ? 's' : ''} permanently? Practice records for them are removed too. Archive instead if you only want to hide them.`)) return
    setErr(''); setInfo('')
    const { data, error } = await supabase.rpc('admin_bulk_questions', { p_ids: ids, p_action: bulk, p_course: bulkCourse || null })
    if (error) return setErr(error.message)
    setInfo(`Done. ${data} question${data !== 1 ? 's' : ''} updated.${bulk === 'verify' && data < ids.length ? ' Questions without a correct answer were skipped.' : ''}`)
    setSel({}); setBulk(''); load()
  }
  const up = (k, v) => setForm({ ...form, [k]: v })
  const setOpt = (i, v) => up('opts', form.opts.map((o, k) => (k === i ? v : o)))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">All questions</h2>
        {!form && <button className="btn-primary" onClick={() => setForm({ ...blank })}>New question</button>}
      </div>
      {err && <p className="mt-3 rounded-md bg-mist p-3 text-sm" role="alert">{err}</p>}

      {form && (
        <form className="paper mt-4 grid gap-4 p-5" onSubmit={save}>
          <h3 className="font-semibold">{form.id ? 'Edit question' : 'New question'}</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-1 text-sm font-medium">Course<select className="field" required value={form.course} onChange={e => up('course', e.target.value)}><option value="">Choose</option>{courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-medium">Session<select className="field" required value={form.session} onChange={e => up('session', e.target.value)}><option value="">Choose</option>{sessions.map(s => <option key={s}>{s}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-medium">Status<select className="field" value={form.status} onChange={e => up('status', e.target.value)}><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label>
          </div>
          <label className="grid gap-1 text-sm font-medium">Topic (optional, reuse an existing name where you can)<input className="field" list="topic-options" value={form.topic} onChange={e => up('topic', e.target.value)} /><datalist id="topic-options">{topicList.map(t => <option key={t} value={t} />)}</datalist></label>
          <label className="grid gap-1 text-sm font-medium">Question<textarea className="field" rows={3} required value={form.body} onChange={e => up('body', e.target.value)} /></label>
          <label className="grid gap-1 text-sm font-medium">Explanation shown with the answer (optional)<textarea className="field" rows={2} value={form.explanation} onChange={e => up('explanation', e.target.value)} /></label>
          <div className="grid gap-1 text-sm font-medium">Image (optional, under 5 MB)
            <input type="file" accept="image/*" onChange={e => up('file', e.target.files[0] || null)} />
            {form.image && !form.file && <label className="flex items-center gap-2 font-normal"><input type="checkbox" checked={form.removeImage} onChange={e => up('removeImage', e.target.checked)} />Remove the current image</label>}
          </div>
          <div className="grid gap-2">
            {form.opts.map((o, i) => (
              <div key={i} className="flex gap-2">
                <input className="field" aria-label={`Option ${letter(i)}`} placeholder={`Option ${letter(i)}`} value={o} onChange={e => setOpt(i, e.target.value)} />
                {form.opts.length > 2 && <button type="button" className="btn-ghost" onClick={() => setForm({ ...form, opts: form.opts.filter((_, k) => k !== i), correct: '' })}>Remove</button>}
              </div>
            ))}
            {form.opts.length < 6 && <button type="button" className="btn-ghost justify-self-start" onClick={() => up('opts', [...form.opts, ''])}>Add option</button>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">Correct answer<select className="field" value={form.correct} onChange={e => up('correct', e.target.value)}><option value="">None yet</option>{form.opts.map((_, i) => <option key={i} value={i}>{letter(i)}</option>)}</select></label>
            <label className="flex items-center gap-2 text-sm font-medium sm:pt-6"><input type="checkbox" checked={form.verified} onChange={e => up('verified', e.target.checked)} />Answer verified</label>
          </div>
          <div className="flex gap-2"><button className="btn-primary">Save question</button><button type="button" className="btn-ghost" onClick={() => { setForm(null); setErr('') }}>Cancel</button></div>
        </form>
      )}

      <form className="mt-5 flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); setTerm(text.trim()) }}>
        <input className="field w-auto flex-1" placeholder="Search question text" aria-label="Search" value={text} onChange={e => setText(e.target.value)} />
        <select className="field w-auto" aria-label="Status" value={status} onChange={e => setStatus(e.target.value)}><option value="">Any status</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
        <button className="btn-ghost">Search</button>
      </form>
      {info && <p className="mt-3 rounded-lg bg-sky p-3 text-sm" role="status">{info}</p>}
      {rows && rows.length > 0 && (
        <div className="card mt-3 flex flex-wrap items-center gap-2 p-3 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={ids.length === rows.length} onChange={e => setSel(e.target.checked ? Object.fromEntries(rows.map(r => [r.id, true])) : {})} />Select all shown</label>
          <span className="text-slate">{ids.length} selected</span>
          <select className="field w-auto" aria-label="Bulk action" value={bulk} onChange={e => setBulk(e.target.value)}>
            <option value="">Choose action</option><option value="publish">Publish</option><option value="draft">Move to draft</option><option value="archive">Archive</option>
            <option value="verify">Mark answers verified</option><option value="unverify">Remove verification</option><option value="move">Move to another course</option><option value="delete">Delete</option>
          </select>
          {bulk === 'move' && <select className="field w-auto" aria-label="Target course" value={bulkCourse} onChange={e => setBulkCourse(e.target.value)}><option value="">Course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}</select>}
          <button className="btn-primary" disabled={!ids.length || !bulk} onClick={runBulk}>Apply</button>
        </div>
      )}
      {!rows && !err && <p className="mt-3 text-sm text-slate">Loading…</p>}
      {rows && !rows.length && <p className="mt-3 text-sm text-slate">No questions found.</p>}
      <ul className="mt-3 grid gap-3">
        {(rows || []).map(q => (
          <li key={q.id} className="paper p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs"><input type="checkbox" aria-label="Select question" checked={!!sel[q.id]} onChange={e => setSel({ ...sel, [q.id]: e.target.checked })} /><span className="badge">{q.courses.code}</span><span className="badge">{q.session}</span><span className="badge">{q.status}</span><span className="badge">{q.answer_verified ? 'verified' : 'unverified'}</span></div>
            <p className="mt-2 text-sm">{q.body}</p>
            <div className="mt-3 flex gap-2"><button className="btn-ghost" onClick={() => edit(q)}>Edit</button><button className="btn-ghost" onClick={() => del(q)}>Delete</button></div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate">Showing the 50 newest matches.</p>
    </div>
  )
}
