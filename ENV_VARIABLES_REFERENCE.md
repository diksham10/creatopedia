# Environment Variables Reference

Quick reference for all environment variables needed for production deployment.

## Backend (.env)

Location: `/home/dick_endra/Documents/Prompthub-backend/.env`

```bash
# ============================================
# CRITICAL - Change These Immediately
# ============================================

# Use: openssl rand -base64 32
INTERNAL_API_SECRET=generate-random-32-char-secret-here

# Use: openssl rand -base64 32
CRON_SECRET=generate-random-32-char-cron-secret

# Use: openssl rand -base64 32
SECRET_KEY=generate-random-32-char-jwt-secret

# Your actual database credentials
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/prompthub

# ============================================
# Application Settings
# ============================================

APP_NAME=PromptHub
ENVIRONMENT=production
DEBUG=false
API_PREFIX=/api

# ============================================
# Security
# ============================================

ALGORITHM=HS256

# Access token expiration (minutes)
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Refresh token expiration (days)
REFRESH_TOKEN_EXPIRE_DAYS=7

# ============================================
# CORS (Allow Frontend Domains)
# ============================================

# Comma-separated list
ALLOWED_ORIGINS=https://creatopedia.tech,https://*.creatopedia.tech,http://localhost:3000

# ============================================
# Email Configuration
# ============================================

SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SENDER_EMAIL=noreply@creatopedia.tech
SENDER_NAME=PromptHub

# ============================================
# Storage (B2 Cloud Storage)
# ============================================

# Get from https://www.backblaze.com/b2/cloud-storage.html
B2_ACCOUNT_ID=your-b2-account-id
B2_APPLICATION_KEY=your-b2-app-key
B2_BUCKET_NAME=prompthub-media
B2_BUCKET_URL=https://your-bucket-name.s3.amazonaws.com

# ============================================
# OR Use AWS S3
# ============================================

# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
# AWS_S3_BUCKET=prompthub-media
# AWS_S3_REGION=us-east-1

# ============================================
# Stripe Integration (Optional)
# ============================================

STRIPE_SECRET_KEY=sk_live_your-live-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-live-publishable-key

# ============================================
# Instagram Integration
# ============================================

INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret

# Redirect after Instagram login
INSTAGRAM_CALLBACK_URL=https://api.creatopedia.tech/api/integrations/instagram/callback

# ============================================
# Frontend URLs
# ============================================

FRONTEND_URL=https://creatopedia.tech

# For logging/analytics
LOG_LEVEL=INFO

# ============================================
# Database Settings
# ============================================

# Connection pooling
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# ============================================
# Redis (Optional - for caching)
# ============================================

# REDIS_URL=redis://localhost:6379/0

# ============================================
# Sentry (Error Tracking - Optional)
# ============================================

# SENTRY_DSN=https://...@sentry.io/...
```

## Frontend (.env.local)

Location: `/home/dick_endra/Documents/Prompthub-backend/creatopedia/.env.local`

```bash
# ============================================
# CRITICAL - Must Match Backend Secret
# ============================================

# MUST match backend INTERNAL_API_SECRET exactly
INTERNAL_API_SECRET=same-secret-as-backend

# ============================================
# Multi-Tenant / Subdomain Configuration
# ============================================

# Base domain without protocol
NEXT_PUBLIC_BASE_DOMAIN=creatopedia.tech

# Backend API endpoint
BACKEND_API_URL=https://api.creatopedia.tech

# ============================================
# Analytics
# ============================================

NEXT_PUBLIC_ANALYTICS_ENABLED=true

# ============================================
# Stripe (Public)
# ============================================

NEXT_PUBLIC_STRIPE_KEY=pk_live_your-live-publishable-key

# ============================================
# Instagram (Public)
# ============================================

NEXT_PUBLIC_INSTAGRAM_APP_ID=your-instagram-app-id

# ============================================
# App Settings
# ============================================

NODE_ENV=production
```

## How to Generate Secrets

### Using OpenSSL (Recommended)

```bash
# Generate 32-character random secret
openssl rand -base64 32

# Example output:
# 7jK+mL9pQ2xR8sT1uV4wXyZ3aB5cD6eF7gH8iJ9kL0mN1oP2qR3sT4uV5wX6yZ7aB8c
```

