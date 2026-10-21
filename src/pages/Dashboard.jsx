import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Icon } from '../components/ui.jsx'
import StudyStreak from '../components/StudyStreak.jsx'
import CourseProgress from '../components/CourseProgress.jsx'
export default function Dashboard() {
  const { profile, user } = useAuth()
  const [attempts, setAttempts] = useState(null), [subs, setSubs] = useState(0), [approved, setApproved] = useState(0), [topics, setTopics] = useState([]), [missed, setMissed] = useState(0)
  useEffect(() => {
    supabase.from('quiz_attempts').select('id,score,total,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50).then(({ data }) => setAttempts(data || []))
    supabase.from('question_submissions').select('id', { count: 'exact', head: true }).eq('submitted_by', user.id).then(({ count }) => setSubs(count || 0))
    supabase.from('question_submissions').select('id', { count: 'exact', head: true }).eq('submitted_by', user.id).eq('status', 'approved').then(({ count }) => setApproved(count || 0))
    supabase.rpc('my_topic_stats').then(({ data }) => setTopics(data || []))
    supabase.rpc('missed_count').then(({ data }) => setMissed(data || 0))
  }, [user.id])
  const scored = (attempts || []).filter(a => a.total > 0)
  const avg = scored.length ? Math.round(scored.reduce((s, a) => s + (a.score / a.total) * 100, 0) / scored.length) + '%' : '–'
  const stats = [['Practice attempts', attempts ? attempts.length : '…', 'practice', null], ['Average score', avg, 'chart', null], ['Questions submitted', subs, 'upload', approved ? `${approved} approved` : null]]
  const weak = topics.filter(t => t.answered >= 2 && t.topic !== 'General').slice(0, 5)
  return (
    <div>
      <h1 className="text-3xl font-semibold">Hello{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map(([l, v, ic, sub]) => <div key={l} className="card flex items-center gap-4 p-5"><span className="grid h-11 w-11 place-items-center rounded-lg bg-sky text-navy-soft"><Icon name={ic} /></span><div><p className="text-sm text-slate">{l}</p><p className="text-3xl font-bold leading-tight">{v}</p>{sub && <p className="text-xs text-slate">{sub}</p>}</div></div>)}
      </div>
      <p className="mt-3 flex flex-wrap gap-4 text-sm"><Link className="underline" to="/my-submissions">My submissions</Link>{missed > 0 && <Link className="underline" to="/practice?missed=1">Retry {missed} question{missed !== 1 && 's'} I missed</Link>}</p>
      <StudyStreak />
      <CourseProgress />
      {weak.length > 0 && (
        <section className="card mt-8 p-5">
          <h2 className="font-semibold">Topics to work on</h2>
          <p className="mt-1 text-sm text-slate">Your lowest scores so far (topics with at least 2 answers).</p>
          <ul className="mt-2 divide-y divide-line">
            {weak.map(t => (
              <li key={t.topic} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>{t.topic} <span className="text-slate">· {t.correct}/{t.answered} correct ({t.pct}%)</span></span>
                <Link className="btn-ghost" to={`/practice?topic=${encodeURIComponent(t.topic)}`}>Practise</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="card mt-8 p-5">
        <h2 className="font-semibold">Practice history</h2>
        {attempts && !attempts.length && <p className="mt-2 text-sm text-slate">No attempts yet. <Link className="underline" to="/practice">Take a practice test</Link> and your scores will appear here.</p>}
        <ul className="mt-2 divide-y divide-line">
          {(attempts || []).slice(0, 10).map(a => (
            <li key={a.id} className="flex items-center justify-between py-2 text-sm">
              <span>{new Date(a.created_at).toLocaleDateString()}</span>
              <span className="flex items-center gap-3"><span className="font-semibold">{a.score} / {a.total}</span><Link className="underline" to={`/attempts/${a.id}`}>Review</Link></span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
