# Subdomain Multi-Tenant System Setup Guide

This guide explains how to configure your subdomain system for multi-tenant prompt sharing with analytics.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Nginx (Reverse Proxy)                       │
│  Forwards Host Header: user1.creatopedia.tech → 3.236.96.4:3000 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               Next.js Application (Port 3000)                    │
├─────────────────────────────────────────────────────────────────┤
│ middleware.ts                                                   │
│ ├─ Extracts subdomain from Host header                          │
│ ├─ Sets x-subdomain header for routes                           │
│ └─ Rewrites subdomain routes to [subdomain] dynamic routes      │
├─────────────────────────────────────────────────────────────────┤
│ Routes:                                                         │
│ ├─ /api/analytics/track-visit ← POST visits                     │
│ ├─ /api/subdomain/[subdomain]/profile ← GET user profile        │
│ ├─ /api/subdomain/[subdomain]/prompts ← GET public prompts      │
│ └─ /[subdomain]/page.tsx ← Renders user's prompt page           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            Backend API (FastAPI/Python)                         │
│  - /api/users/by-subdomain/{subdomain}                          │
│  - /api/users/{user_id}/public-prompts                          │
│  - /api/analytics/track-subdomain-visit                         │
│  - /api/analytics/subdomain-visits                              │
└─────────────────────────────────────────────────────────────────┘
```

## 1. Environment Variables

Create or update your `.env.local` file:

```env
# Base domain for your application
NEXT_PUBLIC_BASE_DOMAIN=creatopedia.tech

# Backend API endpoint
BACKEND_API_URL=http://localhost:8000
# or for production:
# BACKEND_API_URL=https://api.creatopedia.tech

# Secret for internal API calls (must match backend)
INTERNAL_API_SECRET=your-secret-key-here

# Analytics configuration
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

For **local development**, use:

```env
NEXT_PUBLIC_BASE_DOMAIN=localhost
BACKEND_API_URL=http://localhost:8000
INTERNAL_API_SECRET=dev-secret
```

## 2. Nginx Configuration

Configure your Nginx to forward subdomain requests to your Next.js app.

### Development (localhost):

```nginx
# Add to /etc/hosts or use local DNS
127.0.0.1 localhost
127.0.0.1 user1.localhost
127.0.0.1 user2.localhost
```

Then run Next.js on port 3000:

```bash
npm run dev
```

Access: `http://user1.localhost:3000`

### Production:

```nginx
# /etc/nginx/sites-available/creatopedia

# Main domain + all subdomains → Next.js
server {
    listen 80;
    server_name creatopedia.tech *.creatopedia.tech;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS for main domain and all subdomains
server {
    listen 443 ssl http2;
    server_name creatopedia.tech *.creatopedia.tech;

    # SSL certificates (use Let's Encrypt with wildcard)
    ssl_certificate /etc/letsencrypt/live/creatopedia.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/creatopedia.tech/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Forward to Next.js app
    location / {
        proxy_pass http://localhost:3000;

        # Forward original headers (IMPORTANT!)
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Cache static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/creatopedia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Get SSL Certificate (Wildcard):

```bash
sudo certbot certonly --manual --preferred-challenges=dns \
  -d creatopedia.tech \
  -d *.creatopedia.tech
```

Follow the prompts to add DNS TXT records for verification.

## 3. Backend API Requirements

Your backend needs to support these endpoints:

### Get User by Subdomain

```
GET /api/users/by-subdomain/{subdomain}

Headers:
  X-Internal-Secret: your-secret-key-here

Response:
{
  "id": "user123",
  "username": "john",
  "email": "john@example.com",
  "display_name": "John Doe",
  "bio": "Prompt engineer",
  "avatar_url": "https://...",
  "public_prompts_enabled": true,
  "allow_public_access": true
}
```

### Get User's Public Prompts

```
GET /api/users/{user_id}/prompts?include_public=true&limit=50&offset=0

Response:
{
  "prompts": [
    {
      "id": "prompt123",
      "title": "SEO Tips",
      "content": "...",
      "category": "Marketing",
      "access_type": "public",
      "created_at": "2024-05-31T10:00:00Z"
    }
  ]
}
```

### Track Subdomain Visit

```
POST /api/analytics/track-subdomain-visit

Headers:
  X-Internal-Secret: your-secret-key-here
  Content-Type: application/json

Body:
{
  "subdomain": "john",
  "path": "/",
  "user_email": "visitor@example.com",
  "ip_hash": "base64-encoded-hash",
  "user_agent": "Mozilla/5.0...",
  "timestamp": "2024-05-31T10:00:00Z"
}

Response:
{
  "success": true,
  "visit_id": "visit123"
}
```

### Get Analytics for Subdomain

```
GET /api/analytics/subdomain-visits?subdomain=john&days=30

