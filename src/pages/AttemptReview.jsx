import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import AttemptItems from '../components/AttemptItems.jsx'
export default function AttemptReview() {
  const { id } = useParams()
  const [d, setD] = useState(undefined)
  useEffect(() => { supabase.rpc('get_attempt', { p_attempt: id }).then(({ data }) => setD(data || null)) }, [id])
  if (d === undefined) return <p className="text-slate">Loading…</p>
  if (!d) return <p>Attempt not found. <Link className="underline" to="/dashboard">Back to dashboard</Link></p>
  return (
    <div className="max-w-2xl">
      <Link className="text-sm underline" to="/dashboard">Back to dashboard</Link>
      <h1 className="mt-3 text-2xl font-bold">Attempt on {new Date(d.attempt.created_at).toLocaleDateString()}</h1>
      <p className="mt-2 rounded-md bg-sky p-3 font-semibold">Score: {d.attempt.score} of {d.attempt.total}</p>
      <div className="mt-5"><AttemptItems items={d.items} /></div>
    </div>
  )
}
