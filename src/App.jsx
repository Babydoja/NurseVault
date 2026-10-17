import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import Home from './pages/Home.jsx'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Library from './pages/Library.jsx'
import QuestionDetail from './pages/QuestionDetail.jsx'
import CBT from './pages/CBT.jsx'
import Submit from './pages/Submit.jsx'
import Materials from './pages/Materials.jsx'
import Admin from './pages/Admin.jsx'
import About from './pages/About.jsx'
import Topics from './pages/Topics.jsx'
import Saved from './pages/Saved.jsx'
import MySubmissions from './pages/MySubmissions.jsx'
import AttemptReview from './pages/AttemptReview.jsx'
import Privacy from './pages/Privacy.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import { Analytics } from '@vercel/analytics/react'
const P = ({ children, admin, staff }) => <RequireAuth admin={admin} staff={staff}>{children}</RequireAuth>
export default function App() {
  return (
    <>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/topics" element={<P><Topics /></P>} />
        <Route path="/saved" element={<P><Saved /></P>} />
        <Route path="/my-submissions" element={<P><MySubmissions /></P>} />
        <Route path="/attempts/:id" element={<P><AttemptReview /></P>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<P><Dashboard /></P>} />
        <Route path="/library" element={<P><Library /></P>} />
        <Route path="/library/:id" element={<P><QuestionDetail /></P>} />
        <Route path="/practice" element={<P><CBT /></P>} />
        <Route path="/submit" element={<P><Submit /></P>} />
        <Route path="/materials" element={<P><Materials /></P>} />
        <Route path="/admin" element={<P staff><Admin /></P>} />
      </Route>
    </Routes>
    <Analytics />
    </>
  )
}
