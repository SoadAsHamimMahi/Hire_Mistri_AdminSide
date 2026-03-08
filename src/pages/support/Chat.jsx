import { useEffect, useState, useRef } from 'react'
import { useApi } from '../../api/client'

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString()
}

const formatMessageTime = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Chat() {
  const api = useApi()
  const [tab, setTab] = useState('client') // client | worker
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // '' | open | closed
  const [tickets, setTickets] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [errorTickets, setErrorTickets] = useState(null)

  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingThread, setLoadingThread] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [actionError, setActionError] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoadingTickets(true)
      setErrorTickets(null)
      try {
        const params = { page, limit }
        if (tab) params.role = tab
        if (statusFilter) params.status = statusFilter
        if (search.trim()) params.q = search.trim()
        const res = await api.get('/api/admin/support/tickets', { params })
        if (!cancelled) {
          setTickets(res.data?.list ?? [])
          setTotal(res.data?.total ?? 0)
        }
      } catch (err) {
        if (!cancelled) setErrorTickets(err.response?.data?.error || err.message)
      } finally {
        if (!cancelled) setLoadingTickets(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [tab, page, statusFilter, search])

  useEffect(() => {
    if (!selectedTicketId) {
      setTicket(null)
      setMessages([])
      return
    }
    let cancelled = false
    const run = async () => {
      setLoadingThread(true)
      setActionError(null)
      try {
        const res = await api.get(`/api/admin/support/tickets/${selectedTicketId}/messages`)
        if (!cancelled) {
          setTicket(res.data?.ticket ?? null)
          setMessages(res.data?.messages ?? [])
        }
      } catch (err) {
        if (!cancelled) setActionError(err.response?.data?.error || err.message)
      } finally {
        if (!cancelled) setLoadingThread(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [selectedTicketId])

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedTicketId || sending || ticket?.status === 'closed') return
    setSending(true)
    setActionError(null)
    try {
      const res = await api.post(`/api/admin/support/tickets/${selectedTicketId}/messages`, { message: replyText.trim() })
      if (res.data?.message) {
        setMessages((prev) => [...prev, res.data.message])
        setTicket((t) => (t ? { ...t, lastMessagePreview: replyText.trim().slice(0, 80), lastMessageAt: res.data.message.createdAt } : null))
      }
      setReplyText('')
    } catch (err) {
      setActionError(err.response?.data?.error || err.message)
    } finally {
      setSending(false)
    }
  }

  const handleCloseReopen = async (newStatus) => {
    if (!selectedTicketId) return
    setActionError(null)
    try {
      await api.patch(`/api/admin/support/tickets/${selectedTicketId}`, { status: newStatus })
      setTicket((t) => (t ? { ...t, status: newStatus } : null))
      setTickets((prev) => prev.map((t) => (t._id === selectedTicketId ? { ...t, status: newStatus } : t)))
    } catch (err) {
      setActionError(err.response?.data?.error || err.message)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Support Chat</h1>
        <p className="mt-1 text-slate-600">Reply to customer and provider tickets.</p>
      </div>

      <div className="flex gap-4 rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden" style={{ minHeight: '560px' }}>
        {/* Left: tabs + search + ticket list */}
        <div className="w-80 lg:w-96 flex flex-col border-r border-slate-200 bg-slate-50">
          <div className="p-3 border-b border-slate-200 bg-white">
            <div className="flex rounded-lg overflow-hidden border border-slate-200">
              <button
                type="button"
                onClick={() => { setTab('client'); setPage(1); setSelectedTicketId(null) }}
                className={`flex-1 py-2 text-sm font-medium ${tab === 'client' ? 'bg-primary text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => { setTab('worker'); setPage(1); setSelectedTicketId(null) }}
                className={`flex-1 py-2 text-sm font-medium ${tab === 'worker' ? 'bg-primary text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                Provider
              </button>
            </div>
            <div className="mt-2">
              <input
                type="text"
                placeholder="Search..."
                className="input input-bordered w-full input-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <div className="mt-2">
              <select
                className="select select-bordered select-sm w-full"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              >
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {errorTickets && (
              <div className="p-3 text-sm text-red-600">{errorTickets}</div>
            )}
            {loadingTickets ? (
              <div className="p-4 text-center">
                <span className="loading loading-spinner loading-sm" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">No tickets</div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {tickets.map((t) => (
                  <li key={t._id}>
                    <button
                      type="button"
                      onClick={() => setSelectedTicketId(t._id)}
                      className={`w-full text-left p-3 hover:bg-slate-100 transition-colors ${selectedTicketId === t._id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900 truncate">{t.subject}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{t.lastMessagePreview || '—'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400">{formatTime(t.lastMessageAt)}</span>
                            <span className={`badge badge-sm ${t.status === 'open' ? 'badge-success' : 'badge-ghost'}`}>
                              {t.status}
                            </span>
                          </div>
                        </div>
                        {(t.unreadForAdmin || 0) > 0 && (
                          <span className="badge badge-primary badge-sm">{t.unreadForAdmin > 9 ? '9+' : t.unreadForAdmin}</span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: thread + reply */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {!selectedTicketId ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              Select a ticket from the list
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <div className="min-w-0">
                  <h2 className="font-semibold text-slate-900 truncate">{ticket?.subject ?? 'Ticket'}</h2>
                  <p className="text-xs text-slate-500">User ID: {ticket?.userId ?? '—'} · Status: <span className={ticket?.status === 'open' ? 'text-green-600' : ''}>{ticket?.status ?? '—'}</span></p>
                </div>
                <div className="flex gap-2">
                  {ticket?.status === 'open' ? (
                    <button type="button" className="btn btn-sm btn-ghost text-error" onClick={() => handleCloseReopen('closed')}>
                      Close ticket
                    </button>
                  ) : (
                    <button type="button" className="btn btn-sm btn-ghost text-success" onClick={() => handleCloseReopen('open')}>
                      Reopen
                    </button>
                  )}
                </div>
              </div>

              {actionError && <div className="px-3 py-2 text-sm text-red-600 bg-red-50">{actionError}</div>}

              {loadingThread ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className="loading loading-spinner loading-md" />
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {messages.map((msg) => {
                      const isAdmin = msg.senderType === 'admin'
                      return (
                        <div key={msg._id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-lg p-3 ${isAdmin ? 'bg-primary text-primary-content' : 'bg-slate-100 text-slate-900 border border-slate-200'}`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                            <p className="text-xs mt-1 opacity-80">{formatMessageTime(msg.createdAt)} {isAdmin ? '(You)' : '(User)'}</p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {ticket?.status === 'closed' ? (
                    <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-slate-500 text-sm">
                      Ticket is closed. Reopen to reply.
                    </div>
                  ) : (
                    <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input input-bordered flex-1"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply..."
                          disabled={sending}
                        />
                        <button type="submit" className="btn btn-primary" disabled={!replyText.trim() || sending}>
                          {sending ? <span className="loading loading-spinner loading-sm" /> : 'Send'}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
