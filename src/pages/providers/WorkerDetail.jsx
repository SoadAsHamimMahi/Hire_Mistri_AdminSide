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
      className="rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold ring-4 ring-white shadow-md"
    >
      {initials(name)}
    </div>
  )
}

function StatCard({ label, value, color = 'teal', icon }) {
  const colors = {
    teal: 'bg-teal-50 border-teal-100 text-teal-700',
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

function AccountStatusBadge({ status }) {
  const map = {
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending_review: 'bg-amber-100 text-amber-700 border-amber-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
  }
  const labels = {
    approved: '✓ Approved',
    pending_review: '⏳ Pending Review',
    rejected: '✕ Rejected',
    draft: 'Draft',
  }
  const cls = map[status] || 'bg-slate-100 text-slate-600 border-slate-200'
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {labels[status] || status}
    </span>
  )
}

function BookingStatusBadge({ status }) {
  const map = {
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    accepted: 'bg-blue-100 text-blue-700 border-blue-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  )
}

export default function WorkerDetail() {
  const { uid } = useParams()
  const api = useApi()
  const [profile, setProfile] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Due Management State
  const [dueInput, setDueInput] = useState('')
  const [dueLoading, setDueLoading] = useState(false)

  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/admin/providers/${uid}`)
      setProfile(res.data)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!uid) return

    const loadProfile = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/api/admin/providers/${uid}`)
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
        const res = await api.get('/api/admin/bookings', { limit: 50 })
        const workerBookings = (res.data?.list ?? []).filter(b => b.workerId === uid)
        setBookings(workerBookings)
      } catch {
        // non-critical
      } finally {
        setBookingsLoading(false)
      }
    }

    loadProfile()
    loadBookings()
  }, [uid])

  const handleDueAction = async (action) => {
    if (action === 'clear' && !window.confirm('Are you sure you want to completely clear this worker\'s due balance?')) return;
    if ((action === 'add' || action === 'subtract') && (!dueInput || Number(dueInput) <= 0)) {
       return alert('Please enter a valid amount greater than 0');
    }

    setDueLoading(true)
    try {
      const payload = { action, amount: Number(dueInput) || 0 };
      await api.post(`/api/admin/providers/${uid}/due`, payload);
      setDueInput('');
      await loadProfile(); // Refresh profile to get updated due limits
      alert(`Successfully updated due balance.`)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update due balance');
    } finally {
      setDueLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="loading loading-spinner loading-lg text-teal-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/providers" className="btn btn-ghost btn-sm">← Back to Providers</Link>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
      </div>
    )
  }

  if (!profile) return null

  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.displayName || 'Unknown'
  const stats = profile.stats || {}
  const completedJobs = stats.workerCompleted ?? 0
  const activeJobs = stats.workerAccepted ?? 0
  const totalApps = stats.workerApplicationsTotal ?? 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/providers" className="hover:text-teal-600 transition-colors">Providers</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate">{name}</span>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <Avatar src={profile.profileCover} name={name} size={80} />
            <div className="mb-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{name}</h1>
                {profile.isVerified && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">✓ Verified</span>
                )}
                {profile.isSuspended && (
                  <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-semibold">Suspended</span>
                )}
                {profile.workerAccountStatus && (
                  <AccountStatusBadge status={profile.workerAccountStatus} />
                )}
              </div>
              <p className="text-sm text-slate-500">{profile.headline || 'Worker / Service Provider'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Applied" value={totalApps} icon="📋" color="teal" />
            <StatCard label="Completed" value={completedJobs} icon="✅" color="emerald" />
            <StatCard label="Active Jobs" value={activeJobs} icon="🔵" color="amber" />
            <StatCard
              label="Avg Rating"
              value={stats.averageRating ? Number(stats.averageRating).toFixed(1) : 'N/A'}
              icon="⭐"
              color="slate"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Contact + Registration details */}
        <div className="md:col-span-1 space-y-4">
          
          {/* Due Management */}
          <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-6 overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <span className="text-6xl">💰</span>
             </div>
             <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Financial Dues</h2>
             <div className="mb-6 flex items-end gap-2 text-rose-600">
                <span className="text-sm font-bold pb-1">৳</span>
                <span className="text-4xl font-extrabold tracking-tight">{Number(profile?.dueBalance || 0).toLocaleString()}</span>
             </div>
             
             <div className="space-y-4 relative z-10">
                <div>
                   <label className="text-xs font-semibold text-slate-500 mb-1 block">Adjust Amount (৳)</label>
                   <input 
                      type="number" 
                      min="1"
                      placeholder="E.g. 150" 
                      value={dueInput}
                      onChange={(e) => setDueInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 font-medium" 
                   />
                </div>
                <div className="flex gap-2">
                   <button 
                      onClick={() => handleDueAction('subtract')} 
                      disabled={dueLoading || !dueInput}
                      className="flex-1 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                   >
                      - Reduce
                   </button>
                   <button 
                      onClick={() => handleDueAction('add')} 
                      disabled={dueLoading || !dueInput}
                      className="flex-1 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                   >
                      + Add
                   </button>
                </div>
                <div className="pt-2 border-t border-slate-100">
                   <button 
                      onClick={() => handleDueAction('clear')} 
                      disabled={dueLoading || Number(profile?.dueBalance || 0) <= 0}
                      className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold shadow-sm shadow-rose-500/20 transition-colors uppercase tracking-widest disabled:opacity-50"
                   >
                      {dueLoading ? 'Processing...' : 'Clear All Dues'}
                   </button>
                </div>
             </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-700 border-b pb-2">Contact & Profile</h2>
            <div className="space-y-3">
              <InfoRow label="Email" value={profile.email} />
              <InfoRow label="Phone" value={profile.phone} />
              <InfoRow label="City" value={profile.city} />
              <InfoRow label="Country" value={profile.country} />
              <InfoRow label="District" value={profile.district} />
              <InfoRow label="Experience" value={profile.experienceYears || profile.workExperience ? `${profile.experienceYears || profile.workExperience} years` : null} />
              <InfoRow label="Availability" value={profile.isAvailable ? '✅ Available' : '🔴 Unavailable'} />
              <InfoRow label="Joined" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : null} />
              <InfoRow label="Last Active" value={profile.lastActiveAt ? new Date(profile.lastActiveAt).toLocaleString() : null} />
              <InfoRow label="UID" value={profile.uid} />
            </div>
          </div>

          {/* Services */}
          {(profile.servicesOffered || Array.isArray(profile.skills)?.length > 0) && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-700 border-b pb-2 mb-3">Services & Skills</h2>
              {profile.servicesOffered && (
                <div className="mb-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Services Offered</p>
                  <p className="text-sm text-slate-700">
                    {typeof profile.servicesOffered === 'string' ? profile.servicesOffered : JSON.stringify(profile.servicesOffered)}
                  </p>
                </div>
              )}
              {Array.isArray(profile.skills) && profile.skills.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded-full text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NID / Registration */}
          {(profile.fullLegalName || profile.nidNumber) && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-700 border-b pb-2 mb-3">Registration Details</h2>
              <div className="space-y-3">
                <InfoRow label="Legal Name" value={profile.fullLegalName} />
                <InfoRow label="NID Number" value={profile.nidNumber} />
                <InfoRow label="Payout Provider" value={profile.payoutWalletProvider} />
                {profile.nidFrontImageUrl && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">NID Front</p>
                    <img src={profile.nidFrontImageUrl} alt="NID Front" className="rounded-lg border border-slate-200 w-full max-h-32 object-cover" />
                  </div>
                )}
                {profile.nidBackImageUrl && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">NID Back</p>
                    <img src={profile.nidBackImageUrl} alt="NID Back" className="rounded-lg border border-slate-200 w-full max-h-32 object-cover" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Bio, Certifications, Portfolio, Bookings */}
        <div className="md:col-span-2 space-y-4">
          {/* Bio */}
          {profile.bio && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-700 border-b pb-2 mb-3">Bio</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Certifications */}
          {Array.isArray(profile.certifications) && profile.certifications.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-700 border-b pb-2 mb-3">Certifications</h2>
              <div className="space-y-2">
                {profile.certifications.map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg p-3">
                    <span className="text-sm text-slate-700 font-medium">{c.name || 'Certificate'}</span>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-teal-600 hover:underline">View Proof ↗</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {Array.isArray(profile.portfolio) && profile.portfolio.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-700 border-b pb-2 mb-3">Portfolio</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profile.portfolio.map((p, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={p.url} alt={p.caption || 'Work sample'} className="w-full h-28 object-cover" />
                    {p.caption && (
                      <p className="text-[10px] text-slate-500 px-2 py-1 truncate">{p.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booking History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-700 border-b pb-2 mb-4 flex items-center gap-2">
              Booking History
              {bookings.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold">{bookings.length}</span>
              )}
            </h2>

            {bookingsLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-md text-teal-600" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <span className="text-4xl block mb-2">📭</span>
                <p className="text-sm">No bookings found for this worker.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{b.jobTitle || 'Untitled Job'}</p>
                      <p className="text-xs text-slate-500">
                        Client: {b.clientName || <span className="italic text-slate-400">Unknown</span>}
                        {b.createdAt && ` · ${new Date(b.createdAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(b.finalPrice || b.jobDetails?.budget || b.budget) && (
                        <span className="text-xs font-semibold text-slate-700">৳{b.finalPrice || b.jobDetails?.budget || b.budget}</span>
                      )}
                      <BookingStatusBadge status={b.status} />
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
