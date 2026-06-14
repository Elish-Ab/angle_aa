'use client'

import { useState, useTransition } from 'react'
import { Settings, Phone, Cpu, Bell, Building2, Shield, Save, Edit2 } from 'lucide-react'
import { Field, Input, Textarea, Select, FormRow, FormActions, Button } from '@/components/ui/form'
import { useToast } from '@/components/ui/toast'
import {
  updateBusinessSettings, updateAISettings, updateEscalationPolicy
} from '@/app/actions/settings'

type Props = {
  org: Record<string, string> | null
  settings: Record<string, string | boolean> | null
  agent: Record<string, string> | null
  phone: Record<string, string> | null
  policy: Record<string, string | number | boolean> | null
  userEmail: string
  orgId: string
}

function SectionHeader({ icon: Icon, title, description, onEdit, editing }: {
  icon: React.ElementType; title: string; description: string
  onEdit?: () => void; editing?: boolean
}) {
  return (
    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
      <div className="w-8 h-8 bg-navy/5 rounded-lg flex items-center justify-center">
        <Icon className="w-4 h-4 text-navy/60" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-gray-900 text-sm">{title}</div>
        <div className="text-gray-400 text-xs">{description}</div>
      </div>
      {onEdit && (
        <button onClick={onEdit}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            editing ? 'bg-teal/10 text-teal' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
          }`}>
          <Edit2 className="w-3 h-3" />
          {editing ? 'Editing' : 'Edit'}
        </button>
      )}
    </div>
  )
}

function ReadField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-400 mb-1">{label}</div>
      <div className="text-sm text-gray-800">{value || <span className="text-gray-300 italic">Not set</span>}</div>
    </div>
  )
}

export default function SettingsClient({ org, settings, agent, phone, policy, userEmail, orgId }: Props) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [editBiz, setEditBiz]    = useState(false)
  const [editAI, setEditAI]      = useState(false)
  const [editPolicy, setEditPolicy] = useState(false)

  function handleAction(action: (fd: FormData) => Promise<{ success?: boolean; error?: string }>, section: string) {
    return async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      startTransition(async () => {
        const res = await action(fd)
        if (res.error) { toast(res.error, 'error') }
        else {
          toast(`${section} updated successfully`, 'success')
          if (section === 'Business info') setEditBiz(false)
          if (section === 'AI settings') setEditAI(false)
          if (section === 'Escalation policy') setEditPolicy(false)
        }
      })
    }
  }

  const timezones = [
    ['America/Los_Angeles', 'Pacific Time (PT)'],
    ['America/Denver',      'Mountain Time (MT)'],
    ['America/Chicago',     'Central Time (CT)'],
    ['America/New_York',    'Eastern Time (ET)'],
  ]

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-navy text-3xl mb-1">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your account, AI receptionist, and escalation configuration.</p>
      </div>

      {/* ── Business Info ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <SectionHeader icon={Building2} title="Business information"
          description="Your company details and contact info"
          onEdit={() => setEditBiz(!editBiz)} editing={editBiz} />

        {editBiz ? (
          <form onSubmit={handleAction(updateBusinessSettings, 'Business info')} className="px-6 py-5 space-y-4">
            <FormRow>
              <Field label="Business name" required>
                <Input name="business_name" defaultValue={org?.business_name} placeholder="Acme Plumbing" required />
              </Field>
              <Field label="Industry">
                <Select name="industry" defaultValue={org?.industry}>
                  {['Plumbing','HVAC','Electrical','Roofing','Landscaping','Pest Control','Locksmith','General Contractor','Other'].map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </Select>
              </Field>
            </FormRow>
            <FormRow>
              <Field label="Time zone" required>
                <Select name="time_zone" defaultValue={org?.time_zone} required>
                  {timezones.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </Field>
              <Field label="Service area">
                <Input name="service_area" defaultValue={org?.service_area} placeholder="Sonoma County, CA" />
              </Field>
            </FormRow>
            <FormRow>
              <Field label="Business hours start">
                <Select name="business_hours_start" defaultValue={org?.business_hours_start}>
                  {['06:00','07:00','08:00','09:00','10:00'].map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Business hours end">
                <Select name="business_hours_end" defaultValue={org?.business_hours_end}>
                  {['17:00','18:00','19:00','20:00','21:00'].map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
            </FormRow>
            <FormActions>
              <Button variant="secondary" type="button" onClick={() => setEditBiz(false)}>Cancel</Button>
              <Button variant="primary" type="submit" loading={isPending}>
                <Save className="w-3.5 h-3.5" /> Save changes
              </Button>
            </FormActions>
          </form>
        ) : (
          <div className="px-6 py-5 grid grid-cols-2 gap-x-8 gap-y-4">
            <ReadField label="Business name"  value={org?.business_name} />
            <ReadField label="Industry"       value={org?.industry} />
            <ReadField label="Time zone"      value={org?.time_zone} />
            <ReadField label="Service area"   value={org?.service_area} />
            <ReadField label="Business hours start" value={org?.business_hours_start} />
            <ReadField label="Business hours end"   value={org?.business_hours_end} />
          </div>
        )}
      </div>

      {/* ── AI Settings ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <SectionHeader icon={Cpu} title="AI receptionist"
          description="Emergency definition and agent behavior"
          onEdit={() => setEditAI(!editAI)} editing={editAI} />

        {editAI ? (
          <form onSubmit={handleAction(updateAISettings, 'AI settings')} className="px-6 py-5 space-y-4">
            <Field label="Emergency definition" required
              hint="The AI uses this to decide whether a caller needs immediate dispatch.">
              <Textarea name="emergency_definition" rows={4}
                defaultValue={settings?.emergency_definition as string}
                placeholder="e.g. Active water leak, burst pipe, flooding, gas leak, no heat in winter..." />
            </Field>
            <Field label="Business hours (freeform)" hint="e.g. Mon-Fri 08:00-17:00">
              <Input name="business_hours_json" defaultValue={settings?.business_hours_json as string} placeholder="Mon-Fri 08:00-17:00" />
            </Field>
            <Field label="Service area">
              <Input name="service_area" defaultValue={settings?.service_area as string} placeholder="Sonoma County, CA" />
            </Field>
            <Field label="Service mode">
              <Select name="service_mode" defaultValue={settings?.service_mode as string}>
                <option value="after_hours_only">After hours only</option>
                <option value="always_on">Always on</option>
                <option value="daytime_only">Daytime only</option>
                <option value="emergency_escalation">Emergency escalation</option>
                <option value="callback_only">Callback only</option>
              </Select>
            </Field>
            <Field label="Additional notes for the AI">
              <Textarea name="extra_notes" rows={3}
                defaultValue={settings?.extra_notes as string}
                placeholder="e.g. Residential customers only. Service radius is 30 miles..." />
            </Field>
            <div className="flex gap-6">
              {[
                { name: 'escalation_enabled',   label: 'Emergency escalation enabled' },
                { name: 'notifications_enabled', label: 'SMS notifications enabled' },
              ].map(({ name, label }) => (
                <label key={name} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="hidden" name={name} value="false" />
                  <input type="checkbox" name={name} value="true"
                    defaultChecked={settings?.[name] as boolean}
                    className="w-4 h-4 rounded accent-teal" />
                  {label}
                </label>
              ))}
            </div>
            <FormActions>
              <Button variant="secondary" type="button" onClick={() => setEditAI(false)}>Cancel</Button>
              <Button variant="primary" type="submit" loading={isPending}>
                <Save className="w-3.5 h-3.5" /> Save changes
              </Button>
            </FormActions>
          </form>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div>
              <div className="text-xs font-medium text-gray-400 mb-1">Emergency definition</div>
              <p className="text-sm text-gray-800 leading-relaxed">{settings?.emergency_definition as string || <span className="text-gray-300 italic">Not set</span>}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <ReadField label="Service mode"     value={settings?.service_mode as string} />
              <ReadField label="Business hours"   value={settings?.business_hours_json as string} />
              <ReadField label="Escalation"       value={settings?.escalation_enabled ? '✓ Enabled' : '✗ Disabled'} />
              <ReadField label="SMS Notifications" value={settings?.notifications_enabled ? '✓ Enabled' : '✗ Disabled'} />
            </div>
            <div className="px-4 py-3 bg-gray-50 rounded-lg text-xs text-gray-400">
              Agent: <span className="font-mono text-gray-600">{agent?.retell_agent_id ?? '—'}</span>
              {phone?.number && <> · Number: <span className="font-mono text-gray-600">{phone.number}</span></>}
            </div>
          </div>
        )}
      </div>

      {/* ── Escalation Policy ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <SectionHeader icon={Bell} title="Escalation policy"
          description="How the system handles emergency dispatch"
          onEdit={() => setEditPolicy(!editPolicy)} editing={editPolicy} />

        {editPolicy ? (
          <form onSubmit={handleAction(updateEscalationPolicy, 'Escalation policy')} className="px-6 py-5 space-y-4">
            <FormRow cols={3}>
              <Field label="Max attempts" hint="1–10">
                <Input name="max_attempts" type="number" min={1} max={10}
                  defaultValue={String(policy?.max_attempts ?? 3)} required />
              </Field>
              <Field label="Delay between attempts (sec)">
                <Input name="delay_seconds" type="number" min={10} max={3600}
                  defaultValue={String(policy?.delay_seconds ?? 30)} required />
              </Field>
              <Field label="Routing mode">
                <Select name="routing_mode" defaultValue={policy?.routing_mode as string ?? 'sequential'}>
                  <option value="sequential">Sequential</option>
                  <option value="retry_same">Retry same</option>
                  <option value="round_robin">Round robin</option>
                </Select>
              </Field>
            </FormRow>
            <Field label="Plan type">
              <Select name="plan_type" defaultValue={policy?.plan_type as string ?? 'emergency_escalation'}>
                <option value="emergency_escalation">Emergency escalation</option>
                <option value="callback_only">Callback only</option>
                <option value="fallback_notifications">Fallback notifications</option>
              </Select>
            </Field>
            <div className="flex gap-6">
              {[
                { name: 'notify_on_callback',   label: 'Notify on callback requests' },
                { name: 'notify_on_escalation', label: 'Notify when escalation starts' },
                { name: 'notify_on_failure',    label: 'Notify when all attempts fail' },
              ].map(({ name, label }) => (
                <label key={name} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="hidden" name={name} value="false" />
                  <input type="checkbox" name={name} value="true"
                    defaultChecked={policy?.[name] as boolean}
                    className="w-4 h-4 rounded accent-teal" />
                  {label}
                </label>
              ))}
            </div>
            <FormActions>
              <Button variant="secondary" type="button" onClick={() => setEditPolicy(false)}>Cancel</Button>
              <Button variant="primary" type="submit" loading={isPending}>
                <Save className="w-3.5 h-3.5" /> Save changes
              </Button>
            </FormActions>
          </form>
        ) : (
          policy ? (
            <div className="px-6 py-5 grid grid-cols-3 gap-x-8 gap-y-4">
              <ReadField label="Max attempts"    value={String(policy.max_attempts)} />
              <ReadField label="Delay"           value={`${policy.delay_seconds}s between calls`} />
              <ReadField label="Routing mode"    value={policy.routing_mode as string} />
              <ReadField label="Plan type"       value={policy.plan_type as string} />
              <ReadField label="Notify on callback" value={policy.notify_on_callback ? 'Yes' : 'No'} />
              <ReadField label="Notify on failure"  value={policy.notify_on_failure ? 'Yes' : 'No'} />
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              No policy configured.
              <button onClick={() => setEditPolicy(true)} className="text-teal hover:underline ml-1">Set one up →</button>
            </div>
          )
        )}
      </div>

      {/* ── Account (read-only) ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <SectionHeader icon={Shield} title="Account" description="Your login and organization identifiers" />
        <div className="px-6 py-5 grid grid-cols-2 gap-x-8 gap-y-4">
          <ReadField label="Email"           value={userEmail} />
          <ReadField label="Workflow status" value={org?.workflow_status} />
          <ReadField label="Organization ID" value={orgId} />
          <ReadField label="Stripe customer" value={org?.stripe_customer_id} />
        </div>
      </div>
    </div>
  )
}
