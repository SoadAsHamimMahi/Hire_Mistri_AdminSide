import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'

export default function UserQueries() {
  const api = useApi()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get('/api/admin/support/queries', { page, limit })
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
  }, [page])

  const handleCloseQuery = async (id) => {
    try {
      await api.patch(`/api/admin/support/queries/${id}`, { status: 'closed' })
      setList(prev => prev.map(q => q._id === id ? { ...q, status: 'closed' } : q))
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Queries</h1>
        <p className="mt-1 text-slate-600">Review and close incoming support queries.</p>
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
          <DataTable
            columns={[
              { 
                key: 'name', 
                label: 'User', 
                render: (_, row) => (
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{row.name || row.email || 'Anonymous'}</span>
                    <span className="text-xs text-slate-500">{row.phone || 'No phone'}</span>
                  </div>
                )
              },
              { key: 'subject', label: 'Subject', render: (v) => <span className="font-semibold">{v || 'No Subject'}</span> },
              { 
                key: 'message', 
                label: 'Message', 
                render: (v) => <span className="text-slate-600 line-clamp-1 max-w-xs">{v}</span> 
              },
              { 
                key: 'status', 
                label: 'Status',
                render: (v) => (
                  <div className={`badge badge-sm ${v === 'closed' ? 'badge-neutral opacity-50' : 'badge-warning'}`}>
                    {v}
                  </div>
                )
              },
              { key: 'createdAt', label: 'Date', render: (v) => (v ? new Date(v).toLocaleDateString() : '-') },
              {
                key: '_id',
                label: 'Actions',
                render: (id, row) => (
                  <div className="flex gap-2">
                    {row.status !== 'closed' && (
                      <button
                        className="btn btn-xs btn-outline btn-error"
                        onClick={() => handleCloseQuery(id)}
                      >
                        Close
                      </button>
                    )}
                  </div>
                )
              }
            ]}
            data={list}
            loading={loading}
            emptyMessage="No queries found"
          />
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>
    </div>
  )
}
