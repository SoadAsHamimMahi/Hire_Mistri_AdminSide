import { Link } from 'react-router-dom'

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-2 text-slate-600">You do not have permission to view this page.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/dashboard" className="btn bg-slate-900 hover:bg-slate-800 border-slate-900 text-white">
              Go to Dashboard
            </Link>
            <Link to="/login" className="btn btn-ghost">
              Re-login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
