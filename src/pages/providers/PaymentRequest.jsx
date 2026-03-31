import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import { PlusIcon } from '@heroicons/react/24/outline'

export default function PaymentRequest() {
  const api = useApi()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createData, setCreateData] = useState({ providerId: '', amount: '', reason: '' })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState(null)

  // Status Action State
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const fetchRequests = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/payment-requests', { page, limit })
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
  }, [page])

  const handleStatusChange = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this request as ${newStatus}?`)) return
    setActionLoadingId(id)
    try {
      await api.patch(`/api/admin/payment-requests/${id}`, { status: newStatus })
      setList(list.map(item => item._id === id ? { ...item, status: newStatus } : item))
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.error || err.message))
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null)
    try {
      await api.post('/api/admin/payment-requests', {
        providerId: createData.providerId,
        amount: Number(createData.amount),
        reason: createData.reason
      })
      setShowCreateModal(false)
      setCreateData({ providerId: '', amount: '', reason: '' })
      fetchRequests()
    } catch (err) {
      setCreateError(err.response?.data?.error || err.message)
    } finally {
      setCreateLoading(false)
    }
  }

  const statusBadge = (status) => {
    const s = String(status || '').toLowerCase()
    if (s === 'approved') return <span className="badge badge-success badge-sm">Approved</span>
    if (s === 'rejected') return <span className="badge badge-error badge-sm">Rejected</span>
    return <span className="badge badge-warning badge-sm">Pending</span>
  }

  const columns = [
    { key: 'providerId', label: 'Provider ID', render: (v) => <span className="text-xs font-mono">{v}</span> },
    { key: 'amount', label: 'Amount', render: (v) => <span className="font-semibold text-emerald-600">৳{v}</span> },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status', render: (v) => statusBadge(v) },
    { key: 'createdAt', label: 'Created', render: (v) => (v ? new Date(v).toLocaleDateString() : '-') },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, item) => {
        if (item.status !== 'pending') return <span className="text-xs text-slate-400">Processed</span>
        if (actionLoadingId === item._id) return <span className="loading loading-spinner loading-xs" />
        return (
          <div className="flex gap-2">
            <button
              className="btn btn-xs btn-outline btn-success"
              onClick={() => handleStatusChange(item._id, 'approved')}
            >
              Approve
            </button>
            <button
              className="btn btn-xs btn-outline btn-error"
              onClick={() => handleStatusChange(item._id, 'rejected')}
            >
              Reject
            </button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Requests</h1>
          <p className="mt-1 text-slate-600">Review and process provider payment requests.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="w-5 h-5" /> Create Request
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
          <DataTable
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="No payment requests"
          />
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Create Payment Request</h3>
              <button 
                className="btn btn-sm btn-circle btn-ghost" 
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {createError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{createError}</div>}
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="label text-sm font-medium text-slate-700 text-left">Provider ID</label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full"
                    placeholder="Enter Provider UID"
                    value={createData.providerId}
                    onChange={e => setCreateData({...createData, providerId: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="label text-sm font-medium text-slate-700 text-left">Amount (৳)</label>
                  <input 
                    type="number" 
                    className="input input-bordered w-full"
                    placeholder="E.g. 500"
                    min="1"
                    value={createData.amount}
                    onChange={e => setCreateData({...createData, amount: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="label text-sm font-medium text-slate-700 text-left">Reason</label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full"
                    placeholder="E.g. Bonus, Refund, Manual Payout"
                    value={createData.reason}
                    onChange={e => setCreateData({...createData, reason: e.target.value})}
                    required
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={createLoading}
                  >
                    {createLoading ? <span className="loading loading-spinner loading-sm" /> : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
