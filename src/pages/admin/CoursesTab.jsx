import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { parseCSV, download } from '../../lib/csv.js'
import { normCode, normLevel, normSemester } from '../../lib/norm.js'
import { levels, semesters } from '../../data.js'
const blank = { id: null, code: '', title: '', level: '100', semester: 'First' }
const pick = (r, ...keys) => keys.map(k => r[k]).find(Boolean) || ''

export default function CoursesTab() {
  const [rows, setRows] = useState(null), [form, setForm] = useState(blank), [err, setErr] = useState(''), [info, setInfo] = useState('')
  const [imp, setImp] = useState(null), [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('courses').select('id,code,title,level,semester,questions(count)').order('code')
    if (error) return setErr('Could not load courses.')
    setRows(data)
  }, [])
  useEffect(() => { load() }, [load])
  const up = (k, v) => setForm({ ...form, [k]: v })

  const save = async e => {
    e.preventDefault(); setErr(''); setInfo('')
    const payload = { code: normCode(form.code), title: form.title.trim(), level: form.level, semester: form.semester }
    const { error } = form.id ? await supabase.from('courses').update(payload).eq('id', form.id) : await supabase.from('courses').insert(payload)
    if (error) return setErr(error.code === '23505' ? 'A course with this code already exists.' : error.message)
    setInfo(form.id ? 'Course updated.' : 'Course added.'); setForm(blank); load()
  }
  const del = async c => {
    if (!window.confirm(`Delete ${c.code}? This cannot be undone.`)) return
    const { error } = await supabase.from('courses').delete().eq('id', c.id)
    if (error) return setErr(error.code === '23503' ? `${c.code} still has questions or submissions, so it can't be deleted. Move or delete those first.` : error.message)
    setInfo('Course deleted.'); load()
  }

  const onFile = async e => {
    setErr(''); setInfo(''); setImp(null)
    const f = e.target.files[0]; if (!f) return
    const all = parseCSV(await f.text())
    const head = (all[0] || []).map(h => h.trim().toLowerCase())
    if (!head.some(h => ['code', 'course_code', 'course'].includes(h)) || !head.some(h => ['title', 'course_title'].includes(h)))
      return setErr('The first row needs these headers: code, title, level, semester. Download the template to see the format.')
    const good = [], bad = []
    all.slice(1).forEach((cells, k) => {
      const r = Object.fromEntries(head.map((h, i) => [h, (cells[i] || '').trim()]))
      const c = { code: normCode(pick(r, 'code', 'course_code', 'course')), title: pick(r, 'title', 'course_title'), level: normLevel(r.level), semester: normSemester(r.semester) }
      const why = !c.code ? 'missing code' : !c.title ? 'missing title' : !c.level ? `level "${r.level || ''}" is not 100 to 500` : !c.semester ? `semester "${r.semester || ''}" is not First or Second` : ''
      why ? bad.push(`Row ${k + 2}: ${why}`) : good.push(c)
    })
    setImp({ good: [...new Map(good.map(c => [c.code, c])).values()], bad })
  }
  const runImport = async () => {
    setBusy(true); setErr('')
    const { error } = await supabase.from('courses').upsert(imp.good, { onConflict: 'code' })
    setBusy(false)
    if (error) return setErr(error.message)
    setInfo(`Imported ${imp.good.length} course${imp.good.length !== 1 ? 's' : ''}. Existing codes were updated.`); setImp(null); load()
  }
  const template = () => download('nursevault-courses-template.csv', 'code,title,level,semester\nNSG 211,Fundamentals of Nursing,200,First\nANA 201,Human Anatomy,200,Second\n')

  return (
    <div>
      <h2 className="font-semibold">Courses</h2>
      <p className="mt-1 text-sm text-slate">Add the courses first. Questions, practice tests and filters all use this list.</p>
      {err && <p className="mt-3 rounded-lg bg-mist p-3 text-sm" role="alert">{err}</p>}
      {info && <p className="mt-3 rounded-lg bg-sky p-3 text-sm" role="status">{info}</p>}

      <form className="card mt-4 grid gap-3 p-4 sm:grid-cols-6" onSubmit={save}>
        <label className="grid gap-1 text-sm font-medium sm:col-span-1">Code<input className="field" placeholder="NSG 211" required value={form.code} onChange={e => up('code', e.target.value)} /></label>
        <label className="grid gap-1 text-sm font-medium sm:col-span-2">Title<input className="field" placeholder="Fundamentals of Nursing" required value={form.title} onChange={e => up('title', e.target.value)} /></label>
        <label className="grid gap-1 text-sm font-medium">Level<select className="field" value={form.level} onChange={e => up('level', e.target.value)}>{levels.map(l => <option key={l}>{l}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-medium">Semester<select className="field" value={form.semester} onChange={e => up('semester', e.target.value)}>{semesters.map(s => <option key={s}>{s}</option>)}</select></label>
        <div className="flex items-end gap-2"><button className="btn-primary">{form.id ? 'Save' : 'Add'}</button>{form.id && <button type="button" className="btn-ghost" onClick={() => setForm(blank)}>Cancel</button>}</div>
      </form>

      <section className="card mt-4 p-4">
        <h3 className="text-sm font-semibold">Add many courses from a CSV file</h3>
        <p className="mt-1 text-sm text-slate">Columns: code, title, level (100 to 500), semester (First/Second, 1/2, or Alpha/Omega). Codes that already exist are updated.</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button className="btn-ghost" onClick={template}>Download template</button>
          <input type="file" accept=".csv,text/csv" aria-label="Courses CSV file" onChange={onFile} className="text-sm" />
        </div>
        {imp && (<div className="mt-3 text-sm">
          <p className="font-semibold">{imp.good.length} ready{imp.bad.length ? `, ${imp.bad.length} with problems (skipped)` : ''}</p>
          {imp.bad.length > 0 && <ul className="mt-1 list-disc pl-5">{imp.bad.slice(0, 30).map(b => <li key={b}>{b}</li>)}</ul>}
          <button className="btn-primary mt-3" disabled={busy || !imp.good.length} onClick={runImport}>{busy ? 'Importing…' : `Import ${imp.good.length} course${imp.good.length !== 1 ? 's' : ''}`}</button>
        </div>)}
      </section>

      {!rows && !err && <p className="mt-4 text-sm text-slate">Loading…</p>}
      <ul className="mt-4 grid gap-2">
        {(rows || []).map(c => (
          <li key={c.id} className="card flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
            <span><span className="font-semibold">{c.code}</span> · {c.title} <span className="text-slate">· {c.level} level · {c.semester} semester · {c.questions?.[0]?.count ?? 0} question{(c.questions?.[0]?.count ?? 0) !== 1 && 's'}</span></span>
            <span className="flex gap-2"><button className="btn-ghost !py-1.5" onClick={() => { setInfo(''); setForm({ id: c.id, code: c.code, title: c.title, level: c.level, semester: c.semester }) }}>Edit</button><button className="btn-ghost !py-1.5" onClick={() => del(c)}>Delete</button></span>
          </li>
        ))}
      </ul>
    </div>
  )
}
