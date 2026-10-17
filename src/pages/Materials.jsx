import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
const size = b => !b ? '' : b > 1e6 ? ` · ${(b / 1e6).toFixed(1)} MB` : ` · ${Math.round(b / 1e3)} KB`
export default function Materials() {
  const [items, setItems] = useState(null), [err, setErr] = useState('')
  useEffect(() => {
    supabase.from('study_materials').select('id,title,file_path,file_type,size_bytes,courses(code)').eq('status', 'published').order('created_at', { ascending: false })
      .then(({ data, error }) => error ? setErr('Could not load materials.') : setItems(data))
  }, [])
  const download = async m => {
    const { data, error } = await supabase.storage.from('materials').createSignedUrl(m.file_path, 60)
    if (error) return setErr('Could not create a download link.')
    window.open(data.signedUrl, '_blank')
  }
  return (
    <div>
      <h1 className="text-2xl font-bold">Study materials</h1>
      {err && <p className="mt-4 rounded-md bg-mist p-3 text-sm" role="alert">{err}</p>}
      {!items && !err && <p className="mt-4 text-sm text-slate">Loading…</p>}
      {items && !items.length && <p className="mt-4 text-sm text-slate">No materials have been published yet.</p>}
      <ul className="mt-5 grid gap-3">
        {(items || []).map(m => (
          <li key={m.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-white p-4">
            <div><p className="font-semibold">{m.title}</p><p className="text-sm text-slate">{m.courses?.code ? `${m.courses.code} · ` : ''}{m.file_type}{size(m.size_bytes)}</p></div>
            <button className="btn-ghost" onClick={() => download(m)}>Download</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
