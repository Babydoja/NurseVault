import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import Overview from './admin/Overview.jsx'
import Submissions from './admin/Submissions.jsx'
import VerifyTab from './admin/VerifyTab.jsx'
import Reports from './admin/Reports.jsx'
import QuestionsTab from './admin/QuestionsTab.jsx'
import ImportTab from './admin/ImportTab.jsx'
import MaterialsTab from './admin/MaterialsTab.jsx'
import History from './admin/History.jsx'
import UsersTab from './admin/UsersTab.jsx'
export default function Admin() {
  const { isAdmin } = useAuth()
  const tabs = [
    ...(isAdmin ? [['overview', 'Overview', Overview]] : []),
    ['subs', 'Submissions', Submissions], ['verify', 'Verify answers', VerifyTab], ['reports', 'Reports', Reports],
    ...(isAdmin ? [['qs', 'Questions', QuestionsTab], ['import', 'Import', ImportTab], ['materials', 'Materials', MaterialsTab], ['history', 'History', History], ['users', 'Users', UsersTab]] : [])]
  const [t, setT] = useState(tabs[0][0])
  const Active = tabs.find(x => x[0] === t)[2]
  return (
    <div>
      <h1 className="text-2xl font-bold">{isAdmin ? 'Admin dashboard' : 'Review dashboard'}</h1>
      <div className="mt-4 flex gap-5 overflow-x-auto border-b border-line" role="tablist">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={t === k} onClick={() => setT(k)}
            className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium cursor-pointer ${t === k ? 'border-navy text-navy' : 'border-transparent text-slate hover:text-navy'}`}>{l}</button>
        ))}
      </div>
      <div className="mt-5"><Active /></div>
    </div>
  )
}
