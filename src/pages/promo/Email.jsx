import { useEffect, useState, useCallback } from 'react'
import { useApi } from '../../api/client'

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users', icon: '👥', desc: 'Send to all registered users' },
  { value: 'clients', label: 'Clients Only', icon: '🧑‍💼', desc: 'Users who post jobs' },
  { value: 'workers', label: 'Workers Only', icon: '🔧', desc: 'Service providers / workers' },
]

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all'

const TEMPLATES = [
  {
    label: 'Weekly Deals',
    subject: '🎉 This Week\'s Exclusive Deals on Hire Mistri',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px; border-radius: 12px;">
  <h2 style="color: #7C3AED; text-align: center;">🎉 Exclusive Deals Just for You!</h2>
  <p style="color: #374151;">Hi there,</p>
  <p style="color: #374151;">Don't miss out on this week's special offers on Hire Mistri. Book a service today and save!</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="#" style="background: #7C3AED; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Browse Services →</a>
  </div>
  <p style="color: #9CA3AF; font-size: 12px; text-align: center;">Hire Mistri — Connecting clients with skilled workers.</p>
</div>`,
  },
  {
    label: 'Promo Code',
    subject: '🏷️ Your Exclusive Promo Code Inside!',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px; border-radius: 12px;">
  <h2 style="color: #7C3AED; text-align: center;">🏷️ Special Discount for You!</h2>
  <p style="color: #374151;">Hi there,</p>
  <p style="color: #374151;">We have a special promo code just for you:</p>
  <div style="background: white; border: 2px dashed #7C3AED; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
    <p style="font-size: 28px; font-weight: bold; color: #7C3AED; letter-spacing: 4px; margin: 0;">SAVE20</p>
    <p style="color: #6B7280; font-size: 12px; margin-top: 8px;">20% off your next booking</p>
  </div>
  <p style="color: #9CA3AF; font-size: 12px; text-align: center;">Hire Mistri — Connecting clients with skilled workers.</p>
</div>`,
  },
  {
    label: 'Platform Update',
    subject: '📢 Important Update from Hire Mistri',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px; border-radius: 12px;">
  <h2 style="color: #374151;">📢 Platform Update</h2>
  <p style="color: #374151;">Hi there,</p>
  <p style="color: #374151;">We have an important update to share with you regarding our platform...</p>
  <p style="color: #374151;">Thank you for being a valued member of the Hire Mistri community.</p>
  <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px;">Hire Mistri — Connecting clients with skilled workers.</p>
</div>`,
  },
]

const STATUS_BADGE = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  partial: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  failed: 'bg-red-50 text-red-700 ring-1 ring-red-200',
}

export default function Email() {
  const api = useApi()

  // Form state
  const [form, setForm] = useState({ subject: '', htmlBody: '', targetAudience: 'all' })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [formError, setFormError] = useState({})
  const [showPreview, setShowPreview] = useState(false)

  // History
  const [history, setHistory] = useState([])
  const [histLoading, setHistLoading] = useState(true)
  const [histPage, setHistPage] = useState(1)
  const [histTotal, setHistTotal] = useState(0)
  const LIMIT = 10

  const fetchHistory = useCallback(async (page = 1) => {
    setHistLoading(true)
    try {
      const res = await api.get('/api/admin/promo/email', { page, limit: LIMIT })
      setHistory(res.data?.list ?? [])
      setHistTotal(res.data?.total ?? 0)
    } catch { /* silent */ }
    finally { setHistLoading(false) }
  }, [])

  useEffect(() => { fetchHistory(histPage) }, [histPage])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const applyTemplate = (tpl) => {
    setForm(f => ({ ...f, subject: tpl.subject, htmlBody: tpl.body }))
    setFormError({})
  }

  const validate = () => {
    const errs = {}
    if (!form.subject.trim()) errs.subject = 'Subject is required'
    if (!form.htmlBody.trim()) errs.htmlBody = 'Email body is required'
    return errs
  }

  const handleSend = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setFormError(errs); return }
    setSending(true)
    setResult(null)
    try {
      const res = await api.post('/api/admin/promo/email/send', form)
      setResult({ sentCount: res.data.sentCount, failCount: res.data.failCount, total: res.data.totalTargeted })
      setForm({ subject: '', htmlBody: '', targetAudience: 'all' })
      setFormError({})
      fetchHistory(1)
      setHistPage(1)
    } catch (err) {
      setResult({ error: err.response?.data?.error || 'Send failed' })
    } finally {
      setSending(false)
    }
  }

  const totalPages = Math.ceil(histTotal / LIMIT)
  const audienceOpt = (val) => AUDIENCE_OPTIONS.find(a => a.value === val) || AUDIENCE_OPTIONS[0]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Email Campaigns</h1>
        <p className="mt-1 text-sm text-slate-500">Send bulk email campaigns to users via SendGrid.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Compose */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600 text-sm">✉️</span>
              Compose Campaign
            </h2>
            <button
              onClick={() => setShowPreview(p => !p)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>

          {/* Templates */}
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Quick Templates</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map(tpl => (
                <button
                  key={tpl.label}
                  onClick={() => applyTemplate(tpl)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-all"
                >{tpl.label}</button>
              ))}
            </div>
          </div>

          <div className={`grid gap-6 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Form fields */}
            <div className="space-y-4">
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
              </div>

              {/* Subject */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Subject Line <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputCls}
                  placeholder="e.g. 🎉 Exclusive offer inside!"
                  value={form.subject}
                  onChange={e => { setField('subject', e.target.value); setFormError(f => ({ ...f, subject: null })) }}
                />
                {formError.subject && <p className="mt-1 text-xs text-red-600">{formError.subject}</p>}
              </div>

              {/* Body */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  HTML Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  className={inputCls + ' resize-none font-mono text-xs'}
                  rows={12}
                  placeholder="<div>Your HTML email content here…</div>"
                  value={form.htmlBody}
                  onChange={e => { setField('htmlBody', e.target.value); setFormError(f => ({ ...f, htmlBody: null })) }}
                />
                {formError.htmlBody && <p className="mt-1 text-xs text-red-600">{formError.htmlBody}</p>}
              </div>
            </div>

            {/* Email Preview */}
            {showPreview && (
              <div>
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email Preview</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{form.subject || '(No subject)'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">To: {audienceOpt(form.targetAudience).label}</p>
                  </div>
                  <div className="p-4 min-h-[300px]">
                    {form.htmlBody ? (
                      <div
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: form.htmlBody }}
                      />
                    ) : (
                      <p className="text-slate-400 text-sm">Start typing your HTML to see a preview…</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${result.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {result.error
                ? `❌ ${result.error}`
                : `✅ Campaign sent! ${result.sentCount} delivered${result.failCount > 0 ? `, ${result.failCount} failed` : ''} out of ${result.total} targeted.`
              }
            </div>
          )}

          {/* Warning */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
            <span className="text-amber-500 flex-shrink-0 mt-0.5">⚠️</span>
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> Sending to "All Users" will email every registered user. Requires SendGrid to be configured via <code className="bg-amber-100 px-1 rounded">SENDGRID_API_KEY</code> in your server environment.
            </p>
          </div>

          <button
            onClick={handleSend}
            disabled={sending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {sending ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Sending Campaign…</>
            ) : (
              '📧 Send Email Campaign'
            )}
          </button>
        </div>

        {/* Campaign History */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Campaign History</h2>
            <span className="text-xs text-slate-400">{histTotal} campaigns sent</span>
          </div>
          {histLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No campaigns sent yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500">
                    {['Subject', 'Audience', 'Sent', 'Failed', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((item, i) => {
                    const a = audienceOpt(item.targetAudience)
                    const statusCls = STATUS_BADGE[item.status] || STATUS_BADGE.success
                    return (
                      <tr key={item._id || i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 max-w-[240px]">
                          <p className="font-medium text-slate-800 truncate">{item.subject}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-slate-600">{a.icon} {a.label}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-700">{item.sentCount ?? 0}</td>
                        <td className="px-4 py-3 font-semibold text-red-600">{item.failCount ?? 0}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusCls}`}>
                            {item.status || 'success'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
    </div>
  )
}
