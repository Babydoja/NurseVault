import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
const letter = i => String.fromCharCode(65 + i)
export default function VerifyTab() {
  const [items, setItems] = useState(null), [pick, setPick] = useState({}), [err, setErr] = useState('')
  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('unverified_questions', { p_limit: 20 })
    if (error) return setErr('Could not load questions.')
    setErr(''); setItems(data)
    setPick(Object.fromEntries(data.map(q => [q.id, q.options.find(o => o.id === q.correct_option_id)?.position ?? ''])))
  }, [])
  useEffect(() => { load() }, [load])
  const verify = async q => {
    if (pick[q.id] === '') return setErr('Choose the correct option first.')
    const { error } = await supabase.rpc('verify_question', { p_question: q.id, p_correct: +pick[q.id], p_verified: true })
    if (error) return setErr(error.message)
    load()
  }
  return (
    <div>
      <h2 className="font-semibold">Questions waiting for answer verification</h2>
      <p className="mt-1 text-sm text-slate">Select the option you confirm is correct, then verify. Changing the selected option corrects the answer.</p>
      {err && <p className="mt-3 rounded-md bg-mist p-3 text-sm" role="alert">{err}</p>}
      {!items && !err && <p className="mt-3 text-sm text-slate">Loading…</p>}
      {items && !items.length && <p className="mt-3 text-sm text-slate">Every published question is verified.</p>}
      <ul className="mt-3 grid gap-3">
        {(items || []).map(q => (
          <li key={q.id} className="paper p-4">
            <p className="text-sm text-slate">{q.course_code} · {q.session}{q.topic ? ` · ${q.topic}` : ''}</p>
            <p className="q-text mt-1">{q.body}</p>
            <div className="mt-3 grid gap-2">
              {q.options.map(o => (
                <label key={o.id} className={`flex gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer ${pick[q.id] === o.position ? 'border-navy bg-sky' : 'border-line'}`}>
                  <input type="radio" name={`v${q.id}`} checked={pick[q.id] === o.position} onChange={() => setPick({ ...pick, [q.id]: o.position })} />{letter(o.position)}. {o.body}
                </label>
              ))}
            </div>
            <button className="btn-primary mt-3" onClick={() => verify(q)}>Verify answer</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
