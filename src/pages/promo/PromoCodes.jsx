import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'

export default function PromoCodes() {
  const api = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get('/api/admin/promo/codes')
        if (!cancelled) setList(res.data?.list ?? [])
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Promo Codes</h1>
        <p className="mt-1 text-slate-600">Create and manage discount codes.</p>
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
          <DataTable
            columns={[
              { key: 'code', label: 'Code' },
              { key: 'discountType', label: 'Type' },
              { key: 'discountValue', label: 'Value' },
              { key: 'usedCount', label: 'Used' },
              { key: 'isActive', label: 'Active', render: (v) => (v ? 'Yes' : 'No') },
            ]}
            data={list}
            loading={loading}
            emptyMessage="No promo codes"
          />
        </div>
      </div>
    </div>
  )
}
