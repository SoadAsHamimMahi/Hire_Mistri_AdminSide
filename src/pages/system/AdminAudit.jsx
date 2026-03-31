import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'

export default function AdminAudit() {
  const api = useApi()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [actionFilter, setActionFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit }
      if (actionFilter) params.action = actionFilter
      const res = await api.get('/api/admin/audit-logs', params)
      setList(res.data?.list ?? [])
      setTotal(res.data?.total ?? 0)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Audit Logs</h1>
        <p className="mt-1 text-slate-600">Trace all administrative actions and changes.</p>
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      
      <FilterBar>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Filter by action..." 
            className="input input-bordered input-sm bg-white"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          />
        </div>
      </FilterBar>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
          <DataTable
            columns={[
              { key: 'adminUid', label: 'Admin UID', render: (v) => <span className="text-xs font-mono">{v}</span> },
              { 
                key: 'action', 
                label: 'Action', 
                render: (v) => (
                  <div className="badge badge-sm badge-outline font-mono uppercase text-[10px]">
                    {v}
                  </div>
                ) 
              },
              { key: 'resource', label: 'Resource', render: (v) => <span className="text-slate-500 italic">{v}</span> },
              { 
                key: 'details', 
                label: 'Details', 
                render: (v) => (
                  <pre className="text-[10px] bg-slate-50 p-1 rounded max-w-xs truncate overflow-hidden">
                    {JSON.stringify(v)}
                  </pre>
                ) 
              },
              { key: 'createdAt', label: 'Time', render: (v) => (v ? new Date(v).toLocaleString() : '-') },
            ]}
            data={list}
            loading={loading}
            emptyMessage="No audit logs found"
          />
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>
    </div>
  )
}
