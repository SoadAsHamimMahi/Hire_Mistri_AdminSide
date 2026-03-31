import { useEffect, useState } from 'react'
import { useApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import { PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline'

export default function ServiceList() {
  const api = useApi()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState({ open: false, service: null })
  
  // Forms
  const [formData, setFormData] = useState({ name: '', slug: '', categoryId: '', description: '', isActive: true })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState(null)

  // Status Action State
  const [actionLoadingId, setActionLoadingId] = useState(null)

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchServices = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/services', { page, limit })
      setList(res.data?.list ?? [])
      setTotal(res.data?.total ?? 0)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [page])

  const handleToggleActive = async (id, currentStatus) => {
    setActionLoadingId(id)
    try {
      await api.patch(`/api/admin/services/${id}`, { isActive: !currentStatus })
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
      await api.post('/api/admin/services', formData)
      setShowAddModal(false)
      setFormData({ name: '', slug: '', categoryId: '', description: '', isActive: true })
      fetchServices()
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
      await api.patch(`/api/admin/services/${showEditModal.service._id}`, formData)
      setShowEditModal({ open: false, service: null })
      fetchServices()
    } catch (err) {
      setFormError(err.response?.data?.error || err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleBulkUpdate = async (isActive) => {
    if (selectedIds.size === 0) return
    if (!window.confirm(`Mark ${selectedIds.size} services as ${isActive ? 'Active' : 'Inactive'}?`)) return
    
    setBulkLoading(true)
    try {
      await api.post('/api/admin/services/bulk', {
        ids: Array.from(selectedIds),
        update: { isActive }
      })
      setSelectedIds(new Set())
      fetchServices()
    } catch (err) {
      alert('Bulk update failed: ' + (err.response?.data?.error || err.message))
    } finally {
      setBulkLoading(false)
    }
  }

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) newSelected.delete(id)
    else newSelected.add(id)
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === list.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(list.map(i => i._id)))
  }

  const openEdit = (service) => {
    setFormData({
      name: service.name || '',
      slug: service.slug || '',
      categoryId: service.categoryId || '',
      description: service.description || '',
      isActive: service.isActive
    })
    setShowEditModal({ open: true, service })
  }

  const columns = [
    {
      key: 'select',
      label: (
        <input 
          type="checkbox" 
          className="checkbox checkbox-sm" 
          checked={list.length > 0 && selectedIds.size === list.length}
          onChange={toggleSelectAll}
        />
      ),
      render: (_, item) => (
        <input 
          type="checkbox" 
          className="checkbox checkbox-sm"
          checked={selectedIds.has(item._id)}
          onChange={() => toggleSelect(item._id)}
        />
      )
    },
    { key: 'name', label: 'Name', render: (v) => <span className="font-medium text-slate-900">{v}</span> },
    { key: 'slug', label: 'Slug', render: (v) => <span className="text-xs font-mono text-slate-500">{v}</span> },
    { key: 'categoryId', label: 'Category', render: (v) => <span className="text-sm">{v || '-'}</span> },
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
          <h1 className="text-2xl font-bold text-slate-900">Services Details</h1>
          <p className="mt-1 text-slate-600">Add, edit, and manage system services.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-neutral m-1">
                {bulkLoading ? <span className="loading loading-spinner loading-sm" /> : `Bulk Modify (${selectedIds.size})`}
              </label>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 border border-slate-200">
                <li><button onClick={() => handleBulkUpdate(true)}>Mark Active</button></li>
                <li><button onClick={() => handleBulkUpdate(false)}>Mark Inactive</button></li>
              </ul>
            </div>
          )}
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({ name: '', slug: '', categoryId: '', description: '', isActive: true })
              setShowAddModal(true)
            }}
          >
            <PlusIcon className="w-5 h-5" /> Add Service
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
            emptyMessage="No services found"
          />
          <div className="p-4 border-t border-slate-100 mt-4">
            <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || showEditModal.open) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-slate-900">
                {showAddModal ? 'Create New Service' : 'Edit Service'}
              </h3>
              <button 
                className="btn btn-sm btn-circle btn-ghost" 
                onClick={() => { setShowAddModal(false); setShowEditModal({open: false, service: null}) }}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {formError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{formError}</div>}
              
              <form id="service-form" onSubmit={showAddModal ? handleCreate : handleEdit} className="space-y-4">
                <div>
                  <label className="label text-sm font-medium text-slate-700">Name</label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full"
                    placeholder="E.g. AC Repair"
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
                    placeholder="E.g. ac-repair (auto-generated if empty)"
                    value={formData.slug}
                    onChange={e => setFormData({...formData, slug: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label text-sm font-medium text-slate-700">Category ID</label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full font-mono text-sm"
                    value={formData.categoryId}
                    onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label text-sm font-medium text-slate-700">Description</label>
                  <textarea 
                    className="textarea textarea-bordered w-full h-24"
                    placeholder="Description of the service..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
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
                onClick={() => { setShowAddModal(false); setShowEditModal({open: false, service: null}) }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="service-form"
                className="btn btn-primary"
                disabled={formLoading}
              >
                {formLoading ? <span className="loading loading-spinner loading-sm" /> : (showAddModal ? 'Create' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
