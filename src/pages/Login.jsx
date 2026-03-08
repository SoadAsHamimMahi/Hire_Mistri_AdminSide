import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'
  const { signIn } = useContext(AuthContext)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <span className="text-emerald-700 font-bold">HM</span>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-900">Admin Login</h1>
              <p className="text-sm text-slate-500">Hire Mistri Admin Panel</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label" htmlFor="email">
                <span className="label-text text-slate-600">Email</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@example.com"
                className="input w-full bg-white border-slate-200 focus:outline-none focus:border-slate-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-control">
              <label className="label" htmlFor="password">
                <span className="label-text text-slate-600">Password</span>
              </label>
              <input
                id="password"
                type="password"
                className="input w-full bg-white border-slate-200 focus:outline-none focus:border-slate-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            <div className="form-control mt-6">
              <button
                type="submit"
                className="btn w-full bg-slate-900 hover:bg-slate-800 border-slate-900 text-white"
                disabled={submitting}
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            Only users in the admin list can access the dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
