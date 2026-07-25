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
