import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
const esc = v => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
export default function Overview() {
  const [s, setS] = useState(null), [notes, setNotes] = useState([]), [msg, setMsg] = useState(''), [domain, setDomain] = useState(''), [err, setErr] = useState(''), [info, setInfo] = useState('')
  const load = useCallback(async () => {
    const [a, n, d] = await Promise.all([supabase.rpc('admin_stats'), supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('app_settings').select('value').eq('key', 'allowed_email_domain').maybeSingle()])
    setS(a.data); setNotes(n.data || []); setDomain(d.data?.value || '')
  }, [])
  useEffect(() => { load() }, [load])
  const run = async p => { setErr(''); const { error } = await p; if (error) return setErr(error.message); load() }
  const addNote = async e => { e.preventDefault(); if (!msg.trim()) return; await run(supabase.from('announcements').insert({ message: msg.trim() })); setMsg('') }
  const saveDomain = async () => {
    setInfo('')
    await run(domain.trim() ? supabase.from('app_settings').upsert({ key: 'allowed_email_domain', value: domain.trim() }) : supabase.from('app_settings').delete().eq('key', 'allowed_email_domain'))
    setInfo(domain.trim() ? 'Saved. New sign-ups are now limited to these domains.' : 'Restriction removed. Anyone can sign up.')
  }
  const exportCSV = async () => {
    setErr('')
    const { data, error } = await supabase.from('questions').select('body,topic,session,status,answer_verified,explanation,courses(code),answer_options(id,position,body),question_answers(correct_option_id)').range(0, 4999)
    if (error) return setErr('Could not export questions.')
    const head = ['course_code', 'session', 'topic', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'option_e', 'option_f', 'correct', 'verified', 'status', 'explanation']
    const lines = data.map(q => {
      const o = [...q.answer_options].sort((x, y) => x.position - y.position)
      const ka = Array.isArray(q.question_answers) ? q.question_answers[0] : q.question_answers
      const ci = o.findIndex(x => x.id === ka?.correct_option_id)
      return [q.courses.code, q.session, q.topic, q.body, ...[0, 1, 2, 3, 4, 5].map(k => o[k]?.body || ''), ci >= 0 ? 'ABCDEF'[ci] : '', q.answer_verified ? 'yes' : 'no', q.status, q.explanation].map(esc).join(',')
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + [head.join(','), ...lines].join('\n')], { type: 'text/csv' }))
    a.download = `nursevault-questions-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  }
  const cards = s ? [['Students', s.students], ['Contributors', s.contributors], ['New users (7 days)', s.new_users_7d], ['Published questions', s.published],
    ['Awaiting verification', s.unverified], ['Pending submissions', s.pending_submissions], ['Open reports', s.open_reports], ['Practice attempts (7 days)', s.attempts_7d]] : []
  return (
    <div>
      {err && <p className="mb-3 rounded-md bg-mist p-3 text-sm" role="alert">{err}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([l, v]) => <div key={l} className="rounded-md border border-line bg-white p-4"><p className="text-sm text-slate">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p></div>)}
      </div>
      {s?.top_courses?.length > 0 && <p className="mt-3 text-sm text-slate">Most practised: {s.top_courses.map(c => `${c.code} (${c.n})`).join(', ')}</p>}

      <section className="mt-8">
        <h2 className="font-semibold">Announcements</h2>
        <form className="mt-2 flex gap-2" onSubmit={addNote}>
          <input className="field" placeholder="Message shown at the top of every page" aria-label="Announcement" value={msg} onChange={e => setMsg(e.target.value)} />
          <button className="btn-primary">Post</button>
        </form>
        <ul className="mt-3 grid gap-2">{notes.map(n => (
          <li key={n.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-white p-3 text-sm">
            <span className={n.active ? '' : 'text-slate line-through'}>{n.message}</span>
            <span className="flex gap-2">
              <button className="btn-ghost" onClick={() => run(supabase.from('announcements').update({ active: !n.active }).eq('id', n.id))}>{n.active ? 'Hide' : 'Show'}</button>
              <button className="btn-ghost" onClick={() => run(supabase.from('announcements').delete().eq('id', n.id))}>Delete</button>
            </span>
          </li>))}</ul>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold">Limit sign-ups to school email addresses</h2>
        <p className="mt-1 text-sm text-slate">Enter one or more email domains separated by commas, for example <code>school.edu.ng, student.school.edu.ng</code>. Leave empty to allow anyone. This affects new sign-ups only, so existing accounts are not affected. A blocked person sees a generic "Database error saving new user" message.</p>
        <div className="mt-2 flex gap-2"><input className="field" aria-label="Allowed domains" value={domain} onChange={e => setDomain(e.target.value)} /><button className="btn-primary" onClick={saveDomain}>Save</button></div>
        {info && <p className="mt-2 text-sm" role="status">{info}</p>}
      </section>

      <section className="mt-8">
        <h2 className="font-semibold">Backup</h2>
        <p className="mt-1 text-sm text-slate">Download every question as a CSV file in the same format the Import tab reads. Keep a copy somewhere safe.</p>
        <button className="btn-ghost mt-2" onClick={exportCSV}>Export all questions</button>
      </section>
    </div>
  )
}
