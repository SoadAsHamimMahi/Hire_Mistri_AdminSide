import { useState } from 'react'
import { useApi } from '../../api/client'

export default function DatabaseBackup() {
  const api = useApi()
  const [triggering, setTriggering] = useState(false)
  const [result, setResult] = useState(null)
  
  const handleTriggerBackup = async () => {
    setTriggering(true)
    setResult(null)
    try {
      const res = await api.post('/api/admin/system/backup')
      setResult({ type: 'success', text: res.data.message || 'Backup triggered successfully.' })
    } catch (err) {
      setResult({ type: 'error', text: err.response?.data?.error || 'Failed to trigger backup.' })
    } finally {
      setTriggering(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Database Backup</h1>
        <p className="mt-1 text-sm text-slate-500">Manage and trigger point-in-time snapshots of the platform database.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 text-3xl">
            🗄️
          </div>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Manual Snapshot Trigger</h2>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                By default, MongoDB Atlas automatically handles continuous backups and point-in-time recovery. 
                Triggering a manual backup here will log an event in the Admin Audit logs, and if a connected 
                webhook or script is configured, it will initiate a cold storage dump (e.g. AWS S3).
              </p>
            </div>
            
            {result && (
              <div className={`rounded-xl px-4 py-3 text-sm font-medium ${result.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                {result.type === 'error' ? '❌ ' : '✅ '}{result.text}
              </div>
            )}

            <button
              onClick={handleTriggerBackup}
              disabled={triggering}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 transition-all font-mono"
            >
              {triggering ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Requesting Snapshot...</>
              ) : (
                '▶ Trigger Backup Now'
              )}
            </button>
            <p className="text-xs text-slate-400">Rate limited to prevent abuse. Check Audit Logs for history.</p>
          </div>
        </div>
      </div>
      
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 flex flex-col items-center justify-center text-center space-y-2">
         <span className="text-2xl opacity-50">☁️</span>
         <h3 className="font-semibold text-blue-900">Automated Cloud Backups Active</h3>
         <p className="text-sm text-blue-700 max-w-md">Your database cluster is currently protected by automated cloud backups. To restore a previous state, please visit your MongoDB Atlas console.</p>
      </div>
    </div>
  )
}
