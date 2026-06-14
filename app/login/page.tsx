'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/dashboard')
      router.refresh()
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      setError('Check your email to confirm your account.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
      {/* Left panel */}
      <div className="bg-navy flex flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #1a7f6e 0%, transparent 60%), radial-gradient(circle at 80% 80%, #e8a048 0%, transparent 50%)' }} />
        <div className="relative z-10 max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 bg-teal rounded-full flex items-center justify-center text-white text-lg">🪄</div>
            <span className="font-serif text-white text-lg">Angel Always Answers</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-teal/20 border border-teal/30 rounded-full px-3 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 bg-teal-light rounded-full animate-pulse" />
            <span className="text-teal-light text-xs font-medium">Your AI receptionist is live</span>
          </div>

          <h1 className="font-serif text-white text-4xl leading-tight mb-4">
            Your front desk,<br />
            <em className="not-italic" style={{ color: '#e8a048' }}>always open.</em>
          </h1>
          <p className="text-white/50 text-sm leading-relaxed mb-10">
            Monitor every call, track emergencies, manage your on-call team,
            and review your billing — all in one place.
          </p>

          <div className="space-y-4">
            {[
              { icon: '📞', title: 'Every call handled', desc: 'AI answers 24/7 and captures full caller details' },
              { icon: '🚨', title: 'Emergency dispatch', desc: 'Automatic escalation with real-time SMS alerts' },
              { icon: '📊', title: 'Usage & billing', desc: 'Per-minute metered billing, no surprises' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal/20 border border-teal/30 flex items-center justify-center text-sm flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{f.title}</div>
                  <div className="text-white/40 text-xs">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="bg-cream flex items-center justify-center px-16">
        <div className="w-full max-w-sm">
          <h2 className="font-serif text-navy text-2xl mb-1">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            {mode === 'login'
              ? 'Welcome back — your AI receptionist is waiting.'
              : 'Start managing your AI receptionist today.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@yourbusiness.com"
                className="w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all"
              />
            </div>

            {error && (
              <div className={`text-xs p-3 rounded-lg ${error.includes('Check') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-11 bg-teal text-white font-medium rounded-lg text-sm hover:bg-teal-light transition-colors disabled:opacity-60">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              className="text-teal font-medium hover:underline">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
