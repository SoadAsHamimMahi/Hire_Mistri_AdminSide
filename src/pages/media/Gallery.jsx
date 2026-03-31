import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import Pagination from '../../components/Pagination'

export default function Gallery() {
  const api = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Pagination
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 24 // 24 items per page for a nice grid
  
  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ url: '', caption: '', category: 'General' })
  const [saving, setSaving] = useState(false)
  
  // Delete State
  const [delItem, setDelItem] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchGallery = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/media/gallery', { page, limit })
      setList(res.data?.list ?? [])
      setTotal(res.data?.total ?? 0)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGallery() }, [page])

  const openAdd = () => {
    setForm({ url: '', caption: '', category: 'General' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.url.trim()) return alert('Image URL is required')

    setSaving(true)
    try {
      await api.post('/api/admin/media/gallery', form)
      setShowModal(false)
      fetchGallery()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add image')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!delItem) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/media/gallery/${delItem._id}`)
      setDelItem(null)
      fetchGallery()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Media Gallery</h1>
          <p className="mt-1 text-slate-600">Manage images used across the application.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 active:scale-95 transition-all"
        >
          <span>📸</span> Add Media
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      {/* Grid View */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 min-h-[400px]">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col h-64 items-center justify-center text-slate-400">
             <span className="text-4xl mb-3">🖼️</span>
             <p>No media found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {list.map(item => (
                <div key={item._id} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                  <img src={item.url} alt={item.caption} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-4">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-violet-400 mb-1">{item.category}</span>
                    <p className="text-sm font-medium text-white truncate" title={item.caption}>{item.caption || 'No caption'}</p>
                    <p className="text-xs text-slate-400 mt-1 truncate" title={item.url}>{item.url}</p>
                    
                    <button 
                      onClick={() => setDelItem(item)}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-red-500/80 text-white backdrop-blur flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Delete Image"
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
               <h3 className="font-semibold text-slate-800">Add New Media</h3>
               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
               <div>
                 <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">Image URL</label>
                 <input
                   autoFocus
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
                   placeholder="https://example.com/image.jpg"
                   value={form.url}
                   onChange={e => setForm({...form, url: e.target.value})}
                 />
                 {form.url && (
                   <div className="mt-3 aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                     <img src={form.url} alt="Preview" className="max-h-full max-w-full object-contain" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }} />
                     <span style={{display: 'none'}} className="text-xs text-slate-400">Invalid image URL</span>
                   </div>
                 )}
               </div>
               
               <div>
                 <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">Caption / Alt Text</label>
                 <input
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
                   placeholder="e.g. Worker plumbing a sink"
                   value={form.caption}
                   onChange={e => setForm({...form, caption: e.target.value})}
                 />
               </div>

               <div>
                 <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</label>
                 <select
                   className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
                   value={form.category}
                   onChange={e => setForm({...form, category: e.target.value})}
                 >
                   <option>General</option>
                   <option>Home Slider</option>
                   <option>Featured</option>
                   <option>Avatars</option>
                 </select>
               </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-4 flex justify-end gap-3 shrink-0">
               <button onClick={() => setShowModal(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
               <button onClick={handleSave} disabled={saving} className="rounded-xl bg-violet-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60 transition-all">
                 {saving ? 'Adding...' : 'Add Image'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {delItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-16 w-16 overflow-hidden items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
               <img src={delItem.url} alt="" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Image?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete this media item permanently?
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDelItem(null)} className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60 transition-colors">
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
