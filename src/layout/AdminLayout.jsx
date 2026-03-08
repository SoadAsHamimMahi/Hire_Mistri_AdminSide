import { Outlet } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'

export default function AdminLayout() {
  return (
    <div className="app-admin flex bg-slate-100">
      <div className="drawer lg:drawer-open">
        <input id="admin-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          <Topbar />
          <main className="flex-1 overflow-auto p-6 lg:p-8 bg-slate-50">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
        <div className="drawer-side z-40">
          <label htmlFor="admin-drawer" className="drawer-overlay" aria-label="Close sidebar" />
          <Sidebar />
        </div>
      </div>
    </div>
  )
}
