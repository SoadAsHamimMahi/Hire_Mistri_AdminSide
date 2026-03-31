import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import ConfirmModal from '../../components/ConfirmModal'

export default function BlockedUsers() {
  const api = useApi()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState({ open: false, id: null })

  const fetchBlockedUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/support/blocked-users', { page, limit })
      setList(res.data?.list ?? [])
      setTotal(res.data?.total ?? 0)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlockedUsers()
  }, [page])

  const handleUnblock = async () => {
    if (!modal.id) return
    try {
      await api.delete(`/api/admin/support/blocked-users/${modal.id}`)
      setModal({ open: false, id: null })
      fetchBlockedUsers()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Blocked Users</h1>
        <p className="mt-1 text-slate-600">Review and manage accounts that have been blocked.</p>
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
          <DataTable
            columns={[
              { key: 'userId', label: 'User ID' },
              { key: 'reason', label: 'Reason' },
              { key: 'blockedAt', label: 'Blocked Date', render: (v) => (v ? new Date(v).toLocaleDateString() : '-') },
              {
                key: '_id',
                label: 'Actions',
                render: (id) => (
                  <button
                    className="btn btn-xs btn-outline btn-success"
                    onClick={() => setModal({ open: true, id })}
                  >
                    Unblock
                  </button>
                )
              }
            ]}
            data={list}
            loading={loading}
            emptyMessage="No blocked users found"
          />
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>
      <ConfirmModal
        open={modal.open}
        onClose={() => setModal({ open: false, id: null })}
        title="Unblock User?"
        message="Are you sure you want to unblock this user? They will regain access to the platform."
        confirmLabel="Unblock"
        onConfirm={handleUnblock}
      />
    </div>
  )
}
