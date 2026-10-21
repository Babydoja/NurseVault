import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { EmptyState } from './ui.jsx'
const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }
export default function TermCards() {
  const { user } = useAuth()
  const [cards, setCards] = useState(null), [prog, setProg] = useState({}), [err, setErr] = useState('')
  const [cat, setCat] = useState(''), [q, setQ] = useState(''), [show, setShow] = useState('all'), [view, setView] = useState('cards'), [shuf, setShuf] = useState(false)
  const [order, setOrder] = useState([]), [i, setI] = useState(0), [flip, setFlip] = useState(false)

  useEffect(() => {
    (async () => {
      const [c, p] = await Promise.all([
        supabase.from('term_cards').select('id,category,term,meaning,note').order('category').order('term'),
        supabase.from('term_progress').select('card_id,known')])
      if (c.error) {
        try { const s = JSON.parse(localStorage.getItem('nv-terms') || 'null'); if (s) { setCards(s); setErr('You look offline. Showing the cards saved on this device. Your progress will not be saved until you are back online.'); return } } catch {}
        return setErr('Could not load flashcards.')
      }
      try { localStorage.setItem('nv-terms', JSON.stringify(c.data)) } catch {}
      setCards(c.data); setProg(Object.fromEntries((p.data || []).map(x => [x.card_id, x.known])))
    })()
  }, [])
  const cats = useMemo(() => [...new Set((cards || []).map(c => c.category))], [cards])
  const byId = useMemo(() => Object.fromEntries((cards || []).map(c => [c.id, c])), [cards])
  const matches = c => (!cat || c.category === cat)
    && (!q.trim() || (c.term + ' ' + c.meaning).toLowerCase().includes(q.trim().toLowerCase()))
    && (show === 'all' || (show === 'known' ? prog[c.id] === true : prog[c.id] !== true))
  // The deck is rebuilt when filters change, not when you mark a card, so the order stays steady while you study.
  useEffect(() => {
    if (!cards) return
    const ids = cards.filter(matches).map(c => c.id)
    setOrder(shuf ? shuffle(ids) : ids); setI(0); setFlip(false)
  }, [cards, cat, q, show, shuf])

  const known = (cards || []).filter(c => prog[c.id] === true).length
  const mark = async (c, k) => {
    setProg(p => ({ ...p, [c.id]: k })); setI(x => x + 1); setFlip(false)
    const { error } = await supabase.from('term_progress').upsert({ user_id: user.id, card_id: c.id, known: k, updated_at: new Date().toISOString() }, { onConflict: 'user_id,card_id' })
    if (error) setErr('Could not save your progress.')
  }
  const reset = async () => {
    if (!window.confirm('Reset your progress on all flashcards?')) return
    await supabase.from('term_progress').delete().eq('user_id', user.id); setProg({})
  }
  if (err && !cards) return <p className="rounded-lg bg-mist p-3 text-sm" role="alert">{err}</p>
  if (!cards) return <p className="text-sm text-slate">Loading…</p>
  const c = byId[order[i]]

  return (
    <div>
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input className="field" placeholder="Search a term or meaning" aria-label="Search" value={q} onChange={e => setQ(e.target.value)} />
        <select className="field" aria-label="Category" value={cat} onChange={e => setCat(e.target.value)}><option value="">All categories</option>{cats.map(x => <option key={x}>{x}</option>)}</select>
        <select className="field" aria-label="Show" value={show} onChange={e => setShow(e.target.value)}><option value="all">All cards</option><option value="learning">Still learning</option><option value="known">Known</option></select>
        <select className="field" aria-label="View" value={view} onChange={e => setView(e.target.value)}><option value="cards">Flip cards</option><option value="list">Quick lookup list</option></select>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate">
        <span>{known} of {cards.length} known</span>
        <span className="flex gap-4">
          <label className="flex items-center gap-2"><input type="checkbox" checked={shuf} onChange={e => setShuf(e.target.checked)} />Shuffle</label>
          <button className="underline cursor-pointer" onClick={reset}>Reset progress</button>
        </span>
      </div>
      {err && <p className="mt-3 rounded-lg bg-mist p-3 text-sm" role="alert">{err}</p>}

      {view === 'list' ? (
        <ul className="mt-4 grid gap-2">
          {cards.filter(matches).map(x => (
            <li key={x.id} className="card flex items-start justify-between gap-3 p-3 text-sm">
              <div><p><span className="font-semibold">{x.term}</span> <span className="badge ml-1">{x.category}</span></p><p className="mt-1">{x.meaning}</p>{x.note && <p className="mt-1 text-slate">{x.note}</p>}</div>
              {prog[x.id] === true && <span className="badge shrink-0">Known</span>}
            </li>
          ))}
          {!cards.filter(matches).length && <EmptyState icon="search" title="No cards match">Try a different search or filter.</EmptyState>}
        </ul>
      ) : !order.length ? (
        <div className="mt-4"><EmptyState icon="cards" title="No cards in this deck">Change the filters, or switch "Show" back to all cards.</EmptyState></div>
      ) : i >= order.length ? (
        <div className="card mt-4 p-8 text-center">
          <p className="font-serif text-2xl font-semibold">You went through this deck</p>
          <p className="mt-2 text-sm text-slate">{known} of {cards.length} cards known so far.</p>
          <div className="mt-5 flex justify-center gap-2"><button className="btn-primary" onClick={() => { setI(0); setFlip(false) }}>Go again</button><button className="btn-ghost" onClick={() => setShow('learning')}>Only cards I am still learning</button></div>
        </div>
      ) : (
        <div className="mt-4">
          <p className="mb-2 text-sm text-slate">Card {i + 1} of {order.length}</p>
          <button onClick={() => setFlip(!flip)} aria-label={flip ? 'Showing the meaning. Select to show the term.' : 'Showing the term. Select to show the meaning.'}
            className="card grid min-h-60 w-full cursor-pointer place-items-center p-8 text-center transition hover:shadow-md">
            <span>
              <span className="badge">{c.category}</span>
              {!flip ? (<>
                <span className="mt-4 block font-serif text-4xl font-semibold">{c.term}</span>
                <span className="mt-4 block text-sm text-slate">Tap to see the meaning</span>
              </>) : (<>
                <span className="mt-3 block text-sm text-slate">{c.term}</span>
                <span className="mt-2 block font-serif text-2xl">{c.meaning}</span>
                {c.note && <span className="mt-3 block text-sm text-slate">{c.note}</span>}
              </>)}
            </span>
          </button>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <button className="btn-ghost" onClick={() => { setI(i - 1); setFlip(false) }} disabled={i === 0}>Previous</button>
            {flip ? <span className="flex gap-2"><button className="btn-ghost" onClick={() => mark(c, false)}>Still learning</button><button className="btn-primary" onClick={() => mark(c, true)}>I know this</button></span>
                  : <button className="btn-primary" onClick={() => setFlip(true)}>Show meaning</button>}
            <button className="btn-ghost" onClick={() => { setI(i + 1); setFlip(false) }}>Skip</button>
          </div>
        </div>
      )}
    </div>
  )
}
