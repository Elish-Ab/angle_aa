'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Phone, AlertTriangle, CreditCard,
  Users, Settings, LogOut, Radio
} from 'lucide-react'

const nav = [
  { href: '/dashboard',           label: 'Overview',  icon: LayoutDashboard },
  { href: '/dashboard/incidents', label: 'Incidents', icon: AlertTriangle },
  { href: '/dashboard/billing',   label: 'Billing',   icon: CreditCard },
  { href: '/dashboard/contacts',  label: 'Contacts',  icon: Users },
  { href: '/dashboard/settings',  label: 'Settings',  icon: Settings },
]

export default function Sidebar({ orgName, phone }: { orgName: string; phone: string }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 min-h-screen bg-navy flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-teal rounded-full flex items-center justify-center text-white text-sm">🪄</div>
          <span className="font-serif text-white text-sm">Angel Always Answers</span>
        </div>
        {/* Business info */}
        <div className="bg-white/5 rounded-lg px-3 py-2.5">
          <div className="text-white/80 text-xs font-medium truncate">{orgName}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <Phone className="w-3 h-3 text-white/40" />
            <span className="text-white/40 text-xs">{phone || 'No number yet'}</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-teal/20 text-white border border-teal/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Status + signout */}
      <div className="px-3 pb-5 space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-white/60 text-xs">Receptionist active</span>
        </div>
        <button onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors text-sm">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
