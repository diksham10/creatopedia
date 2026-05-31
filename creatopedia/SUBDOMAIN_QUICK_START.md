# Subdomain System - Quick Start Guide

## What Was Just Created

Your Next.js app now has a complete subdomain multi-tenant system with analytics. Here's what was added:

### 📁 Files Created/Updated:

1. **middleware.ts** (updated)
   - Extracts subdomain from Host header
   - Passes subdomain to routes via `x-subdomain` header
   - Handles rewriting subdomain routes to dynamic `[subdomain]` routes

2. **lib/subdomain-utils.ts** (new)
   - Utility functions for subdomain validation
   - User lookup functions
   - Prompt fetching with access control

3. **lib/hooks/useSubdomainAnalytics.ts** (new)
   - React hook for automatic visit tracking
   - Easy to use in page components

4. **app/api/analytics/track-visit/route.ts** (new)
   - POST endpoint to record user visits
   - GET endpoint to retrieve analytics

5. **app/api/subdomain/[subdomain]/profile/route.ts** (new)
   - Returns public profile for a creator

6. **app/api/subdomain/[subdomain]/prompts/route.ts** (new)
   - Returns public prompts with access control
   - Supports email-restricted access

7. **app/[subdomain]/page.tsx** (new)
   - Public-facing page that displays user's prompts
   - Shows creator profile info
   - Tracks visits automatically

8. **docs/SUBDOMAIN_SETUP.md** (new)
   - Complete setup guide with Nginx configs
   - Backend API specifications
   - Testing instructions

## How It Works

### User Visit Flow:

```
1. User visits: user1.creatopedia.tech
   ↓
2. Nginx forwards request (Host: user1.creatopedia.tech)
   ↓
3. middleware.ts extracts "user1" subdomain
   ↓
4. Route rewritten to /user1/page.tsx
   ↓
5. Page loads creator profile and prompts
   ↓
6. useSubdomainAnalytics hook tracks the visit
   ↓
7. Analytics sent to /api/analytics/track-visit
   ↓
8. Backend records visit with IP hash, user agent, timestamp
```

## Quick Local Testing

### 1. Add to /etc/hosts:
```bash
sudo nano /etc/hosts

# Add these lines:
127.0.0.1 localhost
127.0.0.1 john.localhost
127.0.0.1 sarah.localhost
```

### 2. Update .env.local:
```bash
cp .env.local.example .env.local

# Make sure it has:
NEXT_PUBLIC_BASE_DOMAIN=localhost
BACKEND_API_URL=http://localhost:8000
INTERNAL_API_SECRET=dev-secret
```

### 3. Run the app:
```bash
npm run dev
```

### 4. Test the URLs:
- `http://localhost:3000` - Main domain
- `http://john.localhost:3000` - John's prompts
- `http://sarah.localhost:3000` - Sarah's prompts
- `http://john.localhost:3000?email=test@example.com` - With email (for restricted access)

## Backend Integration

Your backend needs to implement these endpoints:

### 1. Get User by Subdomain
```
GET /api/users/by-subdomain/{subdomain}
Header: X-Internal-Secret: your-secret

Response:
{
  "id": "...",
  "username": "john",
  "display_name": "John Doe",
  "bio": "...",
  "avatar_url": "...",
  "allow_public_access": true
}
```

### 2. Get User Prompts
```
GET /api/users/{user_id}/prompts?include_public=true

Response:
{
  "prompts": [
    {
      "id": "...",
      "title": "...",
      "content": "...",
      "access_type": "public"
    }
  ]
}
```

### 3. Track Visit
```
POST /api/analytics/track-subdomain-visit
Header: X-Internal-Secret: your-secret

Body:
{
  "subdomain": "john",
  "path": "/",
  "user_email": "visitor@example.com",
  "ip_hash": "...",
  "user_agent": "...",
  "timestamp": "..."
}
```

### 4. Get Analytics
```
GET /api/analytics/subdomain-visits?subdomain=john&days=30

Response:
{
  "total_visits": 150,
  "unique_visitors": 45,
  "last_7_days": 28,
  "traffic_by_date": [...]
}
```

## Using Analytics in Your Pages

### Automatic tracking (just add the hook):
```tsx
import { useSubdomainAnalytics } from "@/lib/hooks/useSubdomainAnalytics";

export default function MyPage() {
  // Automatically tracks visits
  useSubdomainAnalytics();
  
  return <div>Your content</div>;
}
```

### With user email tracking:
```tsx
useSubdomainAnalytics({
  userEmail: user?.email,
  customData: { userType: "premium" }
});
```

## Production Setup

See **docs/SUBDOMAIN_SETUP.md** for:
- ✅ Complete Nginx configuration
- ✅ SSL certificate setup (Let's Encrypt wildcard)
- ✅ Production database schema
- ✅ Security best practices
- ✅ Troubleshooting guide

## Key Features

✅ **Multi-tenant**: Each user has their own subdomain  
✅ **Analytics**: Track unique visitors, visit count, paths  
✅ **Access Control**: Public, email-restricted, or private prompts  
✅ **SEO Friendly**: Subdomains vs path-based routing  
✅ **Secure**: Internal API secrets, IP hashing  
✅ **Scalable**: Ready for production with Nginx  

## Next Steps

1. ✅ Configure .env.local
2. ✅ Test with localhost subdomains
3. ✅ Implement backend endpoints
4. ✅ Set up Nginx (see SUBDOMAIN_SETUP.md)
5. ✅ Get SSL certificate
6. ✅ Deploy to production

---

**Questions?** Check docs/SUBDOMAIN_SETUP.md or review the inline comments in the code files.
