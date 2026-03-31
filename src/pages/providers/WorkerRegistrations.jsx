import { useEffect, useState, useCallback } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import FilterBar from '../../components/FilterBar'
import Pagination from '../../components/Pagination'

const STATUS_OPTIONS = [
  { value: 'pending_review', label: '⏳ Pending Review' },
  { value: 'approved', label: '✅ Approved' },
  { value: 'rejected', label: '❌ Rejected' },
  { value: 'all', label: 'All Workers' },
]

const STATUS_BADGE = {
  pending_review: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-error',
  draft: 'badge-ghost',
}

const STATUS_LABEL = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  draft: 'Draft',
}

export default function WorkerRegistrations() {
  const api = useApi()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [statusFilter, setStatusFilter] = useState('pending_review')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)

  // Detail modal
  const [detail, setDetail] = useState({ open: false, worker: null, fullDoc: null, fullLoading: false })
  // Confirm modal
  const [confirm, setConfirm] = useState({ open: false, uid: null, action: null, reason: '' })
  const [actionLoading, setActionLoading] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { status: statusFilter, page, limit }
      if (search.trim()) params.search = search.trim()
      const res = await api.get('/api/admin/workers/registrations', params)
      setList(res.data?.list ?? [])
      setTotal(res.data?.total ?? 0)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/workers/registrations', { status: 'pending_review', limit: 1 })
      setPendingCount(res.data?.total ?? 0)
    } catch { /* noop */ }
  }, [])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    fetchPendingCount()
  }, [fetchPendingCount])

  async function openDetail(worker) {
    setDetail({ open: true, worker, fullDoc: null, fullLoading: true })
    try {
      const res = await api.get(`/api/admin/workers/${worker.uid}/registration`)
      setDetail({ open: true, worker, fullDoc: res.data, fullLoading: false })
    } catch {
      setDetail(d => ({ ...d, fullLoading: false }))
    }
  }

  function openConfirm(uid, action) {
    setConfirm({ open: true, uid, action, reason: '' })
  }

  async function handleConfirm() {
    if (!confirm.uid || !confirm.action) return
    if (confirm.action === 'reject' && !confirm.reason.trim()) {
      alert('Please enter a rejection reason.')
      return
    }
    setActionLoading(true)
    try {
      await api.patch(`/api/admin/workers/${confirm.uid}/registration`, {
        action: confirm.action,
        rejectionReason: confirm.reason,
      })
      setConfirm({ open: false, uid: null, action: null, reason: '' })
      setDetail({ open: false, worker: null, fullDoc: null, fullLoading: false })
      fetchList()
      fetchPendingCount()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const w = detail.fullDoc || detail.worker
  const workerName = w ? ([w.firstName, w.lastName].filter(Boolean).join(' ') || w.fullLegalName || '-') : '-'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Worker Registrations</h1>
            {pendingCount > 0 && (
              <span className="badge badge-warning badge-lg font-bold">{pendingCount} Pending</span>
            )}
          </div>
          <p className="mt-1 text-slate-600 text-sm">Review, approve, or reject worker registration applications.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div>
      )}

      {/* Filters */}
      <FilterBar>
        <select
          className="select select-bordered select-sm bg-white border-slate-200"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          type="text"
          placeholder="Search name, phone, email…"
          className="input input-bordered input-sm bg-white border-slate-200"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </FilterBar>

      {/* Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
          <DataTable
            columns={[
              {
                key: 'name',
                label: 'Worker',
                render: (_, row) => (
                  <div className="flex items-center gap-3">
                    {row.profileCover
                      ? <img src={row.profileCover} alt="photo" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      : <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold">
                          {([row.firstName, row.lastName].filter(Boolean).join('').charAt(0) || '?').toUpperCase()}
                        </div>
                    }
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 text-sm">
                        {[row.firstName, row.lastName].filter(Boolean).join(' ') || row.fullLegalName || '-'}
                      </span>
                      <span className="text-xs text-slate-500">{row.email}</span>
                    </div>
                  </div>
                ),
              },
              { key: 'phone', label: 'Phone', render: (v) => v || '-' },
              {
                key: 'location',
                label: 'Location',
                render: (_, row) => [row.city, row.district].filter(Boolean).join(', ') || '-',
              },
              {
                key: 'registrationSubmittedAt',
                label: 'Submitted',
                render: (v) => v ? new Date(v).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
              },
              {
                key: 'workerAccountStatus',
                label: 'Status',
                render: (v) => (
                  <span className={`badge badge-sm ${STATUS_BADGE[v] || 'badge-ghost'}`}>
                    {STATUS_LABEL[v] || v || 'Unknown'}
                  </span>
                ),
              },
              {
                key: 'uid',
                label: 'Actions',
                render: (uid, row) => (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-xs btn-outline btn-neutral"
                      onClick={() => openDetail(row)}
                    >
                      Review
                    </button>
                    {row.workerAccountStatus === 'pending_review' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-xs btn-success"
                          onClick={() => openConfirm(uid, 'approve')}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-error"
                          onClick={() => { setDetail({ open: true, worker: row, fullDoc: null, fullLoading: false }); openConfirm(uid, 'reject') }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
            data={list}
            loading={loading}
            emptyMessage={`No ${statusFilter === 'all' ? '' : statusFilter.replace('_', ' ')} registrations found`}
          />
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {detail.open && (
        <div className="modal modal-open z-50">
          <div className="modal-box w-11/12 max-w-4xl bg-white text-slate-900 border border-slate-200 p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                {w?.profileCover && <img src={w.profileCover} alt="photo" className="w-12 h-12 rounded-full object-cover border border-slate-300" />}
                <div>
                  <h3 className="font-bold text-lg">{workerName}</h3>
                  <span className={`badge badge-sm ${STATUS_BADGE[w?.workerAccountStatus] || 'badge-ghost'}`}>
                    {STATUS_LABEL[w?.workerAccountStatus] || 'Unknown'}
                  </span>
                </div>
              </div>
              <button className="btn btn-sm btn-ghost btn-circle" onClick={() => setDetail({ open: false, worker: null, fullDoc: null, fullLoading: false })}>✕</button>
            </div>

            {detail.fullLoading ? (
              <div className="flex items-center justify-center p-16"><span className="loading loading-spinner loading-lg text-primary" /></div>
            ) : (
              <div className="overflow-y-auto max-h-[70vh] p-6 space-y-6">
                {/* Personal Info */}
                <Section title="Personal Information">
                  <Grid2>
                    <Field label="Full Legal Name" value={w?.fullLegalName} />
                    <Field label="Phone" value={w?.phone} />
                    <Field label="Email" value={w?.email} />
                    <Field label="City / District" value={[w?.city, w?.district].filter(Boolean).join(' / ')} />
                    <Field label="NID Number" value={w?.nidNumber} />
                    <Field label="Experience" value={w?.experienceYears != null ? `${w.experienceYears} years` : '-'} />
                  </Grid2>
                  {w?.bio && <Field label="Bio" value={w.bio} />}
                  {w?.servicesOffered?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Services Offered</p>
                      <div className="flex flex-wrap gap-2">
                        {w.servicesOffered.map(s => <span key={s} className="badge badge-outline badge-sm">{s}</span>)}
                      </div>
                    </div>
                  )}
                </Section>

                {/* NID Images */}
                <Section title="NID Documents">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-2 font-medium">Front</p>
                      {w?.nidFrontImageUrl
                        ? <a href={w.nidFrontImageUrl} target="_blank" rel="noreferrer">
                            <img src={w.nidFrontImageUrl} alt="NID Front" className="w-full h-40 object-cover rounded-xl border border-slate-200 hover:opacity-80 transition-opacity" />
                          </a>
                        : <div className="w-full h-40 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm">Not uploaded</div>
                      }
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-2 font-medium">Back</p>
                      {w?.nidBackImageUrl
                        ? <a href={w.nidBackImageUrl} target="_blank" rel="noreferrer">
                            <img src={w.nidBackImageUrl} alt="NID Back" className="w-full h-40 object-cover rounded-xl border border-slate-200 hover:opacity-80 transition-opacity" />
                          </a>
                        : <div className="w-full h-40 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm">Not uploaded</div>
                      }
                    </div>
                  </div>
                </Section>

                {/* Emergency & Payout */}
                <Section title="Emergency & Payout">
                  <Grid2>
                    <Field label="Emergency Contact (Name)" value={w?.emergencyContactName} />
                    <Field label="Emergency Phone" value={w?.emergencyContactPhone} />
                    <Field label="Emergency NID Number" value={w?.emergencyContactNidNumber} />
                    <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-xs text-slate-500 mb-2 font-medium">Contact NID (Front)</p>
                        {w?.emergencyContactNidFrontUrl
                          ? <a href={w.emergencyContactNidFrontUrl} target="_blank" rel="noreferrer">
                              <img src={w.emergencyContactNidFrontUrl} alt="Emergency NID Front" className="w-full h-32 object-cover rounded-xl border border-slate-200 hover:opacity-80 transition-opacity" />
                            </a>
                          : <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm">Not uploaded</div>
                        }
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-2 font-medium">Contact NID (Back)</p>
                        {w?.emergencyContactNidBackUrl
                          ? <a href={w.emergencyContactNidBackUrl} target="_blank" rel="noreferrer">
                              <img src={w.emergencyContactNidBackUrl} alt="Emergency NID Back" className="w-full h-32 object-cover rounded-xl border border-slate-200 hover:opacity-80 transition-opacity" />
                            </a>
                          : <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm">Not uploaded</div>
                        }
                      </div>
                    </div>
                    <Field label="Payout Provider" value={w?.payoutWalletProvider ? w.payoutWalletProvider.charAt(0).toUpperCase() + w.payoutWalletProvider.slice(1) : '-'} />
                    <Field label="Payout Number" value={w?.payoutWalletNumber ? `****${w.payoutWalletNumber.slice(-4)}` : '-'} />
                  </Grid2>
                </Section>

                {/* Consent Timestamps */}
                <Section title="Consent & Compliance">
                  <Grid2>
                    <Field label="Terms Accepted" value={w?.termsAcceptedAt ? new Date(w.termsAcceptedAt).toLocaleString() : '-'} />
                    <Field label="Terms Version" value={w?.termsVersion || '-'} />
                    <Field label="Privacy Accepted" value={w?.privacyAcceptedAt ? new Date(w.privacyAcceptedAt).toLocaleString() : '-'} />
                    <Field label="Privacy Version" value={w?.privacyVersion || '-'} />
                    <Field label="Age Confirmed" value={w?.ageConfirmedAt ? new Date(w.ageConfirmedAt).toLocaleString() : '-'} />
                    <Field label="Submitted" value={w?.registrationSubmittedAt ? new Date(w.registrationSubmittedAt).toLocaleString() : '-'} />
                  </Grid2>
                </Section>

                {/* Rejection reason (if rejected) */}
                {w?.registrationRejectionReason && (
                  <Section title="Rejection Reason">
                    <p className="text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3 border border-red-100">{w.registrationRejectionReason}</p>
                  </Section>
                )}
              </div>
            )}

            {/* Footer actions */}
            {w?.workerAccountStatus === 'pending_review' && (
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end">
                <button
                  className="btn btn-error"
                  onClick={() => openConfirm(w.uid, 'reject')}
                >
                  ❌ Reject
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => openConfirm(w.uid, 'approve')}
                >
                  ✅ Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Confirm Action Modal ── */}
      {confirm.open && (
        <div className="modal modal-open z-[60]">
          <div className="modal-box bg-white text-slate-900 border border-slate-200">
            <h3 className="font-bold text-lg mb-2">
              {confirm.action === 'approve' ? '✅ Approve Registration' : '❌ Reject Registration'}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {confirm.action === 'approve'
                ? 'The worker will receive an approval email and will be able to apply for jobs.'
                : 'Please provide a reason. The worker will be notified by email.'}
            </p>
            {confirm.action === 'reject' && (
              <textarea
                className="textarea textarea-bordered w-full mb-4 text-sm bg-white"
                rows={3}
                placeholder="Rejection reason (required)…"
                value={confirm.reason}
                onChange={e => setConfirm(c => ({ ...c, reason: e.target.value }))}
              />
            )}
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setConfirm({ open: false, uid: null, action: null, reason: '' })}>
                Cancel
              </button>
              <button
                className={`btn ${confirm.action === 'approve' ? 'btn-success' : 'btn-error'}`}
                disabled={actionLoading || (confirm.action === 'reject' && !confirm.reason.trim())}
                onClick={handleConfirm}
              >
                {actionLoading ? <span className="loading loading-spinner loading-sm" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div>
      <h4 className="font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100 text-sm uppercase tracking-wide">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Grid2({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">{children}</div>
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
      <p className="text-sm text-slate-800 font-medium">{value || '-'}</p>
    </div>
  )
}