### Using Python

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Using Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Validation Checklist

Before deploying to production:

```bash
# ✓ Backend .env file created
[ ] cp /home/dick_endra/Documents/Prompthub-backend/.env.example /home/dick_endra/Documents/Prompthub-backend/.env
[ ] Edit and fill in all CRITICAL variables

# ✓ Frontend .env.local file created  
[ ] cp /home/dick_endra/Documents/Prompthub-backend/creatopedia/.env.local.example \
       /home/dick_endra/Documents/Prompthub-backend/creatopedia/.env.local
[ ] Edit and fill in all variables

# ✓ Verify secrets match
[ ] Backend INTERNAL_API_SECRET == Frontend INTERNAL_API_SECRET
[ ] Backend DATABASE_URL points to production DB
[ ] Backend FRONTEND_URL == Frontend NEXT_PUBLIC_BASE_DOMAIN

# ✓ Security
[ ] No .env files in git (check .gitignore)
[ ] ENVIRONMENT=production in backend
[ ] DEBUG=false in backend
[ ] NODE_ENV=production in frontend

# ✓ Database
[ ] Database created and migrations applied
[ ] Backup strategy in place

# ✓ SSL Certificates
[ ] Wildcard SSL certificate obtained
[ ] Certificate path correct in Nginx config
[ ] HSTS headers enabled

# ✓ Nginx
[ ] Config file in place (/etc/nginx/sites-available/creatopedia)
[ ] Site enabled (symlink in /etc/nginx/sites-enabled/)
[ ] Config tested (sudo nginx -t)
[ ] Service running (sudo systemctl status nginx)

# ✓ Services
[ ] Backend service running (sudo systemctl status prompthub-backend)
[ ] Frontend service running (sudo systemctl status prompthub-frontend)
[ ] Auto-restart enabled (sudo systemctl is-enabled prompthub-backend)

# ✓ Testing
[ ] Health check: curl https://creatopedia.tech/api/health
[ ] Main domain: https://creatopedia.tech
[ ] Subdomain: curl -H "Host: test.creatopedia.tech" https://creatopedia.tech/
[ ] Analytics: Visit a subdomain page, check /api/analytics/subdomain-visits
```

## Common Issues & Fixes

### "Internal API Secret not provided" Error

**Cause:** Frontend and backend secrets don't match

**Fix:**
```bash
# Backend
grep INTERNAL_API_SECRET /home/dick_endra/Documents/Prompthub-backend/.env

# Frontend
grep INTERNAL_API_SECRET /home/dick_endra/Documents/Prompthub-backend/creatopedia/.env.local

# They must be identical!
```

### "Database connection failed"

**Cause:** DATABASE_URL is incorrect or database is down

**Fix:**
```bash
# Test PostgreSQL connection
psql -U postgres -h localhost -d prompthub

# Check service
sudo systemctl status postgresql

# View logs
sudo journalctl -u postgresql -f
```

### "Subdomain not detected"

**Cause:** Nginx not forwarding Host header properly

**Fix:**
```bash
# Verify in Nginx config
sudo grep "proxy_set_header Host" /etc/nginx/sites-enabled/creatopedia

# Should see: proxy_set_header Host $host;

# Test with curl
curl -H "Host: test.creatopedia.tech" http://localhost:3000/

# Check backend logs
sudo journalctl -u prompthub-backend -f
```

### "SSL Certificate Expired"

**Fix:**
```bash
# Check expiration
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Check logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

## Secret Storage Best Practices

### ✅ DO

- Use a secrets manager (AWS Secrets Manager, Vault, etc.)
- Rotate secrets regularly (3-6 months)
- Use strong random values (32+ characters)
- Never commit .env files to git
- Use different secrets for each environment
- Log which secrets were accessed (audit trail)

### ❌ DON'T

- Use hardcoded secrets in code
- Use simple/guessable secrets
- Share secrets in chat/email
- Commit .env to version control
- Use same secret for dev and production
- Log secret values

---

**Need help?** Check `PRODUCTION_SETUP.md` for complete deployment guide.
