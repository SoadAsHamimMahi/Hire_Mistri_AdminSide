import { useEffect, useState } from 'react'
import { useApi } from '../api/client'
import DataTable from '../components/DataTable'

export default function Dashboard() {
  const api = useApi()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ providers: 0, bookings: 0, customers: 0 })
  const [recentBookings, setRecentBookings] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const [providersRes, bookingsRes, customersRes] = await Promise.all([
          api.get('/api/admin/providers', { limit: 1 }),
          api.get('/api/admin/bookings', { limit: 5 }),
          api.get('/api/admin/customers', { limit: 1 }),
        ])
        if (cancelled) return
        setStats({
          providers: providersRes.data?.total ?? 0,
          bookings: bookingsRes.data?.total ?? 0,
          customers: customersRes.data?.total ?? 0,
        })
        setRecentBookings(bookingsRes.data?.list ?? [])
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  if (loading && !stats.providers && !recentBookings.length) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-slate-600">View your current stats and recent activity.</p>
        </div>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
          <div className="text-sm font-medium text-slate-500">Providers</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.providers}</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
          <div className="text-sm font-medium text-slate-500">Bookings</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.bookings}</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
          <div className="text-sm font-medium text-slate-500">Customers</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.customers}</div>
        </div>
      </div>
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent Bookings</h2>
          <DataTable
            columns={[
              {
                key: 'jobTitle',
                label: 'Job Title',
                render: (v, row) => v || String(row.jobId || '').slice(0, 10) || '-',
              },
              {
                key: 'workerName',
                label: 'Worker',
                render: (v, row) => v || row.workerId || '-',
              },
              {
                key: 'clientName',
                label: 'Client',
                render: (v, row) => v || row.clientId || '-',
              },
              { key: 'status', label: 'Status' },
              {
                key: 'createdAt',
                label: 'Created',
                render: (v) => (v ? new Date(v).toLocaleDateString() : '-'),
              },
            ]}
            data={recentBookings}
            loading={loading}
            emptyMessage="No recent bookings"
          />
        </div>
      </div>
    </div>
  )
}
