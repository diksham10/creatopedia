import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/'],
    },
    sitemap: `https://${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'creatopedia.tech'}/sitemap.xml`,
  }
}
