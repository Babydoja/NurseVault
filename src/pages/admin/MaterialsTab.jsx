import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
export default function MaterialsTab() {
  const { user } = useAuth()
  const [rows, setRows] = useState(null), [courses, setCourses] = useState([]), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('study_materials').select('id,title,file_path,status,size_bytes,courses(code)').order('created_at', { ascending: false })
    if (error) return setErr('Could not load materials.')
    setRows(data)
  }, [])
  useEffect(() => { load(); supabase.from('courses').select('id,code').order('code').then(({ data }) => setCourses(data || [])) }, [load])
  const upload = async e => {
    e.preventDefault(); setErr('')
    const form = e.target, d = Object.fromEntries(new FormData(form)), file = form.file.files[0]
    if (!file) return setErr('Choose a file.')
    if (file.size > 20 * 1024 * 1024) return setErr('Files must be under 20 MB.')
    setBusy(true)
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]+/g, '_')}`
    const up = await supabase.storage.from('materials').upload(path, file)
    if (up.error) { setBusy(false); return setErr('Upload failed: ' + up.error.message) }
    const { error } = await supabase.from('study_materials').insert({ title: d.title.trim(), course_id: d.course || null, file_path: path,
      file_type: (file.name.split('.').pop() || 'file').toUpperCase(), size_bytes: file.size, status: 'published', uploaded_by: user.id })
    setBusy(false)
    if (error) { await supabase.storage.from('materials').remove([path]); return setErr(error.message) }
    form.reset(); load()
  }
  const setStatus = async (m, status) => { const { error } = await supabase.from('study_materials').update({ status }).eq('id', m.id); if (error) return setErr(error.message); load() }
  const del = async m => {
    if (!window.confirm('Delete this material and its file permanently?')) return
    const { error } = await supabase.from('study_materials').delete().eq('id', m.id)
    if (error) return setErr(error.message)
    await supabase.storage.from('materials').remove([m.file_path]); load()
  }
  return (
    <div>
      <h2 className="font-semibold">Study materials</h2>
      <p className="mt-1 text-sm text-slate">Upload only files you have the right to share.</p>
      {err && <p className="mt-3 rounded-md bg-mist p-3 text-sm" role="alert">{err}</p>}
      <form className="paper mt-3 grid gap-3 p-4" onSubmit={upload}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">Title<input name="title" className="field" required /></label>
          <label className="grid gap-1 text-sm font-medium">Course (optional)<select name="course" className="field"><option value="">None</option>{courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}</select></label>
        </div>
        <input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" aria-label="File" className="text-sm" />
        <button className="btn-primary justify-self-start" disabled={busy}>{busy ? 'Uploading…' : 'Upload and publish'}</button>
      </form>
      <ul className="mt-4 grid gap-2">
        {(rows || []).map(m => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-white p-3 text-sm">
            <span><span className="font-semibold">{m.title}</span> <span className="text-slate">· {m.courses?.code || 'No course'} · {m.status}</span></span>
            <span className="flex gap-2">
              <button className="btn-ghost" onClick={() => setStatus(m, m.status === 'published' ? 'draft' : 'published')}>{m.status === 'published' ? 'Unpublish' : 'Publish'}</button>
              <button className="btn-ghost" onClick={() => del(m)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
