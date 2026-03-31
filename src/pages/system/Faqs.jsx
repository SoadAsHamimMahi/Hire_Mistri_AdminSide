import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'

export default function Faqs() {
  const api = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ question: '', answer: '', order: 0, isActive: true })
  const [saving, setSaving] = useState(false)
  
  // Delete Confirmation State
  const [delItem, setDelItem] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchFaqs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/system/faqs')
      setList(res.data?.list ?? [])
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFaqs() }, [])

  const openAdd = () => {
    setEditItem(null)
    // Default order is length * 10 
    setForm({ question: '', answer: '', order: list.length * 10, isActive: true })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({ 
      question: item.question, 
      answer: item.answer, 
      order: item.order || 0, 
      isActive: item.isActive !== false 
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return alert('Question and Answer are required')

    setSaving(true)
    try {
      if (editItem) {
        await api.patch(`/api/admin/system/faqs/${editItem._id}`, form)
      } else {
        await api.post('/api/admin/system/faqs', form)
      }
      setShowModal(false)
      fetchFaqs()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save FAQ')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (item) => {
    try {
      await api.patch(`/api/admin/system/faqs/${item._id}`, { isActive: !item.isActive })
      fetchFaqs()
    } catch (err) {
      alert('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!delItem) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/system/faqs/${delItem._id}`)
      setDelItem(null)
      fetchFaqs()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const confirmDelete = (item) => setDelItem(item)

  const columns = [
    { key: 'order', label: 'Order', render: (v) => <span className="font-mono text-sm px-2 bg-slate-100 rounded text-slate-600">{v}</span> },
    { key: 'question', label: 'Question', render: (v, item) => (
      <div className="max-w-md">
        <div className="font-semibold text-slate-800 break-words">{v}</div>
        <div className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.answer}</div>
      </div>
    )},
    { key: 'isActive', label: 'Status', render: (v, item) => (
      <button 
        onClick={() => toggleStatus(item)}
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 transition-all ${
          v ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-500 ring-slate-200 hover:bg-slate-100'
        }`}
      >
        {v ? 'Active' : 'Hidden'}
      </button>
    )},
    { key: '_actions', label: 'Actions', render: (_, item) => (
       <div className="flex gap-2">
         <button onClick={() => openEdit(item)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors">Edit</button>
         <button onClick={() => confirmDelete(item)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors">Discard</button>
       </div>
    )}
  ]

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage FAQs</h1>
          <p className="mt-1 text-slate-600">Add or update frequently asked questions for clients and workers.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 active:scale-95 transition-all"
        >
          <span>➕</span> Add FAQ
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <DataTable columns={columns} data={list} loading={loading} emptyMessage="No FAQs added yet." />
      </div>

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
               <h3 className="font-semibold text-slate-800">{editItem ? 'Edit FAQ' : 'Add New FAQ'}</h3>
               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="space-y-4">
                 <div>
                   <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">Question text</label>
                   <input
                     autoFocus
                     className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
                     placeholder="e.g. How do I book a worker?"
                     value={form.question}
                     onChange={e => setForm({...form, question: e.target.value})}
                   />
                 </div>
                 
                 <div>
                   <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">Answer Details</label>
                   <textarea
                     rows={5}
                     className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none resize-none"
                     placeholder="Detailed explanation goes here..."
                     value={form.answer}
                     onChange={e => setForm({...form, answer: e.target.value})}
                   />
                 </div>

                 <div className="flex gap-4">
                   <div className="flex-1">
                     <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">Display Order</label>
                     <input
                       type="number"
                       className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
                       value={form.order}
                       onChange={e => setForm({...form, order: Number(e.target.value)})}
                     />
                     <span className="text-[10px] text-slate-400 mt-1 block">Lower numbers appear first (e.g., 10, 20)</span>
                   </div>
                   
                   <div className="flex-1">
                     <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">Visibility Status</label>
                     <div className="mt-2.5">
                       <label className="flex items-center gap-2 cursor-pointer">
                         <input 
                           type="checkbox" 
                           className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                           checked={form.isActive} 
                           onChange={e => setForm({...form, isActive: e.target.checked})} 
                         />
                         <span className="text-sm text-slate-700 font-medium">Visible to Users</span>
                       </label>
                     </div>
                   </div>
                 </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-4 flex justify-end gap-3 shrink-0">
               <button onClick={() => setShowModal(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
               <button onClick={handleSave} disabled={saving} className="rounded-xl bg-violet-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60 transition-all">
                 {saving ? 'Saving...' : 'Save FAQ'}
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
            <h3 className="text-lg font-bold text-slate-900">Discard FAQ?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete this FAQ entry? It will be removed from all users' views.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDelItem(null)} className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60 transition-colors">
                {deleting ? 'Discarding...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
