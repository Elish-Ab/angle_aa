import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('organization_id').eq('id', user.id).single()
  const orgId = userData?.organization_id
  if (!orgId) redirect('/dashboard')

  const [orgRes, settingsRes, agentRes, phoneRes, policyRes] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', orgId).single(),
    supabase.from('customer_settings').select('*').eq('organization_id', orgId).single(),
    supabase.from('agents').select('*').eq('organization_id', orgId).single(),
    supabase.from('phone_numbers').select('*').eq('organization_id', orgId).single(),
    supabase.from('escalation_policies').select('*').eq('organization_id', orgId).single(),
  ])

  return (
    <SettingsClient
      org={orgRes.data}
      settings={settingsRes.data}
      agent={agentRes.data}
      phone={phoneRes.data}
      policy={policyRes.data}
      userEmail={user.email ?? ''}
      orgId={orgId}
    />
  )
}
