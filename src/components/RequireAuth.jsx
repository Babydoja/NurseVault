import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
// UI convenience only. Real protection is Row Level Security and the RPC checks in Supabase.
export default function RequireAuth({ admin, staff, children }) {
  const { session, isAdmin, isStaff, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <p className="text-slate">Loading…</p>
  if (!session) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  if ((admin && !isAdmin) || (staff && !isStaff)) return <Navigate to="/dashboard" replace />
  return children
}
