import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'

export default function CustomJobRequests() {
  const api = useApi()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRequests = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit }
      if (status) params.status = status
      const res = await api.get('/api/admin/worker-job-requests', params)
      setList(res.data?.list ?? [])
      setTotal(res.data?.total ?? 0)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [page, status])

  const columns = [
    { key: '_id', label: 'Request ID', render: (v) => <span className="text-xs font-mono">{String(v).slice(0, 10)}...</span> },
    { key: 'categoryName', label: 'Requested Category', render: (v) => <span className="font-medium text-slate-800">{v || 'Unknown'}</span> },
    { key: 'clientName', label: 'Client', render: (v, row) => <span className="text-slate-700">{v || row.clientId}</span> },
    { key: 'workerName', label: 'Target Worker', render: (v, row) => <span className="text-slate-700">{v || row.workerId}</span> },
    { key: 'budget', label: 'Budget', render: (v) => <span className="font-semibold text-emerald-600">৳{v}</span> },
    { 
      key: 'status', 
      label: 'Status',
      render: (v) => {
        const s = String(v || '').toLowerCase()
        let badgeClass = 'badge-ghost'
        if (s === 'accepted') badgeClass = 'badge-success'
        if (s === 'rejected') badgeClass = 'badge-error'
        if (s === 'pending') badgeClass = 'badge-warning'
        return <span className={`badge badge-sm ${badgeClass} capitalize`}>{s}</span>
      }
    },
    { key: 'createdAt', label: 'Date', render: (v) => (v ? new Date(v).toLocaleString() : '-') },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Custom Job Requests</h1>
        <p className="mt-1 text-slate-600">Review custom job requests sent to specific workers.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      
      <FilterBar>
        <select
          className="select select-bordered select-sm bg-white border-slate-200"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </FilterBar>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
          <DataTable
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="No custom job requests found"
          />
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>
    </div>
  )
}
