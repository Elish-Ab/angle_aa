import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Angel Always Answers — Dashboard',
  description: 'Manage your AI receptionist',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
