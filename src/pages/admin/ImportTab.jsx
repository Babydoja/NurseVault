import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
const COLS = ['course_code', 'session', 'topic', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'option_e', 'option_f', 'correct', 'verified', 'status', 'explanation']
const TEMPLATE = COLS.join(',') + '\nNSG 211,2023/2024,Vital signs,"Which is the normal adult resting pulse rate?",40-60 bpm,60-100 bpm,100-120 bpm,120-140 bpm,,,B,no,published,Adults at rest have a pulse of 60 to 100.\n'
const norm = c => (c || '').trim().toUpperCase().replace(/^([A-Z]{3})\s*(\d{3})$/, '$1 $2')

function parseCSV(t) {
  t = t.replace(/^\uFEFF/, '')
  const rows = []; let row = [], cell = '', q = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++ } else q = false } else cell += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cell); cell = ''; rows.push(row); row = [] }
    else cell += c
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows.filter(r => r.some(x => x.trim()))
}

function check(r, line, courses, publish) {
  const bad = error => ({ line, ok: false, error, r })
  const course = courses[norm(r.course_code)]
  if (!course) return bad(`Unknown course "${r.course_code || ''}"`)
  const session = (r.session || '').trim()
  if (!/^\d{4}\/\d{4}$/.test(session)) return bad('Session must look like 2023/2024')
  const body = (r.question || '').trim()
  if (!body) return bad('Question is empty')
  let opts = ['a', 'b', 'c', 'd', 'e', 'f'].map(l => (r['option_' + l] || '').trim())
  let last = opts.length - 1; while (last >= 0 && !opts[last]) last--
  opts = opts.slice(0, last + 1)
  if (opts.length < 2) return bad('Needs at least two options')
  if (opts.some(o => !o)) return bad('An option is blank between filled options')
  let correct = null
  const cl = (r.correct || '').trim().toUpperCase()
  if (cl) { correct = 'ABCDEF'.indexOf(cl); if (cl.length !== 1 || correct < 0 || correct >= opts.length) return bad(`Correct answer "${r.correct}" does not match an option`) }
  const st = (r.status || '').trim().toLowerCase()
  if (st && !['published', 'draft', 'archived'].includes(st)) return bad(`Invalid status "${r.status}"`)
  return { line, ok: true, r, data: { course: course, session, topic: (r.topic || '').trim(), body, explanation: (r.explanation || '').trim(), opts, correct,
    verified: /^(y|yes|true|1)$/i.test((r.verified || '').trim()) && correct !== null, status: st || (publish ? 'published' : 'draft') } }
}

