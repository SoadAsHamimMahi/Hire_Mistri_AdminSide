import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import { PlusIcon } from '@heroicons/react/24/outline'

export default function CashCollection() {
  const api = useApi()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createData, setCreateData] = useState({ amount: '', collectedBy: '' })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState(null)

  const fetchCollections = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/cash-collections', { page, limit })
      setList(res.data?.list ?? [])
      setTotal(res.data?.total ?? 0)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollections()
  }, [page])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null)
    try {
      await api.post('/api/admin/cash-collections', {
        amount: Number(createData.amount),
        collectedBy: createData.collectedBy
      })
      setShowCreateModal(false)
      setCreateData({ amount: '', collectedBy: '' })
      fetchCollections()
    } catch (err) {
      setCreateError(err.response?.data?.error || err.message)
    } finally {
      setCreateLoading(false)
    }
  }

  const columns = [
    { key: 'amount', label: 'Amount', render: (v) => <span className="font-semibold text-emerald-600">৳{v}</span> },
    { key: 'collectedBy', label: 'Collected By', render: (v) => <span className="text-slate-700">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <span className="badge badge-info badge-sm capitalize">{v}</span> },
    { key: 'createdAt', label: 'Recorded At', render: (v) => (v ? new Date(v).toLocaleString() : '-') },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cash Collection</h1>
          <p className="mt-1 text-slate-600">Track manually collected cash from providers or clients.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="w-5 h-5" /> Record Collection
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
          <DataTable
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="No cash collections recorded yet"
          />
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>

      {/* Record Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Record Cash Collection</h3>
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
                  <label className="label text-sm font-medium text-slate-700 text-left">Collected By (Name/Agent)</label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full"
                    placeholder="E.g. Agent Rahim"
                    value={createData.collectedBy}
                    onChange={e => setCreateData({...createData, collectedBy: e.target.value})}
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
                    {createLoading ? <span className="loading loading-spinner loading-sm" /> : 'Record'}
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
