import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { parseCSV, download } from '../../lib/csv.js'
const blank = { id: null, category: '', term: '', meaning: '', note: '' }
export default function TermsTab() {
  const [rows, setRows] = useState(null), [form, setForm] = useState(blank), [err, setErr] = useState(''), [info, setInfo] = useState('')
  const [q, setQ] = useState(''), [imp, setImp] = useState(null), [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('term_cards').select('id,category,term,meaning,note').order('category').order('term')
    if (error) return setErr('Could not load flashcards.')
    setRows(data)
  }, [])
  useEffect(() => { load() }, [load])
  const up = (k, v) => setForm({ ...form, [k]: v })
  const cats = [...new Set((rows || []).map(r => r.category))]

  const save = async e => {
    e.preventDefault(); setErr(''); setInfo('')
    const p = { category: form.category.trim(), term: form.term.trim(), meaning: form.meaning.trim(), note: form.note.trim() || null }
    const { error } = form.id ? await supabase.from('term_cards').update(p).eq('id', form.id) : await supabase.from('term_cards').insert(p)
    if (error) return setErr(error.code === '23505' ? 'That term already exists in this category.' : error.message)
    setInfo(form.id ? 'Card updated.' : 'Card added.'); setForm(blank); load()
  }
  const del = async c => {
    if (!window.confirm(`Delete the card "${c.term}"?`)) return
    const { error } = await supabase.from('term_cards').delete().eq('id', c.id)
    if (error) return setErr(error.message)
    load()
  }
  const onFile = async e => {
    setErr(''); setInfo(''); setImp(null)
    const f = e.target.files[0]; if (!f) return
    const all = parseCSV(await f.text())
    const head = (all[0] || []).map(h => h.trim().toLowerCase())
    if (!['category', 'term', 'meaning'].every(h => head.includes(h))) return setErr('The first row needs these headers: category, term, meaning, note.')
    const good = [], bad = []
    all.slice(1).forEach((cells, k) => {
      const r = Object.fromEntries(head.map((h, i) => [h, (cells[i] || '').trim()]))
      r.category && r.term && r.meaning ? good.push({ category: r.category, term: r.term, meaning: r.meaning, note: r.note || null }) : bad.push(`Row ${k + 2}: category, term and meaning are all required`)
    })
    setImp({ good: [...new Map(good.map(c => [c.category + '|' + c.term, c])).values()], bad })
  }
  const runImport = async () => {
    setBusy(true)
    const { error } = await supabase.from('term_cards').upsert(imp.good, { onConflict: 'category,term' })
    setBusy(false)
    if (error) return setErr(error.message)
    setInfo(`Imported ${imp.good.length} card${imp.good.length !== 1 ? 's' : ''}. Existing terms were updated.`); setImp(null); load()
  }
  const shown = (rows || []).filter(r => !q.trim() || (r.term + ' ' + r.meaning + ' ' + r.category).toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <div>
      <h2 className="font-semibold">Flashcards: terms, abbreviations and mnemonics</h2>
      <p className="mt-1 text-sm text-slate">Students see these under Flashcards. Use any categories you like, for example Abbreviations, Mnemonics, Drug classes or Lab values.</p>
      {err && <p className="mt-3 rounded-lg bg-mist p-3 text-sm" role="alert">{err}</p>}
      {info && <p className="mt-3 rounded-lg bg-sky p-3 text-sm" role="status">{info}</p>}
      <form className="card mt-4 grid gap-3 p-4 sm:grid-cols-2" onSubmit={save}>
        <label className="grid gap-1 text-sm font-medium">Category<input className="field" list="term-cats" required value={form.category} onChange={e => up('category', e.target.value)} /><datalist id="term-cats">{cats.map(c => <option key={c} value={c} />)}</datalist></label>
        <label className="grid gap-1 text-sm font-medium">Term or abbreviation<input className="field" required value={form.term} onChange={e => up('term', e.target.value)} /></label>
        <label className="grid gap-1 text-sm font-medium sm:col-span-2">Meaning<textarea className="field" rows={2} required value={form.meaning} onChange={e => up('meaning', e.target.value)} /></label>
        <label className="grid gap-1 text-sm font-medium sm:col-span-2">Extra note (optional)<input className="field" value={form.note} onChange={e => up('note', e.target.value)} /></label>
        <div className="flex gap-2"><button className="btn-primary">{form.id ? 'Save card' : 'Add card'}</button>{form.id && <button type="button" className="btn-ghost" onClick={() => setForm(blank)}>Cancel</button>}</div>
      </form>
      <section className="card mt-4 p-4">
        <h3 className="text-sm font-semibold">Add many cards from a CSV file</h3>
        <p className="mt-1 text-sm text-slate">Columns: category, term, meaning, note. A term that already exists in the same category is updated.</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button className="btn-ghost" onClick={() => download('nursevault-flashcards-template.csv', 'category,term,meaning,note\nAbbreviations,ac,Before meals,a = ahead of the meal\n')}>Download template</button>
          <input type="file" accept=".csv,text/csv" aria-label="Flashcards CSV file" onChange={onFile} className="text-sm" />
        </div>
        {imp && <div className="mt-3 text-sm"><p className="font-semibold">{imp.good.length} ready{imp.bad.length ? `, ${imp.bad.length} skipped` : ''}</p>
          {imp.bad.length > 0 && <ul className="mt-1 list-disc pl-5">{imp.bad.slice(0, 20).map(b => <li key={b}>{b}</li>)}</ul>}
          <button className="btn-primary mt-3" disabled={busy || !imp.good.length} onClick={runImport}>{busy ? 'Importing…' : `Import ${imp.good.length} card${imp.good.length !== 1 ? 's' : ''}`}</button></div>}
      </section>
      <input className="field mt-5 max-w-sm" placeholder="Search cards" aria-label="Search cards" value={q} onChange={e => setQ(e.target.value)} />
      {!rows && !err && <p className="mt-3 text-sm text-slate">Loading…</p>}
      <p className="mt-3 text-sm text-slate">{shown.length} card{shown.length !== 1 && 's'}{shown.length > 60 ? ' (showing the first 60)' : ''}</p>
      <ul className="mt-2 grid gap-2">
        {shown.slice(0, 60).map(c => (
          <li key={c.id} className="card flex flex-wrap items-start justify-between gap-3 p-3 text-sm">
            <span><span className="font-semibold">{c.term}</span> <span className="badge ml-1">{c.category}</span><br />{c.meaning}{c.note && <span className="text-slate"> · {c.note}</span>}</span>
            <span className="flex gap-2"><button className="btn-ghost !py-1.5" onClick={() => { setInfo(''); setForm({ id: c.id, category: c.category, term: c.term, meaning: c.meaning, note: c.note || '' }); window.scrollTo(0, 0) }}>Edit</button><button className="btn-ghost !py-1.5" onClick={() => del(c)}>Delete</button></span>
          </li>
        ))}
      </ul>
    </div>
  )
}
