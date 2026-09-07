import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JustGimmeADolla — Real Stories. Real People.',
  description: 'Voice stories from real people. If it moves you — send a dollar.',
  openGraph: {
    title: 'JustGimmeADolla',
    description: 'Real stories. Real people. If it moves you — send a dollar.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
