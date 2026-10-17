import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { questions } from '../data.js'
import { Icon } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
const wrap = 'mx-auto max-w-5xl px-4'
const letter = i => String.fromCharCode(65 + i)
const trust = ['Organised by course, level and session', 'Answers checked by contributors', 'Timed practice and study mode', 'Works well on your phone']
const features = [
  ['library', 'Past questions library', 'Browse by course, level, semester and session, with answers and explanations.'],
  ['practice', 'CBT practice', 'Timed exam mode, or study mode that explains each answer as you go.'],
  ['chart', 'Topic insights', 'See which topics keep appearing and which ones you need to work on.'],
  ['bookmark', 'Save and revisit', 'Bookmark tough questions and review every past attempt.'],
  ['upload', 'Contribute', 'Remember a question after an exam? Submit it so the next student benefits.'],
  ['shield', 'Reviewed content', 'Submissions are checked by contributors before anything is published.'],
]
const steps = [
  ['Create a free account', 'Sign up in a minute with any email address.'],
  ['Practise by course or topic', 'Pick what to revise, choose exam or study mode, and start.'],
  ['Add what you remember', 'After an exam, submit questions you recall to grow the bank.'],
]
export default function Home() {
  const q = questions[0], [pick, setPick] = useState(null), nav = useNavigate(), { session } = useAuth()
  return (
    <>
      <section className="hero hero-pattern">
        <div className={`${wrap} grid gap-10 py-14 md:grid-cols-2 md:items-center md:py-20`}>
          <div>
            <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'rgb(255 255 255 / 0.12)', color: '#cfe0f5' }}>For Babcock University nursing students</span>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl" style={{ color: '#fff' }}>Revise with the questions your course has really asked.</h1>
            <p className="mt-4 max-w-md text-lg" style={{ color: '#cfe0f5' }}>Past questions by course and session, timed practice tests, and a bank that grows every time a student contributes.</p>
            <form data-theme="light" className="mt-6 flex max-w-md gap-2 rounded-xl bg-white p-2 shadow-md" onSubmit={e => { e.preventDefault(); nav('/library') }}>
              <input className="field !border-0 !shadow-none" placeholder="Search a course code, e.g. NSG 211" aria-label="Search courses" />
              <button className="btn-primary shrink-0"><Icon name="search" className="h-4 w-4" />Search</button>
            </form>
            <div className="mt-5 flex flex-wrap gap-3">
              {session ? <Link to="/dashboard" className="btn-light">Open your dashboard</Link>
                       : <><Link to="/register" className="btn-light">Create free account</Link><Link to="/login" className="btn-outline-light">Log in</Link></>}
            </div>
          </div>
          <div data-theme="light" className="rounded-2xl bg-white p-6 shadow-xl" style={{ color: '#0f2a4a' }}>
            <div className="flex items-center justify-between"><span className="badge">{q.course} · {q.session}</span><span className="text-xs text-slate">Try it</span></div>
            <p className="q-text mt-3">{q.text}</p>
            <div className="mt-4 grid gap-2">
              {q.options.map((o, i) => (
                <button key={i} onClick={() => setPick(i)} className={`rounded-lg border px-3.5 py-2.5 text-left text-sm cursor-pointer transition ${pick === null ? 'border-line bg-white hover:bg-sky' : i === q.answer ? 'border-navy bg-sky' : pick === i ? 'border-slate bg-mist' : 'border-line bg-white'}`}>{letter(i)}. {o}</button>
              ))}
            </div>
            {pick !== null && <p className="mt-3 text-sm text-slate" role="status">{pick === q.answer ? 'Correct.' : `Not quite. The answer is ${letter(q.answer)}.`}</p>}
          </div>
        </div>
      </section>

      <section className={`${wrap} -mt-6 relative`}>
        <ul className="card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map(t => <li key={t} className="flex items-start gap-2 text-sm font-medium"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky text-navy-soft"><Icon name="check" className="h-3.5 w-3.5" /></span>{t}</li>)}
        </ul>
      </section>

      <section className={`${wrap} py-16`}>
        <h2 className="font-serif text-3xl font-semibold">Everything you need to prepare</h2>
        <p className="mt-2 max-w-xl text-slate">One place for past questions, practice and revision, built around how nursing students actually study.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([icon, title, text]) => (
            <div key={title} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-sky text-navy-soft"><Icon name={icon} /></span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-slate">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className={`${wrap} py-16`}>
          <h2 className="font-serif text-3xl font-semibold">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-bold" style={{ background: '#0f2a4a', color: '#fff' }}>{i + 1}</span>
                <div><p className="font-semibold">{t}</p><p className="mt-1 text-sm text-slate">{d}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${wrap} py-16`}>
        <div className="hero hero-pattern rounded-2xl px-6 py-12 text-center md:px-12">
          <h2 className="font-serif text-3xl font-semibold" style={{ color: '#fff' }}>Start revising smarter today</h2>
          <p className="mx-auto mt-2 max-w-md" style={{ color: '#cfe0f5' }}>Free for students. Past questions show how topics have been tested; they do not predict future exams.</p>
          <div className="mt-6 flex justify-center gap-3">
            {session ? <Link to="/library" className="btn-light">Browse past questions</Link> : <Link to="/register" className="btn-light">Create free account</Link>}
          </div>
        </div>
      </section>
    </>
  )
}
