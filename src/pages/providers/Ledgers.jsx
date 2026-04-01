import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

export default function Ledgers() {
  const api = useApi()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLedgers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/ledgers', { page, limit })
      setList(res.data?.list ?? [])
      setTotal(res.data?.total ?? 0)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLedgers()
  }, [page])

  const typeBadge = (type) => {
    const t = String(type || '').toUpperCase()
    if (t === 'PLATFORM_FEE_DEBIT') return <span className="badge badge-error badge-sm">PLATFORM FEE DEBIT</span>
    if (t === 'JOB_COMPLETED_CREDIT') return <span className="badge badge-success badge-sm">JOB COMPLETED CREDIT</span>
    if (t === 'DUE_PAYMENT_CREDIT') return <span className="badge badge-info badge-sm">DUE PAYMENT CREDIT</span>
    return <span className="badge badge-ghost badge-sm">{t}</span>
  }

  const columns = [
    { key: 'workerId', label: 'Worker ID', render: (v) => <span className="text-xs font-mono text-slate-500">{v}</span> },
    { key: 'type', label: 'Transaction Type', render: (v) => typeBadge(v) },
    { key: 'amount', label: 'Amount', render: (v, item) => (
      <span className={`font-semibold ${item.direction === 'DEBIT' ? 'text-red-600' : 'text-emerald-600'}`}>
        {item.direction === 'DEBIT' ? '-' : '+'}৳{v}
      </span>
    )},
    { key: 'jobId', label: 'Job ID / Trx', render: (v, item) => <span className="text-xs text-slate-400">{v || item.transactionId || '-'}</span> },
    { key: 'createdAt', label: 'Date', render: (v) => (v ? new Date(v).toLocaleString() : '-') }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ledgers</h1>
          <p className="mt-1 text-slate-600">Master view of all wallet transactions, fees, and credits.</p>
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <DocumentTextIcon className="w-6 h-6" />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
          <DataTable
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="No ledger records found"
          />
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>
    </div>
  )
}
