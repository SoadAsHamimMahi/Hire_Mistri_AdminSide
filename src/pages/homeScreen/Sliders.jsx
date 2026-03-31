import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function Sliders() {
  const api = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState({ open: false, slider: null })
  
  // Forms
  const [formData, setFormData] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '', order: 0, isActive: true })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState(null)

  // Status Action State
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const fetchSliders = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/home/sliders')
      setList(res.data?.list ?? [])
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSliders()
  }, [])

  const handleToggleActive = async (id, currentStatus) => {
    setActionLoadingId(id)
    try {
      await api.patch(`/api/admin/home/sliders/${id}`, { isActive: !currentStatus })
      setList(list.map(item => item._id === id ? { ...item, isActive: !currentStatus } : item))
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.error || err.message))
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slider? This action cannot be undone.')) return
    setActionLoadingId(id)
    try {
      await api.delete(`/api/admin/home/sliders/${id}`)
      setList(list.filter(item => item._id !== id))
    } catch (err) {
      alert('Failed to delete slider: ' + (err.response?.data?.error || err.message))
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)
    try {
      await api.post('/api/admin/home/sliders', {
        ...formData,
        order: Number(formData.order)
      })
      setShowAddModal(false)
      setFormData({ title: '', subtitle: '', imageUrl: '', linkUrl: '', order: 0, isActive: true })
      fetchSliders()
    } catch (err) {
      setFormError(err.response?.data?.error || err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)
    try {
      await api.patch(`/api/admin/home/sliders/${showEditModal.slider._id}`, {
        ...formData,
        order: Number(formData.order)
      })
      setShowEditModal({ open: false, slider: null })
      fetchSliders()
    } catch (err) {
      setFormError(err.response?.data?.error || err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const openEdit = (slider) => {
    setFormData({
      title: slider.title || '',
      subtitle: slider.subtitle || '',
      imageUrl: slider.imageUrl || '',
      linkUrl: slider.linkUrl || '',
      order: slider.order || 0,
      isActive: slider.isActive
    })
    setShowEditModal({ open: true, slider })
  }

  const columns = [
    { 
      key: 'imageUrl', 
      label: 'Image', 
      render: (v) => v ? (
        <div className="w-16 h-10 rounded overflow-hidden bg-slate-100 flex items-center justify-center">
          <img src={v} alt="Slider" className="w-full h-full object-cover" />
        </div>
      ) : <div className="w-16 h-10 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-400">No Img</div>
    },
    { 
      key: 'title', 
      label: 'Content', 
      render: (v, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{v || 'No Title'}</span>
          {row.subtitle && <span className="text-xs text-slate-500">{row.subtitle}</span>}
        </div>
      )
    },
    { key: 'order', label: 'Order', render: (v) => <span className="font-mono text-slate-700">{v}</span> },
    {
      key: 'isActive',
      label: 'Status',
      render: (v, item) => {
        if (actionLoadingId === item._id) return <span className="loading loading-spinner loading-xs" />
        return (
          <button 
            type="button"
            className={`badge badge-sm cursor-pointer hover:opacity-80 transition-opacity ${v ? 'badge-success' : 'badge-ghost'}`}
            onClick={() => handleToggleActive(item._id, v)}
            title="Click to toggle"
          >
            {v ? 'Active' : 'Inactive'}
          </button>
        )
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, item) => (
        <div className="flex gap-1">
          <button 
            className="btn btn-xs btn-ghost btn-circle"
            onClick={() => openEdit(item)}
            title="Edit"
          >
            <PencilSquareIcon className="w-4 h-4 text-slate-500 hover:text-primary" />
          </button>
          <button 
            className="btn btn-xs btn-ghost btn-circle"
            onClick={() => handleDelete(item._id)}
            title="Delete"
          >
            <TrashIcon className="w-4 h-4 text-slate-500 hover:text-error" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sliders</h1>
          <p className="mt-1 text-slate-600">Manage promotional banners for the home screen.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setFormData({ title: '', subtitle: '', imageUrl: '', linkUrl: '', order: 0, isActive: true })
            setShowAddModal(true)
          }}
        >
          <PlusIcon className="w-5 h-5" /> Add Slider
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-0 sm:p-6">
          <DataTable
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="No sliders found"
          />
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || showEditModal.open) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-slate-900">
                {showAddModal ? 'Create Slider' : 'Edit Slider'}
              </h3>
              <button 
                className="btn btn-sm btn-circle btn-ghost" 
                onClick={() => { setShowAddModal(false); setShowEditModal({open: false, slider: null}) }}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {formError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{formError}</div>}
              
              <form id="slider-form" onSubmit={showAddModal ? handleCreate : handleEdit} className="space-y-4">
                <div>
                  <label className="label text-sm font-medium text-slate-700">Image URL</label>
                  <input 
                    type="url" 
                    className="input input-bordered w-full"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                    required
                  />
                  {formData.imageUrl && (
                    <div className="mt-2 text-xs text-slate-500">Preview: <img src={formData.imageUrl} alt="Preview" className="h-10 rounded mt-1 outline outline-1 outline-slate-200" onError={(e) => e.target.style.display = 'none'} /></div>
                  )}
                </div>
                <div>
                  <label className="label text-sm font-medium text-slate-700">Title (Optional)</label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full"
                    placeholder="E.g. Summer Sale"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label text-sm font-medium text-slate-700">Subtitle (Optional)</label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full"
                    placeholder="E.g. Get 20% off all services"
                    value={formData.subtitle}
                    onChange={e => setFormData({...formData, subtitle: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label text-sm font-medium text-slate-700">Link URL (Optional)</label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full"
                    placeholder="E.g. /services/ac-repair"
                    value={formData.linkUrl}
                    onChange={e => setFormData({...formData, linkUrl: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label text-sm font-medium text-slate-700">Display Order</label>
                  <input 
                    type="number" 
                    className="input input-bordered w-full"
                    placeholder="E.g. 1"
                    value={formData.order}
                    onChange={e => setFormData({...formData, order: e.target.value})}
                  />
                </div>
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <span className="label-text font-medium text-slate-700">Active</span> 
                    <input 
                      type="checkbox" 
                      className="toggle toggle-success" 
                      checked={formData.isActive}
                      onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    />
                  </label>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-2 shrink-0 bg-slate-50">
              <button 
                type="button" 
                className="btn btn-ghost" 
                onClick={() => { setShowAddModal(false); setShowEditModal({open: false, slider: null}) }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="slider-form"
                className="btn btn-primary"
                disabled={formLoading}
              >
                {formLoading ? <span className="loading loading-spinner loading-sm" /> : (showAddModal ? 'Create' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
