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
  const [detailsModal, setDetailsModal] = useState({ open: false, provider: null })

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
      if (modal.action === 'verify' || modal.action === 'unverify') {
        const isVerified = modal.action === 'verify'
        await api.patch(`/api/admin/providers/${modal.uid}/verify`, { isVerified })
      } else {
        await api.patch(`/api/admin/providers/${modal.uid}/status`, { status: modal.action })
      }
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
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </FilterBar>
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
          <DataTable
            columns={[
              { 
                key: 'name', 
                label: 'Name',
                render: (_, row) => (
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{[row.firstName, row.lastName].filter(Boolean).join(' ') || row.displayName || '-'}</span>
                    <span className="text-xs text-slate-500">{row.email}</span>
                  </div>
                )
              },
              {
                key: 'isVerified',
                label: 'Verified',
                render: (v) => (
                  <div className={`badge badge-sm ${v ? 'badge-success' : 'badge-ghost opacity-50'}`}>
                    {v ? 'Verified' : 'Unverified'}
                  </div>
                )
              },
              {
                key: 'isSuspended',
                label: 'Status',
                render: (v) => (
                  <div className={`badge badge-sm ${v ? 'badge-warning' : 'badge-info'}`}>
                    {v ? 'Suspended' : 'Active'}
                  </div>
                ),
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-xs btn-outline btn-neutral"
                      onClick={() => setDetailsModal({ open: true, provider: row })}
                    >
                      Details
                    </button>
                    {!row.isVerified ? (
                      <button
                        type="button"
                        className="btn btn-xs btn-success"
                        onClick={() => setModal({ open: true, uid, action: 'verify' })}
                      >
                        Verify
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-xs btn-outline btn-error"
                        onClick={() => setModal({ open: true, uid, action: 'unverify' })}
                      >
                        Unverify
                      </button>
                    )}
                    {row.isSuspended ? (
                      <button
                        type="button"
                        className="btn btn-xs btn-success"
                        onClick={() => setModal({ open: true, uid, action: 'active' })}
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-xs btn-warning"
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
            emptyMessage="No providers found"
          />
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>

      {/* Detail Modal */}
      {detailsModal.open && detailsModal.provider && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl bg-white text-slate-900 border border-slate-200">
            <h3 className="font-bold text-lg mb-4">
              Provider Details: {[detailsModal.provider.firstName, detailsModal.provider.lastName].filter(Boolean).join(' ')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-slate-700 mb-2 border-b pb-1">General Info</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-500">Email:</span> {detailsModal.provider.email}</p>
                  <p><span className="text-slate-500">Phone:</span> {detailsModal.provider.phone || 'N/A'}</p>
                  <p><span className="text-slate-500">Experience:</span> {detailsModal.provider.experienceYears || detailsModal.provider.workExperience || 0} years</p>
                  <p><span className="text-slate-500">Bio:</span> {detailsModal.provider.bio || 'No bio provided'}</p>
                  <p><span className="text-slate-500">City:</span> {detailsModal.provider.city || 'N/A'}</p>
                </div>

                <h4 className="font-semibold text-slate-700 mt-6 mb-2 border-b pb-1">Certifications</h4>
                <div className="space-y-2">
                  {detailsModal.provider.certifications?.length > 0 ? (
                    detailsModal.provider.certifications.map((c, i) => (
                      <div key={i} className="p-2 bg-slate-50 rounded border border-slate-100 text-sm">
                        {c.name || 'Unnamed Certificate'}
                        {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="ml-2 text-primary hover:underline italic">View Proof</a>}
                      </div>
                    ))
                  ) : <p className="text-sm text-slate-400">No certifications uploaded</p>}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-700 mb-2 border-b pb-1">Portfolio Preview</h4>
                <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
                  {detailsModal.provider.portfolio?.length > 0 ? (
                    detailsModal.provider.portfolio.map((p, i) => (
                      <div key={i} className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                        <img src={p.url} alt={p.caption || 'Work sample'} className="w-full h-32 object-cover" />
                        {p.caption && <p className="text-[10px] p-1 truncate text-slate-600">{p.caption}</p>}
                      </div>
                    ))
                  ) : <p className="text-sm text-slate-400">No portfolio images uploaded</p>}
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn btn-neutral" onClick={() => setDetailsModal({ open: false, provider: null })}>Close</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={modal.open}
        onClose={() => setModal({ open: false, uid: null, action: null })}
        title={
          modal.action === 'verify' ? 'Verify Provider?' : 
          modal.action === 'unverify' ? 'Remove Verification?' : 
          modal.action === 'suspended' ? 'Suspend Provider?' : 
          'Activate Provider?'
        }
        message={`Confirming action: ${modal.action}`}
        confirmLabel="Confirm"
        onConfirm={handleStatusChange}
      />
    </div>
  )
}
