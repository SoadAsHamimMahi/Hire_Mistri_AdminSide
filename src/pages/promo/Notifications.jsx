import { useEffect, useState, useCallback } from 'react'
import { useApi } from '../../api/client'

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users', icon: '👥', desc: 'Send to everyone on the platform' },
  { value: 'clients', label: 'Clients Only', icon: '🧑‍💼', desc: 'Users who post jobs' },
  { value: 'workers', label: 'Workers Only', icon: '🔧', desc: 'Service providers / workers' },
]
const TYPE_OPTIONS = [
  { value: 'info', label: 'Info', color: 'bg-blue-100 text-blue-700' },
  { value: 'success', label: 'Success', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'warning', label: 'Warning', color: 'bg-amber-100 text-amber-700' },
  { value: 'error', label: 'Alert', color: 'bg-red-100 text-red-700' },
]

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all'

export default function Notifications() {
  const api = useApi()

  // Form state
  const [form, setForm] = useState({ title: '', message: '', type: 'info', targetAudience: 'all' })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null) // { sentCount } | null
  const [formError, setFormError] = useState({})

  // History
  const [history, setHistory] = useState([])
  const [histLoading, setHistLoading] = useState(true)
  const [histPage, setHistPage] = useState(1)
  const [histTotal, setHistTotal] = useState(0)
  const LIMIT = 10

  const fetchHistory = useCallback(async (page = 1) => {
    setHistLoading(true)
    try {
      const res = await api.get('/api/admin/promo/notifications', { page, limit: LIMIT })
      setHistory(res.data?.list ?? [])
      setHistTotal(res.data?.total ?? 0)
    } catch { /* silent */ }
    finally { setHistLoading(false) }
  }, [])

  useEffect(() => { fetchHistory(histPage) }, [histPage])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.message.trim()) errs.message = 'Message is required'
    return errs
  }

  const handleSend = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setFormError(errs); return }
    setSending(true)
    setResult(null)
    try {
      const res = await api.post('/api/admin/promo/notifications/broadcast', form)
      setResult({ sentCount: res.data.sentCount })
      setForm({ title: '', message: '', type: 'info', targetAudience: 'all' })
      setFormError({})
      fetchHistory(1)
      setHistPage(1)
    } catch (err) {
      setResult({ error: err.response?.data?.error || 'Broadcast failed' })
    } finally {
      setSending(false)
    }
  }

  const typeOpt = (val) => TYPE_OPTIONS.find(t => t.value === val) || TYPE_OPTIONS[0]
  const audienceOpt = (val) => AUDIENCE_OPTIONS.find(a => a.value === val) || AUDIENCE_OPTIONS[0]
  const totalPages = Math.ceil(histTotal / LIMIT)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">Broadcast in-app notifications to users in real-time.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Compose Panel */}
        <div className="lg:col-span-3 space-y-5">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600 text-sm">📣</span>
              Compose Broadcast
            </h2>

            {/* Audience */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Target Audience</label>
              <div className="grid grid-cols-3 gap-2">
                {AUDIENCE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setField('targetAudience', opt.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all ${
                      form.targetAudience === opt.value
                        ? 'border-violet-500 bg-violet-50 shadow-sm'
                        : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/50'
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className={`text-xs font-semibold ${form.targetAudience === opt.value ? 'text-violet-700' : 'text-slate-600'}`}>{opt.label}</span>
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-slate-400">{audienceOpt(form.targetAudience).desc}</p>
            </div>

            {/* Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Notification Type</label>
              <div className="flex gap-2 flex-wrap">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setField('type', opt.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      form.type === opt.value ? opt.color + ' ring-2 ring-offset-1 ring-violet-400' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                className={inputCls}
                placeholder="e.g. Platform Maintenance Tonight"
                value={form.title}
                maxLength={120}
                onChange={e => { setField('title', e.target.value); setFormError(f => ({ ...f, title: null })) }}
              />
              {formError.title && <p className="mt-1 text-xs text-red-600">{formError.title}</p>}
            </div>

            {/* Message */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                className={inputCls + ' resize-none'}
                rows={4}
                placeholder="Write your notification message here…"
                value={form.message}
                maxLength={500}
                onChange={e => { setField('message', e.target.value); setFormError(f => ({ ...f, message: null })) }}
              />
              <div className="mt-1 flex justify-between">
                {formError.message ? <p className="text-xs text-red-600">{formError.message}</p> : <span />}
                <span className="text-xs text-slate-400">{form.message.length}/500</span>
              </div>
            </div>

            {/* Result */}
            {result && (
              <div className={`rounded-xl px-4 py-3 text-sm font-medium ${result.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                {result.error ? `❌ ${result.error}` : `✅ Broadcast sent to ${result.sentCount} user${result.sentCount !== 1 ? 's' : ''}!`}
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60 active:scale-[0.98] transition-all"
            >
              {sending ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Sending…</>
              ) : (
                '📣 Send Broadcast'
              )}
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-3 sticky top-6">
            <h2 className="font-semibold text-slate-800 text-sm">Preview</h2>
            <div className={`rounded-xl border p-4 ${
              form.type === 'success' ? 'border-emerald-200 bg-emerald-50' :
              form.type === 'warning' ? 'border-amber-200 bg-amber-50' :
              form.type === 'error' ? 'border-red-200 bg-red-50' :
              'border-blue-200 bg-blue-50'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">
                  {form.type === 'success' ? '✅' : form.type === 'warning' ? '⚠️' : form.type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <div className="min-w-0">
                  <p className={`font-semibold text-sm ${
                    form.type === 'success' ? 'text-emerald-800' :
                    form.type === 'warning' ? 'text-amber-800' :
                    form.type === 'error' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>{form.title || 'Notification Title'}</p>
                  <p className={`mt-0.5 text-xs ${
                    form.type === 'success' ? 'text-emerald-700' :
                    form.type === 'warning' ? 'text-amber-700' :
                    form.type === 'error' ? 'text-red-700' :
                    'text-blue-700'
                  }`}>{form.message || 'Notification message will appear here…'}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span>→</span> Will reach: <strong className="text-slate-600">{audienceOpt(form.targetAudience).label}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Broadcast History */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Broadcast History</h2>
          <span className="text-xs text-slate-400">{histTotal} total</span>
        </div>
        {histLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No broadcasts sent yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((item, i) => {
              const t = typeOpt(item.type)
              const a = audienceOpt(item.targetAudience)
              return (
                <div key={item._id || i} className="flex items-start justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`mt-0.5 flex-shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold ${t.color}`}>{t.label}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-800 truncate">{item.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 truncate">{item.message}</p>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 text-right">
                    <p className="text-xs font-medium text-slate-600">{a.icon} {a.label}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{item.sentCount ?? 0} users</p>
                    <p className="mt-0.5 text-xs text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
            <span className="text-xs text-slate-400">Page {histPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={histPage <= 1} onClick={() => setHistPage(p => p - 1)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors">← Prev</button>
              <button disabled={histPage >= totalPages} onClick={() => setHistPage(p => p + 1)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
