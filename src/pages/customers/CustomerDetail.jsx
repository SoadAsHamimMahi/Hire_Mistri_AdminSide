import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../../api/client'

function Avatar({ src, name, size = 80 }) {
  const [err, setErr] = useState(false)
  const initials = (n) => n ? n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  if (src && !err) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setErr(true)}
        style={{ width: size, height: size }}
        className="rounded-full object-cover ring-4 ring-white shadow-md"
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center font-bold ring-4 ring-white shadow-md"
    >
      {initials(name)}
    </div>
  )
}

function StatCard({ label, value, color = 'indigo', icon }) {
  const colors = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  }
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-1 ${colors[color]}`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <span className="text-2xl font-bold">{value ?? 0}</span>
    </div>
  )
}

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-sm text-slate-800">{value}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    accepted: 'bg-blue-100 text-blue-700 border-blue-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
  }
  const cls = map[status] || 'bg-slate-100 text-slate-600 border-slate-200'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${cls}`}>
      {status}
    </span>
  )
}

export default function CustomerDetail() {
  const { uid } = useParams()
  const api = useApi()
  const [profile, setProfile] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!uid) return
    const loadProfile = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/api/users/${uid}`)
        setProfile(res.data)
      } catch (err) {
        setError(err.response?.data?.error || err.message)
      } finally {
        setLoading(false)
      }
    }
    const loadBookings = async () => {
      setBookingsLoading(true)
      try {
        // Fetch all bookings and filter by clientId (admin bookings endpoint)
        const res = await api.get('/api/admin/bookings', { limit: 50 })
        const clientBookings = (res.data?.list ?? []).filter(b => b.clientId === uid)
        setBookings(clientBookings)
      } catch {
        // non-critical
      } finally {
        setBookingsLoading(false)
      }
    }
    loadProfile()
    loadBookings()
  }, [uid])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="loading loading-spinner loading-lg text-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/customers" className="btn btn-ghost btn-sm">← Back to Customers</Link>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
      </div>
    )
  }

  if (!profile) return null

  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.displayName || 'Unknown'
  const stats = profile.stats || {}

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/customers" className="hover:text-indigo-600 transition-colors">Customers</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate">{name}</span>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <Avatar src={profile.profileCover} name={name} size={80} />
            <div className="mb-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{name}</h1>
                {profile.emailVerified && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">✓ Verified</span>
                )}
                {profile.isSuspended && (
                  <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-semibold">Suspended</span>
                )}
              </div>
              <p className="text-sm text-slate-500 capitalize">{profile.role || 'Client'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Jobs Posted" value={stats.totalJobsPosted ?? profile.totalJobsPosted} icon="📋" color="indigo" />
            <StatCard label="Completed" value={stats.clientCompleted ?? stats.workerCompleted} icon="✅" color="emerald" />
            <StatCard label="Pending" value={stats.clientPending} icon="⏳" color="amber" />
            <StatCard label="Avg Rating" value={stats.averageRating ? Number(stats.averageRating).toFixed(1) : 'N/A'} icon="⭐" color="slate" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact & Profile info */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-700 border-b pb-2">Contact Information</h2>
            <div className="space-y-3">
              <InfoRow label="Email" value={profile.email} />
              <InfoRow label="Phone" value={profile.phone} />
              <InfoRow label="City" value={profile.city} />
              <InfoRow label="Country" value={profile.country} />
              <InfoRow label="Address" value={[profile.address1, profile.address2].filter(Boolean).join(', ')} />
              <InfoRow label="Joined" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : null} />
              <InfoRow label="Last Active" value={profile.lastActiveAt ? new Date(profile.lastActiveAt).toLocaleString() : null} />
              <InfoRow label="UID" value={profile.uid} />
            </div>
          </div>

          {profile.bio && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-700 border-b pb-2 mb-3">Bio</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Booking History */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-700 border-b pb-2 mb-4">
              Booking History
              {bookings.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">{bookings.length}</span>
              )}
            </h2>

            {bookingsLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-md text-indigo-600" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <span className="text-4xl block mb-2">📭</span>
                <p className="text-sm">No bookings found for this client.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {b.jobTitle || 'Untitled Job'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Worker: {b.workerName || <span className="italic text-slate-400">Unassigned</span>}
                        {b.createdAt && ` · ${new Date(b.createdAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(b.jobDetails?.budget || b.budget || b.finalPrice) && (
                        <span className="text-xs font-semibold text-slate-700">
                          ৳{b.finalPrice || b.jobDetails?.budget || b.budget}
                        </span>
                      )}
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
