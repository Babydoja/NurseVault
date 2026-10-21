import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Icon } from './ui.jsx'
export default function StudyStreak() {
  const { user } = useAuth()
  const [s, setS] = useState(null), [err, setErr] = useState('')
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const load = useCallback(() => supabase.rpc('my_study_stats', { p_tz: tz }).then(({ data }) => { if (data) setS(data) }), [tz])
  useEffect(() => { load() }, [load])
  const setGoal = async e => {
    setErr('')
    const { error } = await supabase.from('profiles').update({ daily_goal: +e.target.value }).eq('id', user.id)
    if (error) return setErr('Could not save your goal.')
    load()
  }
  if (!s) return null
  const pct = Math.min(100, Math.round((s.today_questions / s.goal) * 100)), max = Math.max(s.goal, ...s.week.map(d => d.questions), 1)
  return (
    <section className="card mt-8 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-sky text-navy-soft"><Icon name="flame" className="h-6 w-6" /></span>
          <div>
            <p className="text-2xl font-bold leading-tight">{s.streak > 0 ? `${s.streak}-day streak` : 'Start your streak today'}</p>
            <p className="text-sm text-slate">Best streak: {s.best} day{s.best !== 1 && 's'}. Practice or flashcards both count.</p>
          </div>
        </div>
        <label className="grid gap-1 text-sm font-medium">Daily goal
          <select className="field w-auto" value={s.goal} onChange={setGoal}>{[5, 10, 20, 30, 50].map(n => <option key={n} value={n}>{n} questions</option>)}</select>
        </label>
      </div>
      {err && <p className="mt-3 rounded-lg bg-mist p-3 text-sm" role="alert">{err}</p>}
      <div className="mt-4">
        <div className="flex justify-between text-sm"><span>Today</span><span className="text-slate">{s.today_questions >= s.goal ? 'Goal reached' : `${s.today_questions} of ${s.goal} questions`}{s.today_cards > 0 ? ` · ${s.today_cards} flashcards` : ''}</span></div>
        <div className="mt-1 h-2.5 rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-2.5 rounded-full bg-navy" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="mt-5 flex items-end gap-2" aria-label="Questions answered in the last 7 days">
        {s.week.map((d, k) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
            <div className={`w-full rounded-md ${d.questions >= s.goal ? 'bg-navy' : d.questions > 0 || d.cards > 0 ? 'bg-navy-soft/60' : 'bg-line'}`} style={{ height: `${Math.max(6, (d.questions / max) * 56)}px` }} title={`${d.questions} questions, ${d.cards} flashcards`} />
            <span className={`text-xs ${k === 6 ? 'font-bold' : 'text-slate'}`}>{new Date(d.day + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
