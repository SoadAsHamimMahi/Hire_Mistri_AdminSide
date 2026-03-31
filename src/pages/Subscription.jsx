import { useEffect, useState } from 'react'
import { useApi } from '../api/client'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'

export default function Subscription() {
  const api = useApi()
  const [activeTab, setActiveTab] = useState('plans') // 'plans' or 'subscribers'

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
          <p className="mt-1 text-slate-600">Manage pricing plans and view active subscribers.</p>
        </div>
        
        <div className="flex rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('plans')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'plans' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Plans
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'subscribers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Subscribers
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        {activeTab === 'plans' ? <PlansTab api={api} /> : <SubscribersTab api={api} />}
      </div>
    </div>
  )
}

function PlansTab({ api }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ name: '', price: 0, interval: 'month', features: '', isActive: true, order: 0 })
  const [saving, setSaving] = useState(false)

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/subscription/plans')
      setList(res.data?.list ?? [])
    } catch { /* alert handled globally */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPlans() }, [])

  const openAdd = () => {
    setForm({ name: '', price: 0, interval: 'month', features: '', isActive: true, order: list.length * 10 })
    setEditItem(null)
    setShowModal(true)
  }

  const openEdit = (item) => {
    setForm({
      name: item.name,
      price: item.price,
      interval: item.interval || 'month',
      features: (item.features || []).join('\n'), // Textarea logic
      isActive: item.isActive,
      order: item.order || 0
    })
    setEditItem(item)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Plan name required')
    
    setSaving(true)
    try {
      const payload = {
        ...form,
        features: form.features.split('\n').map(f => f.trim()).filter(Boolean)
      }
      
      if (editItem) {
        await api.patch(`/api/admin/subscription/plans/${editItem._id}`, payload)
      } else {
        await api.post('/api/admin/subscription/plans', payload)
      }
      setShowModal(false)
      fetchPlans()
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (item) => {
    try {
      await api.patch(`/api/admin/subscription/plans/${item._id}`, { isActive: !item.isActive })
      fetchPlans()
    } catch { alert('Update failed') }
  }

  const columns = [
    { key: 'order', label: 'Order', render: v => <span className="font-mono text-xs text-slate-400">{v}</span> },
    { key: 'name', label: 'Plan details', render: (v, item) => (
      <div>
         <div className="font-bold text-slate-800 flex items-center gap-2">
            {v} <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500 uppercase">{item.interval}</span>
         </div>
         <div className="text-emerald-600 font-semibold mt-0.5">${item.price}</div>
      </div>
    )},
    { key: 'features', label: 'Features', render: v => (
       <div className="text-xs text-slate-500 space-y-1">
         {v?.slice(0, 3).map((f, i) => <div key={i}>✓ {f}</div>)}
         {v?.length > 3 && <div className="text-slate-400 italic">+{v.length - 3} more</div>}
       </div>
    )},
    { key: 'isActive', label: 'Status', render: (v, item) => (
      <button 
        onClick={() => toggleStatus(item)}
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 transition-all ${
          v ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-500 ring-slate-200 hover:bg-slate-100'
        }`}
      >
        {v ? 'Active' : 'Draft'}
      </button>
    )},
    { key: '_actions', label: 'Action', render: (_, item) => (
       <button onClick={() => openEdit(item)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100">Edit</button>
    )}
  ]

  return (
    <>
      <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Pricing Plans</h2>
        <button onClick={openAdd} className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors">➕ Add Plan</button>
      </div>
      <DataTable columns={columns} data={list} loading={loading} />

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 p-4 font-semibold">{editItem ? 'Edit Plan' : 'New Plan'}</div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Plan Name</label>
                  <input className="w-full mt-1.5 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Billing Interval</label>
                  <select className="w-full mt-1.5 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20" value={form.interval} onChange={e => setForm({...form, interval: e.target.value})}>
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Price ($)</label>
                  <input type="number" className="w-full mt-1.5 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Order</label>
                  <input type="number" className="w-full mt-1.5 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20" value={form.order} onChange={e => setForm({...form, order: Number(e.target.value)})} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Features (one per line)</label>
                <textarea rows={5} className="w-full mt-1.5 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20 resize-none font-mono" placeholder="Priority Support&#10;Unlimited Saves" value={form.features} onChange={e => setForm({...form, features: e.target.value})} />
              </div>
            </div>
            <div className="border-t border-slate-100 p-4 flex justify-end gap-2 bg-slate-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-200">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700">{saving ? 'Saving...' : 'Save Plan'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SubscribersTab({ api }) {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchSubs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/subscription/subscriptions', { page, limit: 15 })
      setList(res.data?.list ?? [])
      setTotal(res.data?.total ?? 0)
    } catch { /* alert handled globally */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSubs() }, [page])

  const columns = [
    { key: 'userId', label: 'User ID', render: v => <span className="font-mono text-xs text-slate-500">{v || 'N/A'}</span> },
    { key: 'planId', label: 'Plan ID', render: v => <span className="font-mono text-xs text-violet-600 bg-violet-50 px-1 py-0.5 rounded">{v}</span> },
    { key: 'status', label: 'Status', render: v => (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${v === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{v}</span>
    )},
    { key: 'createdAt', label: 'Started', render: v => v ? new Date(v).toLocaleDateString() : '—' }
  ]

  return (
    <>
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="font-semibold text-slate-800">Active Subscriptions</h2>
      </div>
      <DataTable columns={columns} data={list} loading={loading} emptyMessage="No active subscribers found." />
      <div className="p-4 border-t border-slate-100">
        <Pagination page={page} total={total} limit={15} onPageChange={setPage} />
      </div>
    </>
  )
}
