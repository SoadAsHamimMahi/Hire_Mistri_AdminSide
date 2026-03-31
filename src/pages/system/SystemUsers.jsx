import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'

const PERMISSIONS = [
  { id: '*', label: 'Super Admin (All Access)' },
  { id: 'users', label: 'Manage Clients & Workers' },
  { id: 'jobs', label: 'Manage Jobs & Applications' },
  { id: 'finance', label: 'Manage Payments & Finance' },
  { id: 'promo', label: 'Manage Promos & Notifications' },
  { id: 'system', label: 'System Settings & Audit' },
]

export default function SystemUsers() {
  const api = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ uid: '', email: '', permissions: [] })
  const [saving, setSaving] = useState(false)
  
  // Delete Confirmation State
  const [delItem, setDelItem] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/system/users')
      setList(res.data?.list ?? [])
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm({ uid: '', email: '', permissions: [] })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    // Note: API only allows patching permissions, but we show email/uid as readonly in modal 
    setForm({ uid: item.uid, email: item.email, permissions: item.permissions || [] })
    setShowModal(true)
  }

  const togglePermission = (permId) => {
    setForm(prev => {
      let p = [...prev.permissions]
      if (permId === '*') {
        // If clicking *, clear everything and just set *
        p = p.includes('*') ? [] : ['*']
      } else {
        // If clicking a specific perm, remove * and toggle the perm
        p = p.filter(x => x !== '*')
        if (p.includes(permId)) p = p.filter(x => x !== permId)
        else p.push(permId)
      }
      return { ...prev, permissions: p }
    })
  }

  const handleSave = async () => {
    if (!form.permissions.length) return alert('Select at least one permission')
    if (!editItem && (!form.uid.trim() || !form.email.trim())) return alert('UID and Email are required')

    setSaving(true)
    try {
      if (editItem) {
        await api.patch(`/api/admin/system/users/${editItem._id}`, { permissions: form.permissions })
      } else {
        await api.post('/api/admin/system/users', { 
          uid: form.uid.trim(), 
          email: form.email.trim().toLowerCase(), 
          permissions: form.permissions 
        })
      }
      setShowModal(false)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save admin user')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!delItem) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/system/users/${delItem._id}`)
      setDelItem(null)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const confirmDelete = (item) => setDelItem(item)

  const columns = [
    { key: 'email', label: 'Admin Email', render: (v, item) => (
      <div>
        <div className="font-semibold text-slate-800">{v}</div>
        <div className="text-xs text-slate-400 font-mono mt-0.5" title="Firebase UID">uid: {item.uid}</div>
      </div>
    )},
    { key: 'permissions', label: 'Access Level', render: (perms) => {
        if (!perms || !perms.length) return <span className="text-slate-400 text-xs italic">None</span>
        if (perms.includes('*')) return <span className="inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">Super Admin</span>
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
             {perms.map(p => (
               <span key={p} className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 uppercase tracking-wider">{p}</span>
             ))}
          </div>
        )
    }},
    { key: 'createdAt', label: 'Added On', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: '_actions', label: 'Actions', render: (_, item) => (
       <div className="flex gap-2">
         <button onClick={() => openEdit(item)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors">Edit</button>
         <button onClick={() => confirmDelete(item)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors">Remove</button>
       </div>
    )}
  ]

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Users</h1>
          <p className="mt-1 text-slate-600">Manage administrator accounts and team permissions.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 active:scale-95 transition-all"
        >
          <span>➕</span> Add Admin
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <DataTable columns={columns} data={list} loading={loading} emptyMessage="No system users mapped yet." />
      </div>

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
               <h3 className="font-semibold text-slate-800">{editItem ? 'Edit Permissions' : 'Add System User'}</h3>
               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5">
              {!editItem && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800 leading-relaxed">
                  <strong>Notice:</strong> The user must first sign up on the platform via Firebase. Obtain their Firebase UID and Email to map them as an admin here.
                </div>
              )}

              <div className="space-y-4">
                 <div>
                   <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">Email Address</label>
                   <input
                     autoFocus={!editItem}
                     disabled={!!editItem}
                     className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60 transition-all outline-none"
                     placeholder="admin@hiremistri.com"
                     value={form.email}
                     onChange={e => setForm({...form, email: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">Firebase UID</label>
                   <input
                     disabled={!!editItem}
                     className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60 transition-all outline-none font-mono"
                     placeholder="Alphanumeric Firebase ID"
                     value={form.uid}
                     onChange={e => setForm({...form, uid: e.target.value})}
                   />
                 </div>
                 
                 <div>
                   <label className="mb-2 block text-xs font-semibold text-slate-600 uppercase tracking-wider">Access Permissions</label>
                   <div className="grid gap-2">
                     {PERMISSIONS.map(p => {
                       const isSelected = form.permissions.includes(p.id)
                       return (
                         <button
                           key={p.id}
                           onClick={() => togglePermission(p.id)}
                           className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                             isSelected ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'
                           }`}
                         >
                           <div className={`flex h-5 w-5 items-center justify-center rounded border ${isSelected ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 bg-white'}`}>
                             {isSelected && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                           </div>
                           <span className={`text-sm font-medium ${isSelected ? 'text-violet-900' : 'text-slate-700'}`}>{p.label}</span>
                         </button>
                       )
                     })}
                   </div>
                 </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-4 flex justify-end gap-3 shrink-0">
               <button onClick={() => setShowModal(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
               <button onClick={handleSave} disabled={saving} className="rounded-xl bg-violet-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60 transition-all">
                 {saving ? 'Saving...' : 'Save Admin'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {delItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">🗑️</div>
            <h3 className="text-lg font-bold text-slate-900">Remove Admin?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to revoke admin access for <strong className="text-slate-700">{delItem.email}</strong>? They will immediately lose access to this panel.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDelItem(null)} className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60 transition-colors">
                {deleting ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
