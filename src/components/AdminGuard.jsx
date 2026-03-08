import { useContext, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { hasPermission } from '../constants/permissions'
import axios from 'axios'

export default function AdminGuard({ children }) {
  const { user, loading, getIdToken } = useContext(AuthContext)
  const location = useLocation()
  const [adminCheck, setAdminCheck] = useState({ status: 'idle', allowed: false, permissions: [] })

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setAdminCheck({ status: 'idle', allowed: false, permissions: [] })
    const run = async () => {
      const token = await getIdToken()
      if (!token) {
        if (!cancelled) setAdminCheck({ status: 'done', allowed: false, permissions: [] })
        return
      }
      try {
        const { data } = await axios.get('/api/admin/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!cancelled) setAdminCheck({ status: 'done', allowed: true, permissions: data.permissions || [] })
      } catch {
        if (!cancelled) setAdminCheck({ status: 'done', allowed: false, permissions: [] })
      }
    }
    run()
    return () => { cancelled = true }
  }, [user, getIdToken])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (adminCheck.status === 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }

  if (adminCheck.status === 'done' && !adminCheck.allowed) {
    return <Navigate to="/unauthorized" replace />
  }

  if (adminCheck.status === 'done' && adminCheck.allowed) {
    if (!hasPermission(adminCheck.permissions, location.pathname)) {
      return <Navigate to="/unauthorized" replace />
    }
    return children
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  )
}
