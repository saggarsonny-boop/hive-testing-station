import type { Metadata } from 'next'
import { ENGINES } from '@/lib/engines'

export async function generateMetadata(
  { params }: { params: Promise<{ engine: string }> }
): Promise<Metadata> {
  const { engine: slug } = await params
  const engine = ENGINES.find(e => e.slug === slug)

  if (!engine) {
    return {
      title: 'Engine Not Found — HiveTestingStation',
      description: 'This engine does not exist in the Hive Testing Station.',
    }
  }

  return {
    title: `Test ${engine.name} — Founding Tester Program`,
    description: `Become one of 100 Founding Testers for ${engine.name}. Free lifetime access + $100 Pro credit for your honest feedback. ${engine.description}`,
    openGraph: {
      title: `Test ${engine.name} — Founding Tester Program`,
      description: `Become one of 100 Founding Testers for ${engine.name}. Free lifetime access + $100 Pro credit.`,
      url: `https://test.hive.baby/test/${engine.slug}`,
      siteName: 'HiveTestingStation',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Test ${engine.name} — Founding Tester Program`,
      description: `Free lifetime access + $100 Pro credit for testing ${engine.name}.`,
    },
  }
}

export default function EngineTestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}



<!-- Stripe Checkout Block -->
<div id="stripe-checkout-cta" style="margin: 2rem auto; padding: 2rem; border-radius: 12px; background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.2); text-align: center; font-family: sans-serif; max-width: 600px;">
    <h3 style="margin-top: 0; color: #fff;">Activate Premium License</h3>
    <p style="color: #9ca3af; font-size: 0.95rem; margin-bottom: 1.5rem;">Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/6oU00lb2L6F37bIazv0RG0J" target="_blank" style="display: inline-block; padding: 0.8rem 2rem; background: #3b82f6; color: #fff; font-weight: bold; border-radius: 8px; text-decoration: none; transition: background 0.2s;">Unlock Now</a>
</div>
