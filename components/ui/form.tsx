import { ReactNode } from 'react'

export function Field({ label, hint, error, children, required }: {
  label: string; hint?: string; error?: string; children: ReactNode; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-700">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

const base = "w-full h-10 px-3.5 rounded-lg border text-sm outline-none transition-all bg-white text-gray-900 placeholder:text-gray-300"
const focus = "focus:border-teal focus:ring-2 focus:ring-teal/10"
const err   = "border-red-300 focus:border-red-400 focus:ring-red-100"
const norm  = "border-gray-200 hover:border-gray-300"

export function Input({ error, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return <input className={`${base} ${focus} ${error ? err : norm} ${className}`} {...props} />
}

export function Textarea({ error, className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return <textarea className={`${base} h-auto py-2.5 resize-none ${focus} ${error ? err : norm} ${className}`} {...props} />
}

export function Select({ error, className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <select className={`${base} ${focus} ${error ? err : norm} ${className} cursor-pointer`} {...props}>
      {children}
    </select>
  )
}

export function FormRow({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 }) {
  const grid = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }
  return <div className={`grid ${grid[cols]} gap-4`}>{children}</div>
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 mt-4">{children}</div>
}

export function Button({ variant = 'primary', loading, children, ...props }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger'; loading?: boolean }) {
  const variants = {
    primary:   'bg-teal text-white hover:bg-teal-light',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300',
    danger:    'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${variants[variant]}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
}
