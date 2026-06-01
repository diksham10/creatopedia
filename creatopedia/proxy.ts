import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * PromptHub Proxy
 * Handles subdomain routing and TikTok compatibility fixes.
 */
export async function proxy(request: NextRequest) {
  const url = request.nextUrl
  const path = url.pathname
  const host = request.headers.get('host') || ''
  const userAgent = request.headers.get('user-agent') || ''
  
  // Clean port from host if present (e.g., localhost:3000 -> localhost)
  const hostWithoutPort = host.split(':')[0]

  // Detect TikTok browser or crawler
  const isTikTok = 
    userAgent.includes('TikTok') || 
    userAgent.includes('musical_ly') || 
    userAgent.includes('TikTokBot') || 
    userAgent.includes('ByteSpider')

  // Use the production base domain
  const envBaseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'creatopedia.tech'
  const baseDomain = envBaseDomain.replace(/^https?:\/\//, '').split(':')[0]
  const isLocalhost = hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1'
  // On localhost, we treat the main localhost host as the main domain so it triggers local redirects
  const isMainDomain = hostWithoutPort === baseDomain || isLocalhost

  // 1. Bypass for static assets and API
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/static') ||
    path.includes('.')
  ) {
    return NextResponse.next()
  }

  // 2. Redirect path-based subdomain URLs on main domain to subdomain hosts (force for ALL browsers and crawlers to enforce Independent Subdomain Architecture)
  if (isMainDomain) {
    const segments = path.split('/').filter(Boolean)
    if (segments.length > 0) {
      const firstSegment = segments[0]
      const reservedPaths = ['dashboard', 'admin', 'ads', 'browse', 'category', 'experience', 'platforms', 'reach-us', 'login', 'register', 'privacy-policy', 'terms', 'founding-member']
      if (!reservedPaths.includes(firstSegment)) {
        const subdomain = firstSegment
        const redirectUrl = new URL(request.url)
        if (isLocalhost) {
          const port = host.split(':')[1]
          redirectUrl.host = `${subdomain}.localhost${port ? `:${port}` : ''}`
        } else {
          redirectUrl.host = `${subdomain}.${baseDomain}`
        }
        
        if (segments.length === 1) {
          redirectUrl.pathname = '/'
        } else {
          // Redirect to the clean format: {subdomain}.creatopedia.tech/{slug}
          // If the old URL had /creatopedia.tech/ prefix in path, strip it
          let remainingSegments = segments.slice(1)
          if (remainingSegments[0] === 'creatopedia.tech') {
            remainingSegments = remainingSegments.slice(1)
          }
          redirectUrl.pathname = `/${remainingSegments.join('/')}`
        }
        
        console.log(`[Redirect] Redirecting main domain path to subdomain: ${redirectUrl.toString()}`)
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // 2. TikTok Compatibility Fix: 
  // NOTE: Previously, we redirected TikTok users to path-based URLs due to suspected SSL issues.
  // However, to bypass TikTok's "infinite path" spam filters, we now intentionally KEEP them on subdomains
  // (e.g. prashant.creatopedia.tech) as recommended by the new Independent Subdomain Architecture approach.
  // if (isTikTok && !isMainDomain) { ... removed ... }

  // Paths that should never be rewritten to subdomain routes
  // These are top-level app routes that must always resolve as-is
  const globalReservedPaths = [
    '/login', '/register', '/dashboard', '/admin', '/api', '/ads', '/browse', '/category',
    '/experience', '/platforms', '/reach-us', '/privacy-policy', '/terms',
    '/_next', '/static', '/favicon.ico', '/founding-member',
  ]
  const globalReservedSubdomains = ['dashboard', 'admin', 'api', 'www']
  const isGlobalReserved = globalReservedPaths.some(p => path === p || path.startsWith(p + '/'))
  
  // Also treat known system subdomains (like dashboard.localhost) as reserved — pass through, not a creator
  const extractedSubdomain = hostWithoutPort.endsWith('.localhost')
    ? hostWithoutPort.replace('.localhost', '')
    : hostWithoutPort.replace(`.${baseDomain}`, '')
  const isSystemSubdomain = globalReservedSubdomains.includes(extractedSubdomain)

  // 3. Unified Routing & Header Management
  let subdomain = hostWithoutPort.replace(`.${baseDomain}`, '')
  if (hostWithoutPort.endsWith('.localhost')) {
    subdomain = hostWithoutPort.replace('.localhost', '')
  }
  if (isLocalhost && !hostWithoutPort.includes('.')) {
    subdomain = 'milan'
  }
  let response: NextResponse

  if (isMainDomain) {
    // Path-based or Main Domain
    response = NextResponse.next()
  } else if (isSystemSubdomain || isGlobalReserved) {
    // System subdomains (dashboard.localhost) or reserved paths (login, dashboard, etc.)
    // must pass through as-is — never rewrite as creator subdomains
    response = NextResponse.next()
  } else if (subdomain && subdomain !== hostWithoutPort) {
    // Creator Subdomain Rewrite (Internal)
    // Strip /creatopedia.tech prefix if present, to support {subdomain}.creatopedia.tech/creatopedia.tech/{slug}
    let cleanPath = path
    if (path.startsWith('/creatopedia.tech/')) {
      cleanPath = path.substring('/creatopedia.tech'.length)
    } else if (path === '/creatopedia.tech') {
      cleanPath = '/'
    }
    const rewriteUrl = new URL(`/${subdomain}${cleanPath}`, request.url)
    response = NextResponse.rewrite(rewriteUrl)
  } else {
    response = NextResponse.next()
  }

  // 4. Extract Subdomain for Analytics & Multi-tenancy
  // Extract the subdomain from the current host
  let analyticsSubdomain: string | null = null
  
  if (!isMainDomain && !isSystemSubdomain) {
    // This is a creator subdomain
    if (hostWithoutPort.endsWith('.localhost')) {
      analyticsSubdomain = hostWithoutPort.replace('.localhost', '')
    } else {
      analyticsSubdomain = hostWithoutPort.replace(`.${baseDomain}`, '')
    }
  }

  // Add subdomain to headers for use in API routes and server components
  if (analyticsSubdomain) {
    response.headers.set('x-subdomain', analyticsSubdomain)
  }
  response.headers.set('x-host', host)

  // 5. Apply Security Headers (Consolidated from next.config.ts)
  // We handle these dynamically to ensure TikTok never gets blocked by strict policies.
  if (isTikTok) {
    // TikTok compatibility: Loosened policy to prevent blocks in restrictive WebView
    response.headers.set('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors *;")
    // NOTE: X-Frame-Options is intentionally omitted here for TikTok compatibility.
  } else {
    // Standard security: Strict policy for normal browsers
    response.headers.set('Content-Security-Policy', "frame-ancestors 'self' https://*.tiktok.com https://*.facebook.com https://*.instagram.com;")
    // NOTE: X-Frame-Options is also omitted here to avoid conflicts in social browsers,
    // as frame-ancestors provides the necessary protection.
  }

  return response
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}