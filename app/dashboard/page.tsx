import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Phone, AlertTriangle, Clock, TrendingUp, CheckCircle, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const orgId = userData?.organization_id

  // If no org linked yet, show setup prompt
  if (!orgId) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🪄</div>
          <h2 className="font-serif text-navy text-xl mb-2">No account linked yet</h2>
          <p className="text-gray-500 text-sm mb-6">
            Complete your onboarding to activate your AI receptionist.
            Your account will appear here automatically after setup.
          </p>
          <a href="https://warm-pavlova-65e1a6.netlify.app/"
            className="btn-primary inline-block">
            Complete setup →
          </a>
        </div>
      </div>
    )
  }

  // Fetch all dashboard data in parallel
  const [orgRes, agentRes, phoneRes, incidentRes, usageRes] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', orgId).single(),
    supabase.from('agents').select('*').eq('organization_id', orgId).single(),
    supabase.from('phone_numbers').select('*').eq('organization_id', orgId).eq('status', 'assigned').single(),
    supabase.from('incidents').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(5),
    supabase.from('call_usage').select('quantity_seconds, usage_type').eq('organization_id', orgId)
      .eq('billing_period', new Date().toISOString().substring(0, 7)),
  ])

  const org      = orgRes.data
  const agent    = agentRes.data
  const phone    = phoneRes.data
  const incidents = incidentRes.data ?? []
  const usage    = usageRes.data ?? []

  const totalMinutes = Math.ceil(
    usage.reduce((sum, r) => sum + (r.quantity_seconds ?? 0), 0) / 60
  )
  const inboundMinutes = Math.ceil(
    usage.filter(r => r.usage_type === 'inbound_intake_minutes')
      .reduce((sum, r) => sum + (r.quantity_seconds ?? 0), 0) / 60
  )
  const outboundMinutes = Math.ceil(
    usage.filter(r => r.usage_type === 'outbound_escalation_minutes')
      .reduce((sum, r) => sum + (r.quantity_seconds ?? 0), 0) / 60
  )
  const openIncidents = incidents.filter(i => !['resolved','escalation_failed'].includes(i.status)).length

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      open: 'badge-blue', escalating: 'badge-orange', retrying: 'badge-orange',
      resolved: 'badge-green', escalation_failed: 'badge-red', callback_requested: 'badge-gray',
    }
    return map[s] ?? 'badge-gray'
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-navy text-3xl mb-1">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋
        </h1>
        <p className="text-gray-500 text-sm">Here's what's happening with {org?.business_name}.</p>
      </div>

      {/* Status bar */}
      <div className="card p-4 mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-700">Receptionist active</span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Phone className="w-3.5 h-3.5" />
          <span>{phone?.number ?? 'No number'}</span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Agent: <span className="font-mono text-xs text-gray-400">{agent?.retell_agent_id?.substring(0, 16)}…</span></span>
        </div>
        <div className="ml-auto">
          <span className={`${org?.workflow_status === 'active' ? 'badge-green' : 'badge-orange'}`}>
            {org?.workflow_status === 'active' ? '● Active' : '● ' + org?.workflow_status}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total minutes this month', value: totalMinutes, icon: Clock, color: 'text-teal' },
          { label: 'Inbound intake', value: `${inboundMinutes} min`, icon: Phone, color: 'text-blue-500' },
          { label: 'Escalation calls', value: `${outboundMinutes} min`, icon: AlertTriangle, color: 'text-orange-500' },
          { label: 'Open incidents', value: openIncidents, icon: TrendingUp, color: 'text-purple-500' },
        ].map(stat => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="font-serif text-navy text-2xl">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent incidents */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-medium text-gray-900 text-sm">Recent incidents</h2>
          <a href="/dashboard/incidents" className="text-teal text-xs hover:underline">View all →</a>
        </div>
        {incidents.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <CheckCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No incidents yet. Your AI receptionist is ready.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {incidents.map(inc => (
              <div key={inc.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {inc.caller_name || 'Unknown caller'}
                    </span>
                    <span className={statusColor(inc.status)}>{inc.status?.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{inc.issue_summary || 'No summary'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(inc.created_at), { addSuffix: true })}
                  </div>
                  <div className="text-xs text-gray-300 mt-0.5">{inc.caller_phone}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
