import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
export default function QuestionImage({ path }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!path) return
    let off = false
    supabase.storage.from('question-images').createSignedUrl(path, 3600).then(({ data }) => { if (!off) setUrl(data?.signedUrl || null) })
    return () => { off = true }
  }, [path])
  if (!path || !url) return null
  return <img src={url} alt="Diagram for this question" className="mt-3 max-h-80 rounded-md border border-line" />
}
