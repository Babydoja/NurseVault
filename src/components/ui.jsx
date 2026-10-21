const P = {
  library: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  practice: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6M9 14l2 2 4-4',
  upload: 'M12 16V4m0 0l-4 4m4-4l4 4M4 20h16',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4',
  chart: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  search: 'M21 21l-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z',
  bookmark: 'M6 3h12v18l-6-4-6 4V3z',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  check: 'M5 12l5 5L20 7',
  cross: 'M12 5v14M5 12h14',
  flame: 'M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-8z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  cards: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
  inbox: 'M3 13l3-8h12l3 8M3 13v6h18v-6M3 13h5l1 3h6l1-3h5',
}
export const Icon = ({ name, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d={P[name]} /></svg>
)
export const Logo = ({ light }) => (
  <span className="inline-flex items-center gap-2 text-lg font-bold tracking-tight">
    <span className="grid h-8 w-8 place-items-center rounded-lg text-white ring-1 ring-white/20" style={{ background: '#0f2a4a' }}><Icon name="cross" className="h-5 w-5" /></span>
    <span style={light ? { color: '#fff' } : undefined}>NurseVault</span>
  </span>
)
export const PageHeader = ({ title, children }) => (
  <div><h1 className="text-3xl font-semibold">{title}</h1>{children && <p className="mt-1 max-w-xl text-slate">{children}</p>}</div>
)
export const EmptyState = ({ icon = 'inbox', title, children }) => (
  <div className="card grid place-items-center px-6 py-10 text-center">
    <span className="grid h-12 w-12 place-items-center rounded-full bg-sky text-navy-soft"><Icon name={icon} className="h-6 w-6" /></span>
    <p className="mt-3 font-semibold">{title}</p>
    {children && <p className="mt-1 max-w-sm text-sm text-slate">{children}</p>}
  </div>
)
