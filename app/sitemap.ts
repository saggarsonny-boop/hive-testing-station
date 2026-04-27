import type { MetadataRoute } from 'next'
import { ENGINES } from '@/lib/engines'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://test.hive.baby'
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/feedback`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const engineRoutes: MetadataRoute.Sitemap = ENGINES.map(engine => ({
    url: `${base}/test/${engine.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  return [...staticRoutes, ...engineRoutes]
}
