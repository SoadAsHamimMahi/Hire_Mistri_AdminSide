import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import { LinkIcon } from '@heroicons/react/24/outline'

export default function BookingPayments() {
  const api = useApi()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/transactions', { page, limit })
      setList(res.data?.list ?? [])
      setTotal(res.data?.total ?? 0)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [page])

  const columns = [
    { key: '_id', label: 'Transaction ID', render: (v) => <span className="text-xs font-mono">{String(v).slice(0, 10)}...</span> },
    { key: 'bookingId', label: 'Booking ID', render: (v) => v ? <span className="text-xs font-mono">{String(v).slice(0, 10)}...</span> : '-' },
    { key: 'amount', label: 'Amount', render: (v) => <span className="font-semibold text-slate-900">৳{v}</span> },
    { 
      key: 'type', 
      label: 'Type',
      render: (v) => (
        <span className={`badge badge-sm ${v === 'credit' ? 'badge-success' : 'badge-neutral'}`}>
          {v}
        </span>
      )
    },
    { key: 'status', label: 'Status', render: (v) => <span className="badge badge-sm badge-info capitalize">{v}</span> },
    { key: 'createdAt', label: 'Date', render: (v) => (v ? new Date(v).toLocaleString() : '-') },
    {
      key: 'receiptUrl',
      label: 'Receipt',
      render: (v) => v ? (
        <a href={v} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline btn-neutral">
          <LinkIcon className="w-3 h-3 mr-1" /> View
        </a>
      ) : <span className="text-slate-400 text-xs">No Receipt</span>
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Booking Payments</h1>
        <p className="mt-1 text-slate-600">Track all financial transactions related to bookings.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
          <DataTable
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="No payment transactions found"
          />
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>
    </div>
  )
}
