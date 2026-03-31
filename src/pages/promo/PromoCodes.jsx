import { useEffect, useState, useCallback } from 'react'
import { useApi } from '../../api/client'

const EMPTY_FORM = {
  code: '',
  discountType: 'percent',
  discountValue: '',
  minOrderValue: '',
  maxUses: '',
  validFrom: '',
  validUntil: '',
  isActive: true,
}

function Badge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all'
const selectCls = inputCls

export default function PromoCodes() {
  const api = useApi()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null) // null | 'create' | 'edit'
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/promo/codes')
      setList(res.data?.list ?? [])
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError({})
    setEditTarget(null)
    setModal('create')
  }

  const openEdit = (code) => {
    setForm({
      code: code.code || '',
      discountType: code.discountType || 'percent',
      discountValue: code.discountValue ?? '',
      minOrderValue: code.minOrderValue ?? '',
      maxUses: code.maxUses ?? '',
      validFrom: code.validFrom ? code.validFrom.split('T')[0] : '',
      validUntil: code.validUntil ? code.validUntil.split('T')[0] : '',
      isActive: code.isActive !== false,
    })
    setFormError({})
    setEditTarget(code)
    setModal('edit')
  }

  const validate = () => {
    const errs = {}
    if (!form.code.trim()) errs.code = 'Code is required'
    if (!form.discountValue || isNaN(Number(form.discountValue)) || Number(form.discountValue) <= 0)
      errs.discountValue = 'Enter a valid discount value'
    if (form.discountType === 'percent' && Number(form.discountValue) > 100)
      errs.discountValue = 'Percentage cannot exceed 100'
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setFormError(errs); return }
    setSaving(true)
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: form.minOrderValue !== '' ? Number(form.minOrderValue) : 0,
        maxUses: form.maxUses !== '' ? Number(form.maxUses) : null,
        validFrom: form.validFrom || null,
        validUntil: form.validUntil || null,
        isActive: form.isActive,
      }
      if (modal === 'create') {
        await api.post('/api/admin/promo/codes', payload)
        showToast('Promo code created!')
      } else {
        await api.patch(`/api/admin/promo/codes/${editTarget._id}`, payload)
        showToast('Promo code updated!')
      }
      setModal(null)
      fetchList()
    } catch (err) {
      showToast(err.response?.data?.error || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (code) => {
    try {
      await api.patch(`/api/admin/promo/codes/${code._id}`, { isActive: !code.isActive })
      setList(prev => prev.map(c => c._id === code._id ? { ...c, isActive: !c.isActive } : c))
      showToast(`Code ${!code.isActive ? 'activated' : 'deactivated'}`)
    } catch {
      showToast('Toggle failed', 'error')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/promo/codes/${confirmDelete._id}`)
      showToast('Promo code deleted')
      setConfirmDelete(null)
      fetchList()
    } catch {
      showToast('Delete failed', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const fmt = (v) => v ? new Date(v).toLocaleDateString() : '—'

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-lg text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promo Codes</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage discount codes for customers.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 active:scale-95 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          New Code
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
              <svg className="h-7 w-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <p className="font-semibold text-slate-700">No promo codes yet</p>
            <p className="mt-1 text-sm text-slate-400">Create your first code to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500">
                  {['Code', 'Type', 'Value', 'Min Order', 'Max Uses', 'Used', 'Valid Until', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map(code => (
                  <tr key={code._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-800">{code.code}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{code.discountType}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {code.discountType === 'percent' ? `${code.discountValue}%` : `৳${code.discountValue}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{code.minOrderValue ? `৳${code.minOrderValue}` : '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{code.maxUses || '∞'}</td>
                    <td className="px-4 py-3 text-slate-600">{code.usedCount ?? 0}</td>
                    <td className="px-4 py-3 text-slate-500">{fmt(code.validUntil)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleActive(code)} className="cursor-pointer">
                        <Badge active={code.isActive} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(code)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                        >Edit</button>
                        <button
                          onClick={() => setConfirmDelete(code)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <Modal title={modal === 'create' ? 'New Promo Code' : 'Edit Promo Code'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Code" error={formError.code} required>
                <input className={inputCls} placeholder="e.g. SAVE20" value={form.code}
                  onChange={e => setField('code', e.target.value.toUpperCase())} />
              </Field>
              <Field label="Discount Type" required>
                <select className={selectCls} value={form.discountType} onChange={e => setField('discountType', e.target.value)}>
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (৳)</option>
                </select>
              </Field>
              <Field label="Discount Value" error={formError.discountValue} required>
                <input className={inputCls} type="number" min="0" step="0.01"
                  placeholder={form.discountType === 'percent' ? '0–100' : 'Amount'}
                  value={form.discountValue} onChange={e => setField('discountValue', e.target.value)} />
              </Field>
              <Field label="Min. Order Value (৳)">
                <input className={inputCls} type="number" min="0" placeholder="Optional"
                  value={form.minOrderValue} onChange={e => setField('minOrderValue', e.target.value)} />
              </Field>
              <Field label="Max Uses">
                <input className={inputCls} type="number" min="0" placeholder="Unlimited"
                  value={form.maxUses} onChange={e => setField('maxUses', e.target.value)} />
              </Field>
              <Field label="Valid From">
                <input className={inputCls} type="date"
                  value={form.validFrom} onChange={e => setField('validFrom', e.target.value)} />
              </Field>
              <Field label="Valid Until">
                <input className={inputCls} type="date"
                  value={form.validUntil} onChange={e => setField('validUntil', e.target.value)} />
              </Field>
              <Field label="Status">
                <select className={selectCls} value={form.isActive ? 'true' : 'false'} onChange={e => setField('isActive', e.target.value === 'true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </Field>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModal(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition-all">
                {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                {saving ? 'Saving…' : modal === 'create' ? 'Create Code' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <Modal title="Delete Promo Code" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete the code <strong className="font-mono text-slate-900">{confirmDelete.code}</strong>? This cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setConfirmDelete(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-all">
              {deleting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
