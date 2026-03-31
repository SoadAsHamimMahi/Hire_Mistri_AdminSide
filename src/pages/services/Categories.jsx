import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import { PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline'

export default function Categories() {
  const api = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState({ open: false, category: null })
  
  // Forms
  const [formData, setFormData] = useState({ name: '', slug: '', isActive: true })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState(null)

  // Status Action State
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const fetchCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      // Categories API returns the full list in `list` without pagination currently
      const res = await api.get('/api/admin/categories')
      setList(res.data?.list ?? [])
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleToggleActive = async (id, currentStatus) => {
    setActionLoadingId(id)
    try {
      await api.patch(`/api/admin/categories/${id}`, { isActive: !currentStatus })
      setList(list.map(item => item._id === id ? { ...item, isActive: !currentStatus } : item))
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.error || err.message))
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)
    try {
      await api.post('/api/admin/categories', formData)
      setShowAddModal(false)
      setFormData({ name: '', slug: '', isActive: true })
      fetchCategories()
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
      await api.patch(`/api/admin/categories/${showEditModal.category._id}`, formData)
      setShowEditModal({ open: false, category: null })
      fetchCategories()
    } catch (err) {
      setFormError(err.response?.data?.error || err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const openEdit = (category) => {
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      isActive: category.isActive
    })
    setShowEditModal({ open: true, category })
  }

  const columns = [
    { key: 'name', label: 'Name', render: (v) => <span className="font-medium text-slate-900">{v}</span> },
    { key: 'slug', label: 'Slug', render: (v) => <span className="text-xs font-mono text-slate-500">{v}</span> },
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
        <button 
          className="btn btn-xs btn-ghost btn-circle"
          onClick={() => openEdit(item)}
        >
          <PencilSquareIcon className="w-4 h-4 text-slate-500 hover:text-primary" />
        </button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories Management</h1>
          <p className="mt-1 text-slate-600">Add, edit, and toggle service categories.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({ name: '', slug: '', isActive: true })
              setShowAddModal(true)
            }}
          >
            <PlusIcon className="w-5 h-5" /> Add Category
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-0 sm:p-6">
          <DataTable
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="No categories found"
          />
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || showEditModal.open) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-slate-900">
                {showAddModal ? 'Create Category' : 'Edit Category'}
              </h3>
              <button 
                className="btn btn-sm btn-circle btn-ghost" 
                onClick={() => { setShowAddModal(false); setShowEditModal({open: false, category: null}) }}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {formError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{formError}</div>}
              
              <form id="category-form" onSubmit={showAddModal ? handleCreate : handleEdit} className="space-y-4">
                <div>
                  <label className="label text-sm font-medium text-slate-700">Name</label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full"
                    placeholder="E.g. Plumbing"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="label text-sm font-medium text-slate-700">Slug (optional)</label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full font-mono text-sm"
                    placeholder="E.g. plumbing (auto-generated if empty)"
                    value={formData.slug}
                    onChange={e => setFormData({...formData, slug: e.target.value})}
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
                onClick={() => { setShowAddModal(false); setShowEditModal({open: false, category: null}) }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="category-form"
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
