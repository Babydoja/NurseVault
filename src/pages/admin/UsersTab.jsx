import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
export default function UsersTab() {
  const { user } = useAuth()
  const [rows, setRows] = useState(null), [err, setErr] = useState(''), [q, setQ] = useState('')
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('id,full_name,level,role,created_at').order('created_at', { ascending: false }).limit(200)
    if (error) return setErr('Could not load users.')
    setErr(''); setRows(data)
  }, [])
  useEffect(() => { load() }, [load])
  const setRole = async (u, role) => {
    if (role === 'admin' && !window.confirm(`Make ${u.full_name || 'this user'} an admin? Admins can edit and delete everything.`)) return
    const { error } = await supabase.from('profiles').update({ role }).eq('id', u.id)
    if (error) return setErr(error.message)
    load()
  }
  const shown = (rows || []).filter(u => u.full_name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <h2 className="font-semibold">Users and roles</h2>
      <p className="mt-1 text-sm text-slate">Contributors can review submissions and verify answers. Admins can do everything.</p>
      {err && <p className="mt-3 rounded-md bg-mist p-3 text-sm" role="alert">{err}</p>}
      <input className="field mt-4 max-w-sm" placeholder="Search by name" aria-label="Search users" value={q} onChange={e => setQ(e.target.value)} />
      {!rows && !err && <p className="mt-3 text-sm text-slate">Loading…</p>}
      <ul className="mt-3 grid gap-2">
        {shown.map(u => (
          <li key={u.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-white p-3">
            <div><p className="font-semibold">{u.full_name || 'No name'}{u.id === user.id && ' (you)'}</p><p className="text-sm text-slate">{u.level ? `${u.level} level · ` : ''}joined {new Date(u.created_at).toLocaleDateString()}</p></div>
            <select aria-label={`Role for ${u.full_name}`} className="field w-auto" value={u.role} disabled={u.id === user.id} onChange={e => setRole(u, e.target.value)}>
              <option value="student">Student</option><option value="contributor">Contributor</option><option value="admin">Admin</option>
            </select>
          </li>
        ))}
      </ul>
    </div>
  )
}
