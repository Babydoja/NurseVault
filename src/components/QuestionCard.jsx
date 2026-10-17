import { Link } from 'react-router-dom'
import { Icon } from './ui.jsx'
export default function QuestionCard({ q }) {
  const c = q.courses
  return (
    <Link to={`/library/${q.id}`} className="paper block p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="badge !bg-navy !text-white">{c.code}</span><span className="badge">{c.level} level</span>
        <span className="badge">{c.semester} semester</span><span className="badge">{q.session}</span>
      </div>
      <p className="q-text">{q.body}</p>
      <p className="mt-3 flex items-center gap-1.5 text-sm text-slate">
        {q.answer_verified && <Icon name="check" className="h-4 w-4 text-navy-soft" />}
        {q.topic ? `${q.topic} · ` : ''}{q.answer_verified ? 'Answer verified' : 'Answer not yet verified'}
      </p>
    </Link>
  )
}
