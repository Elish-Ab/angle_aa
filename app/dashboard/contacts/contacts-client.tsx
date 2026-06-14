'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Edit2, Check, X, Users, Phone, Mail, ChevronUp, ChevronDown, GripVertical } from 'lucide-react'
import { Field, Input, Select, FormRow, FormActions, Button } from '@/components/ui/form'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { createContact, updateContact, deleteContact, reorderContacts } from '@/app/actions/settings'

type Contact = {
  id: string; name: string; phone: string; email: string | null
  role: string; priority_index: number; notify_sms: boolean; notify_email: boolean; status: string
}

const EMPTY = { name: '', phone: '', email: '', role: 'technician', notify_sms: true, notify_email: false }

export default function ContactsClient({ initial }: { initial: Contact[] }) {
  const [contacts, setContacts]     = useState<Contact[]>(initial)
  const [showAdd, setShowAdd]       = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [deleteId, setDeleteId]     = useState<string | null>(null)
  const [form, setForm]             = useState(EMPTY)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function formToFormData(data: typeof EMPTY) {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => fd.set(k, String(v)))
    return fd
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await createContact(formToFormData(form))
      if (res.error) { toast(res.error, 'error'); return }
      toast('Contact added', 'success')
      setShowAdd(false)
      setForm(EMPTY)
      // Refresh contacts from server — simplified: just append optimistically
      window.location.reload()
    })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editContact) return
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    startTransition(async () => {
      const res = await updateContact(editContact.id, fd)
      if (res.error) { toast(res.error, 'error'); return }
      toast('Contact updated', 'success')
      setEditContact(null)
      window.location.reload()
    })
  }

  async function handleDelete() {
    if (!deleteId) return
    startTransition(async () => {
      const res = await deleteContact(deleteId)
      if (res.error) { toast(res.error, 'error'); return }
      toast('Contact removed', 'success')
      setDeleteId(null)
      setContacts(contacts.filter(c => c.id !== deleteId))
    })
  }

  async function move(id: string, dir: 'up' | 'down') {
    const idx = contacts.findIndex(c => c.id === id)
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === contacts.length - 1)) return
    const swap = dir === 'up' ? idx - 1 : idx + 1
    const updated = [...contacts]
    ;[updated[idx], updated[swap]] = [updated[swap], updated[idx]]
    setContacts(updated)
    startTransition(async () => {
      await reorderContacts(updated.map(c => c.id))
    })
  }

  const ContactForm = ({ defaultValues, onSubmit, onCancel }: {
    defaultValues?: Partial<Contact>
    onSubmit: (e: React.FormEvent) => void
    onCancel: () => void
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormRow>
        <Field label="Full name" required>
          <Input name="name" defaultValue={defaultValues?.name} placeholder="Sarah Johnson" required />
        </Field>
        <Field label="Phone number" required hint="E.164 format: +17075550100">
          <Input name="phone" defaultValue={defaultValues?.phone} placeholder="+17075550100" required />
        </Field>
      </FormRow>
      <FormRow>
        <Field label="Email address">
          <Input name="email" type="email" defaultValue={defaultValues?.email ?? ''} placeholder="sarah@company.com" />
        </Field>
        <Field label="Role">
          <Select name="role" defaultValue={defaultValues?.role ?? 'technician'}>
            <option value="technician">Technician</option>
            <option value="manager">Manager</option>
            <option value="owner">Owner</option>
            <option value="dispatcher">Dispatcher</option>
          </Select>
        </Field>
      </FormRow>
      <div className="flex gap-6 pt-1">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
          <input type="hidden" name="notify_sms" value="false" />
          <input type="checkbox" name="notify_sms" value="true"
            defaultChecked={defaultValues?.notify_sms ?? true}
            className="w-4 h-4 rounded accent-teal" />
          Send SMS alerts during emergency
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
          <input type="hidden" name="notify_email" value="false" />
          <input type="checkbox" name="notify_email" value="true"
            defaultChecked={defaultValues?.notify_email ?? false}
            className="w-4 h-4 rounded accent-teal" />
          Send email alerts
        </label>
      </div>
      <FormActions>
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit" loading={isPending}>
          <Check className="w-3.5 h-3.5" /> Save contact
        </Button>
      </FormActions>
    </form>
  )

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-navy text-3xl mb-1">Escalation contacts</h1>
          <p className="text-gray-500 text-sm max-w-lg">
            On-call team members who receive calls and SMS alerts during emergencies.
            Contacts are tried in priority order — top to bottom.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add contact
        </Button>
      </div>

      {/* Empty state */}
      {contacts.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-16 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-700 font-medium text-sm mb-1">No escalation contacts yet</p>
          <p className="text-gray-400 text-sm mb-6">Add your first contact to enable emergency dispatch.</p>
          <Button variant="primary" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Add first contact
          </Button>
        </div>
      )}

      {/* Contact list */}
      {contacts.length > 0 && (
        <div className="space-y-2">
          {contacts.map((contact, idx) => (
            <div key={contact.id}
              className="bg-white rounded-xl border border-gray-200/80 shadow-sm px-4 py-3.5 flex items-center gap-4 group hover:border-gray-300 transition-colors">

              {/* Reorder */}
              <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => move(contact.id, 'up')} disabled={idx === 0}
                  className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <GripVertical className="w-3.5 h-3.5 text-gray-200 mx-auto" />
                <button onClick={() => move(contact.id, 'down')} disabled={idx === contacts.length - 1}
                  className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Priority badge */}
              <div className="w-7 h-7 bg-navy/5 rounded-full flex items-center justify-center text-xs font-semibold text-navy/50 flex-shrink-0">
                {idx + 1}
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 bg-teal rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {contact.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{contact.name}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                    {contact.role}
                  </span>
                  {contact.status === 'active' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-0.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>
                  {contact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>}
                </div>
              </div>

              {/* Notify badges */}
              <div className="flex gap-1.5 flex-shrink-0">
                {contact.notify_sms   && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">SMS</span>}
                {contact.notify_email && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Email</span>}
                {!contact.notify_sms && !contact.notify_email && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500">No alerts</span>}
              </div>

              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditContact(contact)}
                  className="p-2 text-gray-400 hover:text-teal hover:bg-teal/5 rounded-lg transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteId(contact.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {contacts.length > 0 && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-3">
          <span className="text-base mt-0.5">💡</span>
          <p className="text-xs text-amber-700 leading-relaxed">
            During an emergency, the system calls contact #1 first. If unanswered, it waits the configured delay then calls #2, and so on.
            Drag to reorder, or use the arrows.
          </p>
        </div>
      )}

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)}
        title="Add escalation contact" description="This person will be called during emergencies.">
        <ContactForm defaultValues={EMPTY} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editContact} onClose={() => setEditContact(null)}
        title="Edit contact" description={editContact?.name}>
        {editContact && (
          <ContactForm defaultValues={editContact} onSubmit={handleEdit} onCancel={() => setEditContact(null)} />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove contact" size="sm">
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to remove <strong>{contacts.find(c => c.id === deleteId)?.name}</strong>?
          They will no longer be called during emergencies.
        </p>
        <FormActions>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={isPending}>Remove contact</Button>
        </FormActions>
      </Modal>
    </div>
  )
}
