import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/nav/sidebar'
import { ToastProvider } from '@/components/ui/toast'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('organization_id').eq('id', user.id).single()

  let orgName = user.email ?? 'My Account'
  let phone   = ''

  if (userData?.organization_id) {
    const [orgRes, phoneRes] = await Promise.all([
      supabase.from('organizations').select('business_name').eq('id', userData.organization_id).single(),
      supabase.from('phone_numbers').select('number').eq('organization_id', userData.organization_id).eq('status', 'assigned').single(),
    ])
    orgName = orgRes.data?.business_name ?? orgName
    phone   = phoneRes.data?.number ?? ''
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-cream">
        <Sidebar orgName={orgName} phone={phone} />
        <main className="flex-1 ml-60 p-8 min-h-screen">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