export default function ImportTab() {
  const [courses, setCourses] = useState({}), [raw, setRaw] = useState(null)
  const [publish, setPublish] = useState(true), [skipDup, setSkipDup] = useState(true)
  const [busy, setBusy] = useState(false), [prog, setProg] = useState(0), [result, setResult] = useState(null), [err, setErr] = useState('')
  useEffect(() => { supabase.from('courses').select('id,code').order('code').then(({ data }) => setCourses(Object.fromEntries((data || []).map(c => [norm(c.code), c.id])))) }, [])

  const onFile = async e => {
    setErr(''); setResult(null); setRaw(null)
    const f = e.target.files[0]; if (!f) return
    const rows = parseCSV(await f.text())
    const head = (rows[0] || []).map(h => h.trim().toLowerCase())
    const need = ['course_code', 'session', 'question', 'option_a', 'option_b']
    if (need.some(n => !head.includes(n))) return setErr(`The first row must include these headers: ${need.join(', ')}. Download the template to see the format.`)
    setRaw(rows.slice(1).map(cells => Object.fromEntries(head.map((h, i) => [h, cells[i] || '']))))
  }
  const parsed = raw ? raw.map((r, i) => check(r, i + 2, courses, publish)) : []
  const good = parsed.filter(p => p.ok), badRows = parsed.filter(p => !p.ok)

  const run = async () => {
    setBusy(true); setErr('')
    const out = { done: 0, skipped: [], failed: [] }
    for (let k = 0; k < good.length; k++) {
      setProg(k + 1)
      const { data: d } = good[k], line = good[k].line
      if (skipDup) {
        const s = await supabase.rpc('similar_questions', { p_text: d.body, p_limit: 1 })
        if (s.data?.[0]?.score >= 0.9) { out.skipped.push(line); continue }
      }
      const { error } = await supabase.rpc('admin_save_question', { p_id: null, p_course: d.course, p_session: d.session, p_topic: d.topic,
        p_body: d.body, p_options: d.opts, p_correct: d.correct, p_verified: d.verified, p_status: d.status, p_explanation: d.explanation })
      if (error) out.failed.push(`Row ${line}: ${error.message}`); else out.done++
    }
    setResult(out); setRaw(null); setBusy(false)
  }
  const download = () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([TEMPLATE], { type: 'text/csv' })); a.download = 'nursevault-template.csv'; a.click()
  }

  return (
    <div>
      <h2 className="font-semibold">Import questions from a CSV file</h2>
      <p className="mt-1 text-sm text-slate">Use the template, fill one question per row, and save as CSV (UTF-8). Course codes must already exist. Correct is a letter A to F.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button className="btn-ghost" onClick={download}>Download template</button>
        <input type="file" accept=".csv,text/csv" aria-label="CSV file" onChange={onFile} disabled={busy} className="text-sm" />
      </div>
      <div className="mt-3 grid gap-1 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={publish} onChange={e => setPublish(e.target.checked)} />Publish rows that have no status column value (otherwise they are saved as drafts)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={skipDup} onChange={e => setSkipDup(e.target.checked)} />Skip questions that are near-identical to published ones</label>
      </div>
      {err && <p className="mt-3 rounded-md bg-mist p-3 text-sm" role="alert">{err}</p>}

      {raw && (
        <section className="mt-5">
          <p className="rounded-md bg-sky p-3 text-sm font-semibold" role="status">{good.length} ready to import{badRows.length ? `, ${badRows.length} with problems (these will be skipped)` : ''}.</p>
          {badRows.length > 0 && <ul className="mt-3 list-disc pl-5 text-sm">{badRows.slice(0, 50).map(b => <li key={b.line}>Row {b.line}: {b.error}</li>)}</ul>}
          {good.length > 0 && <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line text-slate"><th className="py-1 pr-3">Row</th><th className="pr-3">Course</th><th className="pr-3">Session</th><th className="pr-3">Question</th><th>Status</th></tr></thead>
            <tbody>{good.slice(0, 20).map(g => <tr key={g.line} className="border-b border-line"><td className="py-1 pr-3">{g.line}</td><td className="pr-3">{g.r.course_code}</td><td className="pr-3">{g.data.session}</td><td className="pr-3">{g.data.body.slice(0, 70)}</td><td>{g.data.status}</td></tr>)}</tbody>
          </table>{good.length > 20 && <p className="mt-1 text-xs text-slate">Showing the first 20 of {good.length}.</p>}</div>}
          <button className="btn-primary mt-4" disabled={busy || !good.length} onClick={run}>{busy ? `Importing ${prog} of ${good.length}…` : `Import ${good.length} question${good.length !== 1 ? 's' : ''}`}</button>
        </section>
      )}
      {result && (
        <section className="mt-5 text-sm" role="status">
          <p className="rounded-md bg-sky p-3 font-semibold">Imported {result.done}. Skipped as duplicates: {result.skipped.length}. Failed: {result.failed.length}.</p>
          {result.skipped.length > 0 && <p className="mt-2">Duplicate rows: {result.skipped.join(', ')}</p>}
          {result.failed.length > 0 && <ul className="mt-2 list-disc pl-5">{result.failed.map(f => <li key={f}>{f}</li>)}</ul>}
        </section>
      )}
    </div>
  )
}
