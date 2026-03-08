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
              { key: '_id', label: 'ID', render: (v) => (v ? String(v).slice(-6) : '-') },
              { key: 'status', label: 'Status' },
              { key: 'createdAt', label: 'Created', render: (v) => (v ? new Date(v).toLocaleDateString() : '-') },
            ]}
            data={list}
            loading={loading}
            emptyMessage="No queries"
          />
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>
    </div>
  )
}
