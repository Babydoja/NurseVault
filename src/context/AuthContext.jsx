import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])
  const uid = session?.user?.id
  useEffect(() => {
    if (!uid) { setProfile(null); return }
    setLoading(true)
    supabase.from('profiles').select('*').eq('id', uid).single()
      .then(({ data }) => { setProfile(data); setLoading(false) })
  }, [uid])
  const value = { session, user: session?.user, profile, loading, isAdmin: profile?.role === 'admin', isStaff: ['admin','contributor'].includes(profile?.role), signOut: () => supabase.auth.signOut() }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
