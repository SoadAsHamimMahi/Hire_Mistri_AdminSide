import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import FilterBar from '../../components/FilterBar'
import Pagination from '../../components/Pagination'

export default function Bookings() {
  const api = useApi()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = { page, limit }
        if (status) params.status = status
        const res = await api.get('/api/admin/bookings', params)
        if (!cancelled) {
          setList(res.data?.list ?? [])
          setTotal(res.data?.total ?? 0)
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [page, status])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
        <p className="mt-1 text-slate-600">Track booking lifecycle and status.</p>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}
      <FilterBar>
        <select
          className="select select-bordered select-sm bg-white border-slate-200"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
      </FilterBar>
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
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
            data={list}
            loading={loading}
            emptyMessage="No bookings"
          />
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>
    </div>
  )
}
