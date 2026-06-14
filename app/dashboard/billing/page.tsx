import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreditCard, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('organization_id').eq('id', user.id).single()
  const orgId = userData?.organization_id
  if (!orgId) redirect('/dashboard')

  const currentPeriod = new Date().toISOString().substring(0, 7)

  const [orgRes, usageRes, allUsageRes] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', orgId).single(),
    supabase.from('call_usage').select('*').eq('organization_id', orgId).eq('billing_period', currentPeriod),
    supabase.from('call_usage').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(100),
  ])

  const org      = orgRes.data
  const usage    = usageRes.data ?? []
  const allUsage = allUsageRes.data ?? []

  const totalSeconds   = usage.reduce((s, r) => s + (r.quantity_seconds ?? 0), 0)
  const totalMinutes   = Math.ceil(totalSeconds / 60)
  const inboundSecs    = usage.filter(r => r.usage_type === 'inbound_intake_minutes').reduce((s, r) => s + (r.quantity_seconds ?? 0), 0)
  const outboundSecs   = usage.filter(r => r.usage_type === 'outbound_escalation_minutes').reduce((s, r) => s + (r.quantity_seconds ?? 0), 0)
  const inboundMin     = Math.ceil(inboundSecs / 60)
  const outboundMin    = Math.ceil(outboundSecs / 60)
  const reportedRows   = allUsage.filter(r => r.stripe_reported).length
  const unreportedRows = allUsage.filter(r => !r.stripe_reported).length

  const estimatedCost = (totalMinutes * 0.10).toFixed(2)

  // Group usage by day for the current month
  const byDay: Record<string, { inbound: number; outbound: number }> = {}
  usage.forEach(r => {
    const day = r.created_at?.substring(0, 10) ?? ''
    if (!byDay[day]) byDay[day] = { inbound: 0, outbound: 0 }
    if (r.usage_type === 'inbound_intake_minutes') byDay[day].inbound += Math.ceil((r.quantity_seconds ?? 0) / 60)
    else byDay[day].outbound += Math.ceil((r.quantity_seconds ?? 0) / 60)
  })

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="font-serif text-navy text-3xl mb-1">Billing & usage</h1>
        <p className="text-gray-500 text-sm">Pay-as-you-go at $0.10/minute. No setup fees.</p>
      </div>

      {/* Stripe info */}
      <div className="card p-5 mb-6 flex items-center gap-4">
        <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-teal" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-gray-900 text-sm">Stripe subscription</div>
          <div className="text-xs text-gray-400 font-mono">{org?.stripe_subscription_id ?? 'Not linked'}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Customer ID</div>
          <div className="text-xs text-gray-600 font-mono">{org?.stripe_customer_id ?? '—'}</div>
        </div>
        <span className={org?.workflow_status === 'active' ? 'badge-green' : 'badge-gray'}>
          {org?.workflow_status === 'active' ? '● Active' : org?.workflow_status}
        </span>
      </div>

      {/* This month stats */}
      <h2 className="font-medium text-gray-700 text-sm mb-3">
        {format(new Date(), 'MMMM yyyy')} — current period
      </h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total minutes used', value: `${totalMinutes} min`, sub: `${totalSeconds}s total`, icon: Clock, color: 'text-navy' },
          { label: 'Inbound calls', value: `${inboundMin} min`, sub: `${usage.filter(r => r.usage_type === 'inbound_intake_minutes').length} sessions`, icon: TrendingUp, color: 'text-blue-500' },
          { label: 'Escalation calls', value: `${outboundMin} min`, sub: `$0.10 per minute`, icon: TrendingUp, color: 'text-orange-500' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="font-serif text-navy text-2xl mb-0.5">{s.value}</div>
            <div className="text-xs text-gray-400">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Estimated cost */}
      <div className="card p-5 mb-8 bg-teal/5 border-teal/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-0.5">Estimated charge this period</div>
            <div className="text-xs text-gray-400">{totalMinutes} minutes × $0.10/min</div>
          </div>
          <div className="font-serif text-navy text-3xl">${estimatedCost}</div>
        </div>
      </div>

      {/* Reporting status */}
      <div className="card p-5 mb-8">
        <h3 className="font-medium text-gray-900 text-sm mb-4">Usage reporting</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-emerald-50 rounded-lg p-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-emerald-800">{reportedRows} rows reported</div>
              <div className="text-xs text-emerald-600">Synced to Stripe</div>
            </div>
          </div>
          <div className={`flex items-center gap-3 ${unreportedRows > 0 ? 'bg-orange-50' : 'bg-gray-50'} rounded-lg p-3`}>
            <Clock className={`w-5 h-5 ${unreportedRows > 0 ? 'text-orange-500' : 'text-gray-400'} flex-shrink-0`} />
            <div>
              <div className={`text-sm font-medium ${unreportedRows > 0 ? 'text-orange-800' : 'text-gray-600'}`}>{unreportedRows} rows pending</div>
              <div className={`text-xs ${unreportedRows > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                {unreportedRows > 0 ? 'Will sync at 2am daily' : 'All up to date'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent usage rows */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-900 text-sm">Recent usage records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {['Type', 'Duration', 'Period', 'Reported', 'Date'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allUsage.slice(0, 20).map(row => (
                <tr key={row.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <span className={row.usage_type === 'inbound_intake_minutes' ? 'badge-blue' : 'badge-orange'}>
                      {row.usage_type === 'inbound_intake_minutes' ? 'Inbound' : 'Escalation'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{row.quantity_seconds}s ({Math.ceil(row.quantity_seconds / 60)} min)</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{row.billing_period}</td>
                  <td className="px-5 py-3">
                    <span className={row.stripe_reported ? 'badge-green' : 'badge-gray'}>
                      {row.stripe_reported ? '✓ Synced' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {format(new Date(row.created_at), 'MMM d, h:mm a')}
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
