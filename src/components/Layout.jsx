import { useState, useEffect } from 'react'
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { Logo, Icon } from './ui.jsx'
const member = [['/library','Past questions'],['/practice','Practice'],['/flashcards','Flashcards'],['/offline','Offline'],['/topics','Topics'],['/materials','Materials'],['/submit','Submit'],['/saved','Saved'],['/dashboard','Dashboard']]
const pill = ({isActive}) => `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${isActive?'bg-sky text-navy':'text-slate hover:bg-mist hover:text-navy'}`
const dot = 'grid min-w-[1.1rem] place-items-center rounded-full bg-navy px-1 text-[10px] font-bold text-white'
export default function Layout() {
  const { session, profile, isAdmin, isStaff, signOut } = useAuth()
  const nav = useNavigate(), { pathname } = useLocation()
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark')
  const [notes, setNotes] = useState([]), [unread, setUnread] = useState(0), [staffN, setStaffN] = useState(0)
  useEffect(() => { supabase.from('announcements').select('id,message').eq('active', true).order('created_at', { ascending: false }).limit(3).then(({ data }) => setNotes(data || [])) }, [])
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => { const on = () => setOnline(true), off = () => setOnline(false); window.addEventListener('online', on); window.addEventListener('offline', off); return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) } }, [])
  const uid = session?.user?.id
  useEffect(() => {
    if (!uid) { setUnread(0); setStaffN(0); return }
    let off = false
    const poll = async () => {
      const n = await supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null)
      if (!off) setUnread(n.count || 0)
      if (isStaff) { const s = await supabase.rpc('staff_counts'); if (!off && s.data) setStaffN((s.data.pending || 0) + (s.data.reports || 0)) }
    }
    poll()
    const t = setInterval(poll, 60000)
    return () => { off = true; clearInterval(t) }
  }, [uid, isStaff, pathname])
  const toggle = () => {
    const n = dark ? 'light' : 'dark'
    document.documentElement.dataset.theme = n
    try { localStorage.setItem('nv-theme', n) } catch {}
    setDark(!dark)
  }
  const links = [...(session ? member : []), ...(isStaff ? [['/admin', isAdmin ? 'Admin' : 'Review', staffN]] : []), ['/about','Guidelines']]
  const initial = (profile?.full_name || session?.user?.email || '?')[0].toUpperCase()
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" aria-label="NurseVault home"><Logo /></Link>
          <div className="flex items-center gap-2">
            <button className="btn-ghost !px-3 !py-1.5" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? 'Light' : 'Dark'}</button>
            {session ? (<>
              <Link to="/notifications" className="btn-ghost relative !px-2.5 !py-1.5" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
                <Icon name="bell" className="h-4 w-4" />{unread > 0 && <span className={`${dot} absolute -right-1 -top-1`}>{unread > 9 ? '9+' : unread}</span>}
              </Link>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-sky text-sm font-bold text-navy-soft" title={profile?.full_name || session.user.email}>{initial}</span>
              <button className="btn-ghost !px-3 !py-1.5" onClick={async()=>{await signOut();nav('/')}}>Log out</button>
            </>) : (<>
              <Link to="/login" className="btn-ghost !px-3 !py-1.5">Log in</Link>
              <Link to="/register" className="btn-primary !px-3 !py-1.5">Sign up</Link>
            </>)}
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 pb-2" aria-label="Main">
          {links.map(([to,l,n]) => <NavLink key={to} to={to} className={pill}>{l}{n > 0 && <span className={dot} aria-label={`${n} waiting`}>{n}</span>}</NavLink>)}
        </nav>
      </header>
      {!online && <p className="bg-sky px-4 py-2 text-center text-sm" role="status">You are offline. <Link className="underline" to="/offline">Open offline study</Link> to use your saved questions, or the flashcards you opened before.</p>}
      {notes.length > 0 && <div className="mx-auto grid w-full max-w-5xl gap-2 px-4 pt-4">{notes.map(n => <p key={n.id} className="rounded-lg border border-line bg-sky p-3 text-sm" role="status">{n.message}</p>)}</div>}
      <main className={pathname === '/' ? 'flex-1' : 'mx-auto w-full max-w-5xl flex-1 px-4 py-10'}><Outlet /></main>
      <footer className="footer-dark mt-10">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3">
          <div className="sm:col-span-1"><Logo light /><p className="mt-3 text-sm">A student-run revision resource for Babcock University nursing students.</p></div>
          <div><p className="text-sm font-semibold text-white">Learn</p><ul className="mt-2 grid gap-1 text-sm"><li><Link to="/library">Past questions</Link></li><li><Link to="/practice">Practice tests</Link></li><li><Link to="/flashcards">Flashcards</Link></li><li><Link to="/offline">Offline study</Link></li><li><Link to="/topics">Topics</Link></li></ul></div>
          <div><p className="text-sm font-semibold text-white">About</p><ul className="mt-2 grid gap-1 text-sm"><li><Link to="/about">Submission guidelines</Link></li><li><Link to="/privacy">Privacy and terms</Link></li></ul></div>
        </div>
        <p className="border-t px-4 py-4 text-center text-xs" style={{ borderColor: 'rgb(255 255 255 / 0.12)' }}>Past questions show how topics have been tested. They do not predict future exams.</p>
      </footer>
    </div>
  )
}
