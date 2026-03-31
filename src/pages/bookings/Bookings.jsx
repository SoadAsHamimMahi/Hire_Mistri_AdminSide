import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import FilterBar from '../../components/FilterBar'
import Pagination from '../../components/Pagination'

// ── Helpers ──────────────────────────────────────────────────────────────────
function initials(name) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function Avatar({ src, name, size = 40 }) {
  const [err, setErr] = useState(false)
  if (src && !err) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setErr(true)}
        style={{ width: size, height: size }}
        className="rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0"
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0 ring-2 ring-white shadow-sm"
    >
      {initials(name)}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    accepted:  'bg-blue-100 text-blue-700 border-blue-200',
    rejected:  'bg-red-100 text-red-700 border-red-200',
    pending:   'bg-amber-100 text-amber-700 border-amber-200',
  }
  const cls = map[status] || 'bg-slate-100 text-slate-600 border-slate-200'
  const emoji = { completed: '✅', accepted: '🔵', rejected: '❌', pending: '⏳' }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      <span>{emoji[status] || '📋'}</span>
      <span className="capitalize">{status}</span>
    </span>
  )
}

function InfoRow({ label, value, mono = false }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
      <span className={`text-sm text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function ProfileCard({ profile, role, onViewProfile }) {
  if (!profile) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 min-h-[140px]">
        <span className="text-3xl">👤</span>
        <p className="text-sm text-slate-400 italic">No {role} assigned</p>
      </div>
    )
  }
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar src={profile.profileCover} name={profile.name} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-900 truncate">{profile.name || '—'}</span>
            {profile.isVerified && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-semibold">✓ Verified</span>
            )}
            {profile.isSuspended && (
              <span className="text-[10px] bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-full font-semibold">Suspended</span>
            )}
          </div>
          {profile.headline && (
            <p className="text-xs text-slate-500 truncate">{profile.headline}</p>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 gap-2 text-sm">
        {profile.email && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs w-5">✉</span>
            <a href={`mailto:${profile.email}`} className="text-indigo-600 hover:underline truncate text-xs">{profile.email}</a>
          </div>
        )}
        {profile.phone && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs w-5">📞</span>
            <a href={`tel:${profile.phone}`} className="text-slate-700 text-xs">{profile.phone}</a>
          </div>
        )}
        {(profile.city || profile.country) && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs w-5">📍</span>
            <span className="text-slate-700 text-xs">{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {role === 'Worker' && profile.experienceYears > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs w-5">🏆</span>
            <span className="text-slate-700 text-xs">{profile.experienceYears} yrs experience</span>
          </div>
        )}
        {role === 'Worker' && profile.servicesOffered && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs w-5">🔧</span>
            <span className="text-slate-700 text-xs truncate">{typeof profile.servicesOffered === 'string' ? profile.servicesOffered : JSON.stringify(profile.servicesOffered)}</span>
          </div>
        )}
        {profile.createdAt && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs w-5">📅</span>
            <span className="text-slate-500 text-xs">Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* View Profile */}
      <button
        onClick={() => onViewProfile(profile.uid, role)}
        className="mt-1 w-full py-1.5 rounded-lg text-xs font-semibold border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors"
      >
        View {role} Profile →
      </button>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Bookings() {
  const api = useApi()
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detailsModal, setDetailsModal] = useState({ open: false, booking: null })
  const [statusLoadingId, setStatusLoadingId] = useState(null)

  const handleStatusChange = async (id, newStatus) => {
    if (!window.confirm(`Change status to "${newStatus}"?`)) return
    setStatusLoadingId(id)
    try {
      await api.patch(`/api/admin/bookings/${id}/status`, { status: newStatus })
      setList(list.map(item => item._id === id ? { ...item, status: newStatus } : item))
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.error || err.message))
    } finally {
      setStatusLoadingId(null)
    }
  }

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = { page, limit }
        if (status) params.status = status
        const res = await api.get('/api/admin/bookings', params)
        if (!cancelled) {
          setList(res.data?.list ?? [])
          setTotal(res.data?.total ?? 0)
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [page, status])

  const handleViewProfile = (uid, role) => {
    setDetailsModal({ open: false, booking: null })
    if (role === 'Worker') {
      navigate(`/providers/${uid}`)
    } else {
      navigate(`/customers/${uid}`)
    }
  }

  const booking = detailsModal.booking

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
        <p className="mt-1 text-slate-600">Track booking lifecycle and status.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
      )}

      <FilterBar>
        <select
          className="select select-bordered select-sm bg-white border-slate-200"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
      </FilterBar>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-6">
          <DataTable
            columns={[
              {
                key: 'jobTitle',
                label: 'Job / Category',
                render: (v, row) => (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-slate-900">{v || String(row.jobId || '').slice(0, 10)}</span>
                    <span className="text-xs text-slate-500">{row.jobDetails?.serviceName || row.serviceName || 'Standard Job'}</span>
                    {(row.jobDetails?.scheduledDate || row.scheduledDate) && (
                      <span className="text-[10px] text-indigo-500">
                        📅 {new Date(row.jobDetails?.scheduledDate || row.scheduledDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )
              },
              {
                key: 'budget',
                label: 'Budget / Price',
                render: (v, row) => {
                  const budget = row.jobDetails?.budget || v || row.totalPrice
                  const final = row.finalPrice || row.proposedPrice
                  return (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-900">৳{budget || '—'}</span>
                      {final && <span className="text-xs text-emerald-600">Final: ৳{final}</span>}
                    </div>
                  )
                }
              },
              {
                key: 'workerName',
                label: 'Worker',
                render: (v, row) => (
                  <div className="flex items-center gap-2.5">
                    <Avatar src={row.workerProfile?.profileCover} name={v || row.workerId} size={32} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-slate-800 truncate">
                          {v || <span className="text-slate-400 italic text-xs">Unassigned</span>}
                        </span>
                        {row.workerProfile?.isVerified && (
                          <span className="text-emerald-500 text-xs" title="Verified">✓</span>
                        )}
                      </div>
                      {row.workerProfile?.headline && (
                        <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{row.workerProfile.headline}</p>
                      )}
                    </div>
                  </div>
                )
              },
              {
                key: 'clientName',
                label: 'Client',
                render: (v, row) => (
                  <div className="flex items-center gap-2.5">
                    <Avatar src={row.clientProfile?.profileCover} name={v || row.clientId} size={32} />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-slate-800 truncate block">
                        {v || row.clientId || '—'}
                      </span>
                      {row.clientProfile?.city && (
                        <span className="text-[10px] text-slate-400">{row.clientProfile.city}</span>
                      )}
                    </div>
                  </div>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (v, row) => (
                  statusLoadingId === row._id ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <select
                      className={`select select-xs select-bordered bg-white ${
                        v === 'completed' ? 'border-success text-success' :
                        v === 'accepted' ? 'border-info text-info' :
                        v === 'rejected' ? 'border-error text-error' :
                        'border-slate-300'
                      }`}
                      value={v}
                      onChange={(e) => handleStatusChange(row._id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                    </select>
                  )
                )
              },
              {
                key: 'uid',
                label: 'Actions',
                render: (_, row) => (
                  <button
                    className="btn btn-xs btn-outline btn-neutral"
                    onClick={() => setDetailsModal({ open: true, booking: row })}
                  >
                    Details
                  </button>
                )
              }
            ]}
            data={list}
            loading={loading}
            emptyMessage="No bookings found"
          />
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </div>
      </div>

      {/* ── Booking Detail Modal ─────────────────────────────────────────────── */}
      {detailsModal.open && booking && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl bg-white text-slate-900 border border-slate-200 p-0 overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100 bg-slate-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-bold text-lg text-slate-900 truncate">
                    {booking.jobTitle || booking.jobDetails?.title || 'Untitled Booking'}
                  </h3>
                  <StatusBadge status={booking.status} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Booking ID: <span className="font-mono">{String(booking._id)}</span>
                </p>
              </div>
              <button
                className="btn btn-sm btn-ghost btn-circle ml-3 flex-shrink-0"
                onClick={() => setDetailsModal({ open: false, booking: null })}
              >✕</button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6 space-y-6">

              {/* ── Job Details ─────────────────────────────────────────────── */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-slate-300 inline-block" />
                  Job Information
                  <span className="flex-1 h-px bg-slate-100 inline-block" />
                </h4>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoRow label="Service" value={booking.jobDetails?.serviceName || booking.serviceName || 'N/A'} />
                  <InfoRow label="Budget" value={booking.jobDetails?.budget ? `৳${booking.jobDetails.budget}` : booking.budget ? `৳${booking.budget}` : '—'} />
                  <InfoRow label="Final Price" value={booking.finalPrice ? `৳${booking.finalPrice}` : booking.proposedPrice ? `৳${booking.proposedPrice} (proposed)` : null} />
                  <InfoRow label="Booking Created" value={booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '—'} />
                  {booking.acceptedAt && <InfoRow label="Accepted At" value={new Date(booking.acceptedAt).toLocaleString()} />}
                  {(booking.jobDetails?.scheduledDate || booking.scheduledDate) && (
                    <InfoRow label="Scheduled Date" value={new Date(booking.jobDetails?.scheduledDate || booking.scheduledDate).toLocaleString()} />
                  )}
                  {(booking.completedAt || booking.updatedAt) && booking.status === 'completed' && (
                    <InfoRow label="Completed At" value={new Date(booking.completedAt || booking.updatedAt).toLocaleString()} />
                  )}
                  {booking.jobDetails?.description && (
                    <div className="col-span-full">
                      <InfoRow label="Job Description" value={booking.jobDetails.description} />
                    </div>
                  )}
                </div>
              </section>

              {/* ── Location ────────────────────────────────────────────────── */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-slate-300 inline-block" />
                  Location
                  <span className="flex-1 h-px bg-slate-100 inline-block" />
                </h4>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                  {(booking.jobDetails?.location || booking.location || booking.address) ? (
                    <>
                      <p className="font-medium text-slate-800 text-sm">
                        📍 {booking.jobDetails?.location || booking.location || booking.address}
                      </p>
                      {(booking.jobDetails?.floorHouseNo || booking.floorHouseNo) && (
                        <p className="text-xs text-slate-600">🏠 House/Floor: {booking.jobDetails?.floorHouseNo || booking.floorHouseNo}</p>
                      )}
                      {(booking.jobDetails?.landmark || booking.landmark) && (
                        <p className="text-xs text-slate-600">🗺 Landmark: {booking.jobDetails?.landmark || booking.landmark}</p>
                      )}
                      {(booking.jobDetails?.locationGeo || booking.locationGeo) && (() => {
                        const geo = booking.jobDetails?.locationGeo || booking.locationGeo
                        const lat = geo?.lat?.toFixed ? geo.lat.toFixed(6) : geo?.lat
                        const lng = geo?.lng?.toFixed ? geo.lng.toFixed(6) : geo?.lng
                        return (
                          <p className="text-[10px] font-mono text-indigo-500">
                            Coords: {lat}, {lng}
                            {' '}
                            <a
                              href={`https://maps.google.com/?q=${lat},${lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="underline ml-1"
                            >View Map ↗</a>
                          </p>
                        )
                      })()}
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Address info missing</p>
                  )}
                </div>
              </section>

              {/* ── Client & Worker Profiles ─────────────────────────────────── */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-slate-300 inline-block" />
                  Participants
                  <span className="flex-1 h-px bg-slate-100 inline-block" />
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2">👤 Client</p>
                    <ProfileCard
                      profile={booking.clientProfile}
                      role="Client"
                      onViewProfile={handleViewProfile}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2">🔧 Worker</p>
                    <ProfileCard
                      profile={booking.workerProfile}
                      role="Worker"
                      onViewProfile={handleViewProfile}
                    />
                  </div>
                </div>
              </section>

              {/* ── Application Timeline ─────────────────────────────────────── */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-slate-300 inline-block" />
                  Application Details
                  <span className="flex-1 h-px bg-slate-100 inline-block" />
                </h4>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoRow label="Application Status" value={booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : '—'} />
                  {booking.negotiationStatus && <InfoRow label="Negotiation" value={booking.negotiationStatus} />}
                  {booking.proposedPrice && <InfoRow label="Proposed Price" value={`৳${booking.proposedPrice}`} />}
                  {booking.finalPrice && <InfoRow label="Agreed Price" value={`৳${booking.finalPrice}`} />}
                  {booking.workerEmail && <InfoRow label="Worker Email" value={booking.workerEmail} />}
                  {booking.clientEmail && <InfoRow label="Client Email" value={booking.clientEmail} />}
                  {booking.notes && (
                    <div className="col-span-full">
                      <InfoRow label="Notes" value={booking.notes} />
                    </div>
                  )}
                </div>

                {/* Timeline pills */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {[
                    { label: 'Applied', date: booking.createdAt, color: 'bg-slate-200 text-slate-700' },
                    { label: 'Accepted', date: booking.acceptedAt, color: 'bg-blue-100 text-blue-700' },
                    { label: 'Completed', date: booking.completedAt, color: 'bg-emerald-100 text-emerald-700' },
                    { label: 'Updated', date: booking.updatedAt, color: 'bg-amber-100 text-amber-700' },
                  ].filter(e => e.date).map((e, i) => (
                    <div key={i} className={`px-3 py-1.5 rounded-full ${e.color} text-xs font-medium`}>
                      <span className="font-semibold">{e.label}:</span>{' '}
                      {new Date(e.date).toLocaleDateString()}
                    </div>
                  ))}
                </div>
              </section>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <p className="text-xs text-slate-400">
                Moderator Note: Verify location and participant details before any action.
              </p>
              <button
                className="btn btn-neutral btn-sm"
                onClick={() => setDetailsModal({ open: false, booking: null })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
