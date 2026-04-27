import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: 'HiveTestingStation — Help build the Hive. Get $100 in credit.',
  description: 'Become a Founding Tester for Hive engines. The first 100 testers per engine get free lifetime access and $100 Pro credit per engine tested.',
  keywords: 'hive testing, beta tester, founding tester, free lifetime access, hive.baby, universal document, product testing program',
  openGraph: {
    title: 'HiveTestingStation — Help build the Hive. Get $100 in credit.',
    description: 'Help build the Hive. Get paid in access.',
    url: 'https://test.hive.baby',
    siteName: 'HiveTestingStation',
    type: 'website',
    images: [{ url: 'https://test.hive.baby/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HiveTestingStation — Help build the Hive. Get $100 in credit.',
    description: 'Help build the Hive. Get paid in access.',
  },
  robots: { index: true, follow: true },
  metadataBase: new URL('https://test.hive.baby'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
