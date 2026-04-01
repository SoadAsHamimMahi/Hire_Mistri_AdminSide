import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'

export default function DuePayments() {
  const api = useApi()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [verifyModal, setVerifyModal] = useState({ show: false, payment: null })
  const [actionData, setActionData] = useState({ status: 'verified', notes: '' })
  const [actionLoading, setActionLoading] = useState(false)

  const fetchDuePayments = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/due-payments', { page, limit })
      setList(res.data?.list ?? [])
      setTotal(res.data?.total ?? 0)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDuePayments()
  }, [page])

  const openVerifyModal = (payment) => {
    setVerifyModal({ show: true, payment })
    setActionData({ status: 'verified', notes: '' })
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      await api.post('/api/dues/verify', {
        paymentRequestId: verifyModal.payment._id,
        workerId: verifyModal.payment.workerId,
        amount: verifyModal.payment.amount,
        status: actionData.status,
        notes: actionData.notes
      })
      toast.success(`Payment marked as ${actionData.status}`)
      setVerifyModal({ show: false, payment: null })
      fetchDuePayments()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const columns = [
    { key: 'workerId', label: 'Worker ID', render: (v) => <span className="text-xs font-mono text-slate-500">{v}</span> },
    { key: 'amount', label: 'Amount', render: (v) => <span className="font-bold text-emerald-600">৳{v}</span> },
    { key: 'gateway', label: 'Method', render: (v) => <span className="uppercase text-xs font-bold text-slate-500">{v}</span> },
    { key: 'transactionId', label: 'TrxID', render: (v) => <span className="font-mono text-blue-600 font-bold">{v}</span> },
    { key: 'createdAt', label: 'Requested At', render: (v) => (v ? new Date(v).toLocaleString() : '-') },
    {
      key: 'actions',
      label: 'Action',
      render: (_, item) => (
        <button
          className="btn btn-sm btn-primary"
          onClick={() => openVerifyModal(item)}
        >
          Verify
        </button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Due Payments</h1>
          <p className="mt-1 text-slate-600">Verify manual bKash due payments submitted by workers.</p>
        </div>
        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
          <CurrencyDollarIcon className="w-6 h-6" />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
          <DataTable
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="No pending due payments to verify"
          />
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>

      {verifyModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Verify Payment</h3>
              <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setVerifyModal({ show: false, payment: null })}>✕</button>
            </div>
            
            <div className="p-6">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Worker ID</span>
                  <span className="font-mono font-bold text-slate-700">{verifyModal.payment.workerId}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Amount Paid</span>
                  <span className="font-bold text-emerald-600">৳{verifyModal.payment.amount}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Gateway</span>
                  <span className="font-bold text-slate-700 uppercase">{verifyModal.payment.gateway}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TrxID</span>
                  <span className="font-mono font-bold text-blue-600">{verifyModal.payment.transactionId}</span>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="label text-sm font-medium text-slate-700">Action</label>
                  <select
                    className="select select-bordered w-full"
                    value={actionData.status}
                    onChange={(e) => setActionData({ ...actionData, status: e.target.value })}
                  >
                    <option value="verified">Approve (Payment Received)</option>
                    <option value="rejected">Reject (Invalid TrxID or Amount)</option>
                  </select>
                </div>
                <div>
                  <label className="label text-sm font-medium text-slate-700">Admin Notes (Optional)</label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="E.g. Verified with bKash app"
                    value={actionData.notes}
                    onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" className="btn btn-ghost" onClick={() => setVerifyModal({ show: false, payment: null })}>
                    Cancel
                  </button>
                  <button type="submit" className={`btn ${actionData.status === 'verified' ? 'btn-success' : 'btn-error'}`} disabled={actionLoading}>
                    {actionLoading ? <span className="loading loading-spinner loading-sm" /> : (actionData.status === 'verified' ? 'Confirm Verification' : 'Reject Payment')}
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
