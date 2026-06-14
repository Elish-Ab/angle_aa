'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getOrgId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data } = await supabase.from('users').select('organization_id').eq('id', user.id).single()
  if (!data?.organization_id) throw new Error('No organization linked')
  return { supabase, orgId: data.organization_id, userId: user.id }
}

// ── Business settings ─────────────────────────────────────────────────────────
export async function updateBusinessSettings(formData: FormData) {
  const { supabase, orgId } = await getOrgId()
  const fields = {
    business_name:   formData.get('business_name') as string,
    industry:        formData.get('industry') as string,
    time_zone:       formData.get('time_zone') as string,
    service_area:    formData.get('service_area') as string,
    plan_type:       formData.get('plan_type') as string,
    business_hours_start: formData.get('business_hours_start') as string,
    business_hours_end:   formData.get('business_hours_end') as string,
  }
  await supabase.from('organizations').update(fields).eq('id', orgId)
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

// ── AI / Customer settings ────────────────────────────────────────────────────
export async function updateAISettings(formData: FormData) {
  const { supabase, orgId } = await getOrgId()
  const fields = {
    emergency_definition: formData.get('emergency_definition') as string,
    business_hours_json:  formData.get('business_hours_json') as string,
    service_area:         formData.get('service_area') as string,
    callback_policy:      formData.get('callback_policy') as string,
    extra_notes:          formData.get('extra_notes') as string,
    service_mode:         formData.get('service_mode') as string,
    escalation_enabled:   formData.get('escalation_enabled') === 'true',
    notifications_enabled: formData.get('notifications_enabled') === 'true',
  }
  const { error } = await supabase.from('customer_settings').update(fields).eq('organization_id', orgId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/settings')
  return { success: true }
}

// ── Escalation policy ─────────────────────────────────────────────────────────
export async function updateEscalationPolicy(formData: FormData) {
  const { supabase, orgId } = await getOrgId()
  const fields = {
    max_attempts:          parseInt(formData.get('max_attempts') as string),
    delay_seconds:         parseInt(formData.get('delay_seconds') as string),
    routing_mode:          formData.get('routing_mode') as string,
    notify_on_callback:    formData.get('notify_on_callback') === 'true',
    notify_on_escalation:  formData.get('notify_on_escalation') === 'true',
    notify_on_failure:     formData.get('notify_on_failure') === 'true',
    plan_type:             formData.get('plan_type') as string,
  }
  // Upsert — create if doesn't exist
  const { data: existing } = await supabase.from('escalation_policies')
    .select('id').eq('organization_id', orgId).single()
  if (existing) {
    await supabase.from('escalation_policies').update(fields).eq('organization_id', orgId)
  } else {
    await supabase.from('escalation_policies').insert({ ...fields, organization_id: orgId, active: true })
  }
  revalidatePath('/dashboard/settings')
  return { success: true }
}

// ── Contacts CRUD ─────────────────────────────────────────────────────────────
export async function createContact(formData: FormData) {
  const { supabase, orgId } = await getOrgId()
  const { data: existing } = await supabase.from('escalation_contacts')
    .select('priority_index').eq('organization_id', orgId).order('priority_index', { ascending: false }).limit(1).single()
  const priority = (existing?.priority_index ?? 0) + 1
  const { data, error } = await supabase.from('escalation_contacts').insert({
    organization_id: orgId,
    name:            formData.get('name') as string,
    phone:           formData.get('phone') as string,
    email:           formData.get('email') as string || null,
    role:            formData.get('role') as string || 'technician',
    notify_sms:      formData.get('notify_sms') === 'true',
    notify_email:    formData.get('notify_email') === 'true',
    priority_index:  priority,
    status:          'active',
  }).select().single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/contacts')
  return { success: true, data }
}

export async function updateContact(id: string, formData: FormData) {
  const { supabase, orgId } = await getOrgId()
  const { error } = await supabase.from('escalation_contacts').update({
    name:         formData.get('name') as string,
    phone:        formData.get('phone') as string,
    email:        formData.get('email') as string || null,
    role:         formData.get('role') as string,
    notify_sms:   formData.get('notify_sms') === 'true',
    notify_email: formData.get('notify_email') === 'true',
  }).eq('id', id).eq('organization_id', orgId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/contacts')
  return { success: true }
}

export async function deleteContact(id: string) {
  const { supabase, orgId } = await getOrgId()
  const { error } = await supabase.from('escalation_contacts').delete().eq('id', id).eq('organization_id', orgId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/contacts')
  return { success: true }
}

export async function reorderContacts(ids: string[]) {
  const { supabase, orgId } = await getOrgId()
  await Promise.all(ids.map((id, idx) =>
    supabase.from('escalation_contacts').update({ priority_index: idx + 1 }).eq('id', id).eq('organization_id', orgId)
  ))
  revalidatePath('/dashboard/contacts')
  return { success: true }
}

// ── Incident actions ──────────────────────────────────────────────────────────
export async function updateIncidentStatus(id: string, status: string) {
  const { supabase, orgId } = await getOrgId()
  const { error } = await supabase.from('incidents').update({ status }).eq('id', id).eq('organization_id', orgId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/incidents')
  return { success: true }
}
