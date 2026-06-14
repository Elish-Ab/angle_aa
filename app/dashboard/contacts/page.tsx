import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContactsClient from './contacts-client'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('organization_id').eq('id', user.id).single()
  const orgId = userData?.organization_id
  if (!orgId) redirect('/dashboard')

  const { data } = await supabase
    .from('escalation_contacts')
    .select('*')
    .eq('organization_id', orgId)
    .order('priority_index', { ascending: true })

  return <ContactsClient initial={data ?? []} />
}
