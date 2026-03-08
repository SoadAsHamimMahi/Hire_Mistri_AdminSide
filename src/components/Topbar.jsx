import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { AuthContext } from '../context/AuthContext'

export default function Topbar() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { user, logOut } = useContext(AuthContext)

  const handleLogout = () => {
    logOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="navbar h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6">
      <div className="navbar-start gap-2">
        <label htmlFor="admin-drawer" className="btn btn-ghost btn-square drawer-button lg:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </label>
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="text-sm text-slate-500">Good evening</span>
          <span className="text-base font-semibold text-slate-900">Hi, {user?.displayName || user?.email || 'Admin'}</span>
        </div>
      </div>
      <div className="navbar-center flex-1 max-w-xl px-2">
        <div className="w-full">
          <div className="join w-full">
            <input
              type="text"
              placeholder="Search…"
              className="input join-item w-full bg-white border-slate-200 focus:outline-none focus:border-slate-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="button" className="btn join-item bg-slate-900 hover:bg-slate-800 border-slate-900 text-white" aria-label="Search">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <div className="navbar-end gap-3">
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder">
            <div className="bg-slate-900 text-white rounded-full w-10">
              <UserCircleIcon className="w-6 h-6" />
            </div>
          </label>
          <ul tabIndex={0} className="mt-3 z-10 p-2 shadow menu menu-sm dropdown-content bg-white rounded-box w-56 border border-slate-200">
            <li><span className="font-medium">{user?.email || 'Admin'}</span></li>
            <li><button type="button" onClick={handleLogout}>Logout</button></li>
          </ul>
        </div>
      </div>
    </header>
  )
}
