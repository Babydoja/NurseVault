import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { PageHeader, EmptyState } from '../components/ui.jsx'
export default function Notifications() {
  const nav = useNavigate(), { user } = useAuth()
  const [rows, setRows] = useState(null), [err, setErr] = useState('')
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)
    if (error) return setErr('Could not load notifications.')
    setErr(''); setRows(data)
  }, [])
  useEffect(() => { load() }, [load])
  const open = async n => {
    if (!n.read_at) await supabase.rpc('mark_notifications_read', { p_ids: [n.id] })
    if (n.link) nav(n.link); else load()
  }
  const markAll = async () => { await supabase.rpc('mark_notifications_read'); load() }
  const clear = async () => {
    if (!window.confirm('Clear all your notifications?')) return
    await supabase.from('notifications').delete().eq('user_id', user.id); load()
  }
  const hasUnread = (rows || []).some(n => !n.read_at)
  return (
    <div className="max-w-2xl">
      <PageHeader title="Notifications">Updates about your submissions, reports and role.</PageHeader>
      {err && <p className="mt-4 rounded-lg bg-mist p-3 text-sm" role="alert">{err}</p>}
      {rows && rows.length > 0 && <div className="mt-4 flex gap-2"><button className="btn-ghost" onClick={markAll} disabled={!hasUnread}>Mark all as read</button><button className="btn-ghost" onClick={clear}>Clear all</button></div>}
      {!rows && !err && <p className="mt-4 text-sm text-slate">Loading…</p>}
      {rows && !rows.length && <div className="mt-6"><EmptyState icon="bell" title="No notifications yet">You will see updates here when a question you submitted is reviewed.</EmptyState></div>}
      <ul className="mt-4 grid gap-2">
        {(rows || []).map(n => (
          <li key={n.id}>
            <button onClick={() => open(n)} className={`card w-full cursor-pointer p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${n.read_at ? '' : '!bg-sky'}`}>
              <p className="flex items-center gap-2 font-semibold">{!n.read_at && <span className="h-2 w-2 rounded-full bg-navy" aria-label="Unread" />}{n.title}</p>
              {n.body && <p className="mt-1 text-sm">{n.body}</p>}
              <p className="mt-1 text-xs text-slate">{new Date(n.created_at).toLocaleString()}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