Headers:
  X-Internal-Secret: your-secret-key-here

Response:
{
  "subdomain": "john",
  "total_visits": 156,
  "unique_visitors": 42,
  "last_7_days": 28,
  "top_paths": [
    { "path": "/", "visits": 100 },
    { "path": "/category/marketing", "visits": 28 }
  ],
  "traffic_by_date": [
    { "date": "2024-05-31", "visits": 12, "unique": 8 }
  ]
}
```

## 4. Using Analytics in Your Pages

### In Page Components:

```typescript
import { useSubdomainAnalytics } from "@/lib/hooks/useSubdomainAnalytics";

export default function HomePage() {
  // Track visits automatically on page load
  useSubdomainAnalytics({
    userEmail: "user@example.com", // optional
    customData: { /* additional tracking data */ }
  });

  return <div>Your content...</div>;
}
```

### Manual Visit Tracking:

```typescript
import { recordSubdomainVisit } from "@/lib/subdomain-utils";

// In an event handler
const handleAction = async () => {
  await recordSubdomainVisit("john", {
    path: "/prompts/special",
    userEmail: "visitor@example.com"
  });
};
```

## 5. Testing Locally

### 1. Update `/etc/hosts`:

```bash
sudo nano /etc/hosts

# Add these lines:
127.0.0.1 localhost
127.0.0.1 user1.localhost
127.0.0.1 user2.localhost
127.0.0.1 user3.localhost
```

### 2. Start your backend:

```bash
cd /home/dick_endra/Documents/Prompthub-backend
source .venv/bin/activate
python main.py
```

### 3. Start your Next.js app:

```bash
cd /home/dick_endra/Documents/Prompthub-backend/creatopedia
npm run dev
```

### 4. Test subdomain URLs:

- `http://localhost:3000` - Main domain
- `http://user1.localhost:3000` - User1's prompts
- `http://user2.localhost:3000/category/marketing` - User2's category filter
- `http://user1.localhost:3000?email=test@example.com` - Private access via email

## 6. Database Schema

Ensure your database has these tables (at minimum):

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(63) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url VARCHAR(255),
  allow_public_access BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  access_type VARCHAR(20) DEFAULT 'private', -- private, email, public
  allowed_emails TEXT[], -- JSON array of emails
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics table
CREATE TABLE subdomain_visits (
  id UUID PRIMARY KEY,
  subdomain VARCHAR(63) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  path VARCHAR(255),
  user_email VARCHAR(255),
  ip_hash VARCHAR(255),
  user_agent TEXT,
  visited_at TIMESTAMP DEFAULT NOW(),
  INDEX (subdomain, visited_at),
  INDEX (user_id, visited_at)
);
```

## 7. Security Best Practices

✅ **DO:**
- Always validate subdomains with `isValidSubdomain()` function
- Hash IPs before storing (never store raw IP addresses)
- Use HTTPS with SSL certificates
- Check `X-Internal-Secret` on backend endpoints
- Implement rate limiting on analytics endpoint
- Use secure CORS policies

❌ **DON'T:**
- Trust User-Agent strings for identification
- Store personally identifiable information without consent
- Expose internal API endpoints without authentication
- Use localhost in production

## 8. Troubleshooting

### Subdomain not working?

1. Check Host header is forwarded:
   ```bash
   curl -H "Host: user1.localhost" http://localhost:3000/
   ```

2. Verify `NEXT_PUBLIC_BASE_DOMAIN` in `.env.local`

3. Check middleware logs:
   ```bash
   npm run dev | grep -i subdomain
   ```

### Analytics not recording?

1. Check backend endpoint is accessible
2. Verify `INTERNAL_API_SECRET` matches backend
3. Check browser console for fetch errors

### Prompts not loading?

1. Verify user exists and has `allow_public_access = true`
2. Check backend `/api/users/by-subdomain/{subdomain}` response
3. Verify prompts have `access_type = 'public'` or matching email

## File Structure

```
creatopedia/
├── middleware.ts                              # Subdomain extraction
├── app/
│   ├── [subdomain]/
│   │   └── page.tsx                          # Public prompts page
│   └── api/
│       ├── analytics/
│       │   └── track-visit/route.ts           # Track visits
│       └── subdomain/
│           └── [subdomain]/
│               ├── profile/route.ts           # Get creator profile
│               └── prompts/route.ts           # Get public prompts
└── lib/
    ├── subdomain-utils.ts                    # Utility functions
    └── hooks/
        └── useSubdomainAnalytics.ts          # Analytics hook
```

---

**Next Step:** Configure your Nginx reverse proxy and start testing with subdomains!
