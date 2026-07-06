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
      
<!-- Stripe Checkout Block -->
<div id="stripe-checkout-cta" style="margin: 2rem auto; padding: 2rem; border-radius: 12px; background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.2); text-align: center; font-family: sans-serif; max-width: 600px;">
    <h3 style="margin-top: 0; color: #fff;">Activate Premium License</h3>
    <p style="color: #9ca3af; font-size: 0.95rem; margin-bottom: 1.5rem;">Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/6oU00lb2L6F37bIazv0RG0J" target="_blank" style="display: inline-block; padding: 0.8rem 2rem; background: #3b82f6; color: #fff; font-weight: bold; border-radius: 8px; text-decoration: none; transition: background 0.2s;">Unlock Now</a>
</div>

</body>
    </html>
  )
}
