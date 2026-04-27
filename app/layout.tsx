import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hive Testing Station — Help build the Hive. Get paid in access.',
  description: 'The first 100 testers for each Hive engine get free lifetime access and $100 in Pro credit. No ads. No investors. No agenda.',
  keywords: 'hive testing, beta testers, founding tester, hive.baby, universal document testing',
  openGraph: {
    title: 'Hive Testing Station — Help build the Hive. Get paid in access.',
    description: 'The first 100 testers for each Hive engine get free lifetime access and $100 in Pro credit.',
    url: 'https://test.hive.baby',
    siteName: 'Hive Testing Station',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
