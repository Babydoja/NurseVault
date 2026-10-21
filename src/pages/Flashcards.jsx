import { useState } from 'react'
import { PageHeader } from '../components/ui.jsx'
import TermCards from '../components/TermCards.jsx'
import QuestionCards from '../components/QuestionCards.jsx'
const tabs = [['terms', 'Nursing terms and abbreviations'], ['questions', 'From past questions']]
export default function Flashcards() {
  const [t, setT] = useState('terms')
  return (
    <div>
      <PageHeader title="Flashcards">Learn abbreviations, mnemonics, normal values and medical terms, or flip through questions from the bank.</PageHeader>
      <div className="mt-5 flex gap-2 overflow-x-auto" role="tablist">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={t === k} onClick={() => setT(k)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium cursor-pointer ${t === k ? 'bg-navy text-white' : 'border border-line bg-white text-navy hover:bg-sky'}`}>{l}</button>
        ))}
      </div>
      <div className="mt-6">{t === 'terms' ? <TermCards /> : <QuestionCards />}</div>
    </div>
  )
}
