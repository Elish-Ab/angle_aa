import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { Phone, AlertTriangle, Clock, CheckCircle } from 'lucide-react'

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  open:               { label: 'Open',             cls: 'badge-blue' },
  escalating:         { label: 'Escalating',       cls: 'badge-orange' },
  retrying:           { label: 'Retrying',         cls: 'badge-orange' },
  resolved:           { label: 'Resolved',         cls: 'badge-green' },
  escalation_failed:  { label: 'Failed',           cls: 'badge-red' },
  callback_requested: { label: 'Callback',         cls: 'badge-gray' },
}

export default async function IncidentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('organization_id').eq('id', user.id).single()
  const orgId = userData?.organization_id
  if (!orgId) redirect('/dashboard')

  const [incidentRes, callLogRes] = await Promise.all([
    supabase.from('incidents').select('*').eq('organization_id', orgId)
      .order('created_at', { ascending: false }).limit(50),
    supabase.from('call_logs').select('*').eq('organization_id', orgId)
      .order('created_at', { ascending: false }).limit(50),
  ])

  const incidents = incidentRes.data ?? []
  const callLogs  = callLogRes.data ?? []

  const resolved   = incidents.filter(i => i.status === 'resolved').length
  const failed     = incidents.filter(i => i.status === 'escalation_failed').length
  const open       = incidents.filter(i => !['resolved','escalation_failed'].includes(i.status)).length
  const totalCalls = callLogs.length

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="font-serif text-navy text-3xl mb-1">Incidents & calls</h1>
        <p className="text-gray-500 text-sm">Every call your AI receptionist has handled.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total calls', value: totalCalls, icon: Phone, color: 'text-blue-500' },
          { label: 'Open incidents', value: open, icon: AlertTriangle, color: 'text-orange-500' },
          { label: 'Resolved', value: resolved, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Escalation failed', value: failed, icon: Clock, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="font-serif text-navy text-2xl">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Incidents table */}
      <div className="card mb-8">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900 text-sm">Incidents</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {['Caller', 'Issue', 'Choice', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {incidents.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">No incidents yet</td></tr>
              ) : incidents.map(inc => {
                const st = STATUS_MAP[inc.status] ?? { label: inc.status, cls: 'badge-gray' }
                return (
                  <tr key={inc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900">{inc.caller_name || '—'}</div>
                      <div className="text-xs text-gray-400">{inc.caller_phone}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-gray-700 max-w-xs truncate">{inc.issue_summary || '—'}</div>
                      <div className="text-xs text-gray-400 capitalize">{inc.issue_category?.replace('_', ' ')}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={inc.customer_choice === 'EMERGENCY_NOW' ? 'badge-red' : 'badge-gray'}>
                        {inc.customer_choice === 'EMERGENCY_NOW' ? '🚨 Emergency' : inc.customer_choice === 'NEXT_AVAILABLE' ? '📅 Callback' : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={st.cls}>{st.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {format(new Date(inc.created_at), 'MMM d, h:mm a')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Call logs */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900 text-sm">Call log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {['Call ID', 'Type', 'From', 'Duration', 'Date'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {callLogs.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">No calls yet</td></tr>
              ) : callLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{log.retell_call_id?.substring(0, 18)}…</td>
                  <td className="px-5 py-3.5">
                    <span className={log.call_type === 'inbound' ? 'badge-blue' : 'badge-orange'}>
                      {log.call_type === 'inbound' ? '↙ Inbound' : '↗ Escalation'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{log.from_number || log.caller_name || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {log.duration_seconds ? `${Math.ceil(log.duration_seconds / 60)} min` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {format(new Date(log.created_at), 'MMM d, h:mm a')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
