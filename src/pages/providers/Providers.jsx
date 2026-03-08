import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import FilterBar from '../../components/FilterBar'
import Pagination from '../../components/Pagination'
import ConfirmModal from '../../components/ConfirmModal'

export default function Providers() {
  const api = useApi()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState({ open: false, uid: null, action: null })

  const fetchProviders = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit }
      if (status) params.status = status
      const res = await api.get('/api/admin/providers', params)
      setList(res.data?.list ?? [])
      setTotal(res.data?.total ?? 0)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [page, status])

  const handleStatusChange = async () => {
    if (!modal.uid || !modal.action) return
    try {
      await api.patch(`/api/admin/providers/${modal.uid}/status`, { status: modal.action })
      setModal({ open: false, uid: null, action: null })
      fetchProviders()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Providers</h1>
        <p className="mt-1 text-slate-600">Manage provider accounts and status.</p>
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
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </FilterBar>
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
          <DataTable
            columns={[
              { key: 'uid', label: 'UID' },
              { key: 'email', label: 'Email' },
              { key: 'displayName', label: 'Name' },
              {
                key: 'isSuspended',
                label: 'Status',
                render: (v) => (v ? 'Suspended' : 'Active'),
              },
              {
                key: 'createdAt',
                label: 'Created',
                render: (v) => (v ? new Date(v).toLocaleDateString() : '-'),
              },
              {
                key: 'uid',
                label: 'Actions',
                render: (uid, row) => (
                  <div className="join">
                    {row.isSuspended ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-success join-item"
                        onClick={() => setModal({ open: true, uid, action: 'active' })}
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-warning join-item"
                        onClick={() => setModal({ open: true, uid, action: 'suspended' })}
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            data={list}
            loading={loading}
            emptyMessage="No providers"
          />
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>
      <ConfirmModal
        open={modal.open}
        onClose={() => setModal({ open: false, uid: null, action: null })}
        title={modal.action === 'suspended' ? 'Suspend provider?' : 'Activate provider?'}
        message={`Set status to ${modal.action}?`}
        confirmLabel="Yes"
        onConfirm={handleStatusChange}
      />
    </div>
  )
}
