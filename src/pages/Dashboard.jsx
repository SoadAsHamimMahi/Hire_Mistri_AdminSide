import { useEffect, useState } from 'react'
import { useApi } from '../api/client'
import DataTable from '../components/DataTable'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function Dashboard() {
  const api = useApi()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ providers: 0, bookings: 0, customers: 0 })
  const [revenueData, setRevenueData] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const [statsRes, bookingsRes, revenueRes] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/admin/bookings', { limit: 5 }),
          api.get('/api/admin/revenue-stats', { days: 7 })
        ])
        if (cancelled) return
        setStats(statsRes.data || {})
        setRecentBookings(bookingsRes.data?.list ?? [])
        setRevenueData(revenueRes.data || [])
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6 hover:border-primary/50 transition-colors">
          <div className="text-sm font-medium text-slate-500">Total Providers</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.providers?.total ?? 0}</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6 hover:border-yellow-400/50 transition-colors">
          <div className="text-sm font-medium text-slate-500">Verification Queue</div>
          <div className="mt-2 text-3xl font-bold text-yellow-600">{stats.providers?.unverified ?? 0}</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6 hover:border-primary/50 transition-colors">
          <div className="text-sm font-medium text-slate-500">Total Bookings</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.bookings?.total ?? 0}</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6 hover:border-primary/50 transition-colors">
          <div className="text-sm font-medium text-slate-500">Active Services</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.services?.active ?? 0}</div>
        </div>
        <div className="rounded-xl bg-white border border-green-200 shadow-sm p-6 hover:border-green-500/50 transition-colors">
          <div className="text-sm font-medium text-green-600">Total Revenue</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            ৳ {revenueData.reduce((acc, curr) => acc + curr.revenue, 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Revenue Trends</h2>
            <span className="text-xs font-medium text-slate-500 px-2.5 py-1 bg-slate-50 rounded-lg">Last 7 Days</span>
          </div>
          <div className="p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}}
                  dy={10}
                  tickFormatter={(val) => new Date(val).toLocaleDateString([], {weekday: 'short'})}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Engagement Overview</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-slate-600">Avg. Daily Bookings</span>
              </div>
              <span className="text-sm font-bold text-slate-900">
                {(revenueData.reduce((acc, curr) => acc + curr.count, 0) / (revenueData.length || 1)).toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-slate-600">Revenue per Job (Avg)</span>
              </div>
              <span className="text-sm font-bold text-slate-900">
                ৳ {(revenueData.reduce((acc, curr) => acc + curr.revenue, 0) / (revenueData.reduce((acc, curr) => acc + curr.count, 0) || 1)).toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Bookings</h2>
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
