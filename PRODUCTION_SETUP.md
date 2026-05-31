# Production Setup: Subdomain Multi-Tenant System

Complete guide for deploying subdomain system to production with Nginx, SSL, and all environment variables.

## 📋 Architecture

```
┌──────────────────────────────────────────────────────┐
│         Internet (User Visiting Subdomains)          │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│         Nginx Reverse Proxy (Port 80/443)            │
│  - Listens on: *.creatopedia.tech                    │
│  - Forwards Host header to backend                   │
│  - Handles SSL/TLS certificates                      │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│    Next.js Frontend Application (Port 3000)          │
│  - Extracts subdomain from Host header               │
│  - Serves public prompt pages                        │
│  - Tracks visits via analytics hooks                 │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│    FastAPI Backend Application (Port 8000)           │
│  - Looks up users by subdomain                       │
│  - Serves public prompts                             │
│  - Records analytics data                            │
└──────────────────────────────────────────────────────┘
```

## 🔧 Backend Environment Variables

Create `.env` file in `/home/dick_endra/Documents/Prompthub-backend/`:

```bash
# ============================================
# Application Settings
# ============================================
APP_NAME=PromptHub
ENVIRONMENT=production
DEBUG=false
API_PREFIX=/api

# ============================================
# Database
# ============================================
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/prompthub_db

# ============================================
# Security & Secrets
# ============================================
# Used to validate requests from Next.js frontend
INTERNAL_API_SECRET=your-super-secret-key-change-this-in-production

# Used for cron jobs that aggregate stats
CRON_SECRET=your-cron-secret-key

# JWT secrets for auth
SECRET_KEY=your-jwt-secret-key
ALGORITHM=HS256

# ============================================
# CORS Settings
# ============================================
# Allow requests from Next.js subdomains
ALLOWED_ORIGINS=http://localhost:3000,https://creatopedia.tech,https://*.creatopedia.tech

# ============================================
# Email & Notifications
# ============================================
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SENDER_EMAIL=noreply@creatopedia.tech

# ============================================
# Storage (B2 Cloud Storage or S3)
# ============================================
B2_ACCOUNT_ID=your-b2-account-id
B2_APPLICATION_KEY=your-b2-app-key
B2_BUCKET_NAME=prompthub-media

# Or use S3:
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_S3_BUCKET=prompthub-media

# ============================================
# Stripe (Optional - for payments)
# ============================================
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# ============================================
# Instagram Integration
# ============================================
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret

# ============================================
# Frontend URL
# ============================================
FRONTEND_URL=https://creatopedia.tech
# For subdomains, use wildcard:
# SUBDOMAIN_FRONTEND_URL=https://*.creatopedia.tech
```

## 🔗 Frontend Environment Variables (.env.local)

Create `.env.local` in `/home/dick_endra/Documents/Prompthub-backend/creatopedia/`:

```bash
# ============================================
# Subdomain & Multi-tenant Configuration
# ============================================
NEXT_PUBLIC_BASE_DOMAIN=creatopedia.tech
BACKEND_API_URL=https://api.creatopedia.tech
INTERNAL_API_SECRET=your-super-secret-key-change-this-in-production

# ============================================
# Analytics
# ============================================
NEXT_PUBLIC_ANALYTICS_ENABLED=true

# ============================================
# Other Configuration
# ============================================
NEXT_PUBLIC_STRIPE_KEY=pk_live_...
NEXT_PUBLIC_INSTAGRAM_APP_ID=your-instagram-app-id
```

## 🚀 Nginx Configuration

### Step 1: Install Nginx

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

### Step 2: Create Nginx Config

Create `/etc/nginx/sites-available/creatopedia`:

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name creatopedia.tech *.creatopedia.tech;

    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - Main server block for all subdomains
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name creatopedia.tech *.creatopedia.tech;

    # ============================================
    # SSL Configuration (Let's Encrypt Wildcard)
    # ============================================
    ssl_certificate /etc/letsencrypt/live/creatopedia.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/creatopedia.tech/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS - Force HTTPS for 1 year
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Logging
    access_log /var/log/nginx/creatopedia_access.log combined;
    error_log /var/log/nginx/creatopedia_error.log;

    # Client upload size limit
    client_max_body_size 100M;

    # ============================================
    # Gzip Compression
    # ============================================
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml application/atom+xml image/svg+xml 
               text/x-component text/x-cross-domain-policy;

    # ============================================
    # Rate Limiting
    # ============================================
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=analytics:10m rate=100r/s;
    limit_req zone=general burst=20 nodelay;

    # ============================================
    # API Routes (Backend)
    # ============================================
    location /api/ {
        limit_req zone=analytics burst=50 nodelay;
        
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;

        # Forward original request headers (IMPORTANT!)
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # ============================================
    # Frontend Routes (Next.js)
    # ============================================
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Forward original headers (IMPORTANT for subdomains!)
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # ============================================
    # Static Assets (Cache Busting with Hash)
    # ============================================
    location ~* ^/_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 30d;
        proxy_cache_bypass $http_cache_control;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # ============================================
    # Image Optimization (Next.js)
    # ============================================
    location ~* ^/_next/image {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 7d;
        add_header Cache-Control "public, max-age=604800";
        access_log off;
    }

    # ============================================
    # Favicon & Robots (Cache)
    # ============================================
    location = /favicon.ico {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 30d;
        add_header Cache-Control "public, max-age=2592000";
        access_log off;
    }

    location = /robots.txt {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 1d;
        add_header Cache-Control "public, max-age=86400";
    }

    # ============================================
    # Deny Access to Hidden Files
    # ============================================
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### Step 3: Enable the Site

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/creatopedia /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 4: Get SSL Certificate (Wildcard)

```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Get wildcard certificate from Let's Encrypt
sudo certbot certonly --standalone --preferred-challenges dns \
  -d creatopedia.tech \
  -d *.creatopedia.tech

# Start Nginx again
sudo systemctl start nginx

# Auto-renew (crontab)
sudo certbot renew --quiet
```

### Step 5: Enable Auto-Renewal

```bash
# Create renewal timer
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify
sudo systemctl status certbot.timer
```

## 🗄️ Database Setup

### Create Alembic Migration for SubdomainVisit

```bash
cd /home/dick_endra/Documents/Prompthub-backend

# Create migration
alembic revision --autogenerate -m "add_subdomain_visits_table"

# Apply migration
alembic upgrade head
```

### SQL for SubdomainVisit Table (if needed manually)

```sql
CREATE TABLE subdomain_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subdomain VARCHAR(63) NOT NULL,
    creator_id UUID REFERENCES creators(id) ON DELETE SET NULL,
    path VARCHAR(255) DEFAULT '/',
    user_email VARCHAR(255),
    ip_hash VARCHAR(255),
    user_agent TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
);

-- Create indexes for performance
CREATE INDEX idx_subdomain_visits_subdomain ON subdomain_visits(subdomain);
CREATE INDEX idx_subdomain_visits_creator_id ON subdomain_visits(creator_id);
CREATE INDEX idx_subdomain_visits_ip_hash ON subdomain_visits(ip_hash);
CREATE INDEX idx_subdomain_visits_created_at ON subdomain_visits(created_at);
CREATE INDEX idx_subdomain_visits_subdomain_created ON subdomain_visits(subdomain, created_at);
```

## 🚀 Deployment Steps

### 1. Install Dependencies

#### Backend:
```bash
cd /home/dick_endra/Documents/Prompthub-backend
source .venv/bin/activate
pip install -r requirements.txt
```

#### Frontend:
```bash
cd /home/dick_endra/Documents/Prompthub-backend/creatopedia
npm install
npm run build
```

### 2. Start Services with Systemd

#### Backend Service

Create `/etc/systemd/system/prompthub-backend.service`:

```ini
[Unit]
Description=PromptHub FastAPI Backend
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=notify
User=dick_endra
WorkingDirectory=/home/dick_endra/Documents/Prompthub-backend
Environment="PATH=/home/dick_endra/Documents/Prompthub-backend/.venv/bin"
EnvironmentFile=/home/dick_endra/Documents/Prompthub-backend/.env
ExecStart=/home/dick_endra/Documents/Prompthub-backend/.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable prompthub-backend
sudo systemctl start prompthub-backend
sudo systemctl status prompthub-backend
```

#### Frontend Service

Create `/etc/systemd/system/prompthub-frontend.service`:

```ini
[Unit]
Description=PromptHub Next.js Frontend
After=network.target

[Service]
Type=simple
User=dick_endra
WorkingDirectory=/home/dick_endra/Documents/Prompthub-backend/creatopedia
Environment="NODE_ENV=production"
EnvironmentFile=/home/dick_endra/Documents/Prompthub-backend/creatopedia/.env.local
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable prompthub-frontend
sudo systemctl start prompthub-frontend
sudo systemctl status prompthub-frontend
```

### 3. Monitor Logs

```bash
# Backend logs
sudo journalctl -u prompthub-backend -f

# Frontend logs
sudo journalctl -u prompthub-frontend -f

# Nginx logs
sudo tail -f /var/log/nginx/creatopedia_access.log
sudo tail -f /var/log/nginx/creatopedia_error.log
```

## 🔐 Security Checklist

- ✅ Use strong `INTERNAL_API_SECRET` (32+ characters, random)
- ✅ Use strong database password
- ✅ Use SSL/TLS with wildcard certificate
- ✅ Enable HSTS headers in Nginx
- ✅ Keep dependencies updated (`pip install --upgrade-all`, `npm update`)
- ✅ Set `DEBUG=false` in production
- ✅ Use environment-specific secrets (never commit .env)
- ✅ Implement rate limiting on analytics endpoints
- ✅ Enable CORS only for trusted origins
- ✅ Use firewall rules to restrict access (allow only 80, 443)

## 📊 Monitoring

### Health Checks

```bash
# Check backend health
curl https://creatopedia.tech/api/health

# Check frontend is up
curl -I https://creatopedia.tech/

# Check subdomain routing
curl -H "Host: john.creatopedia.tech" https://creatopedia.tech/
```

### Database Monitoring

```bash
# Monitor active connections
psql -U user -d prompthub_db -c "SELECT count(*) FROM pg_stat_activity;"

# Check table sizes
psql -U user -d prompthub_db -c "\dt+"

# Vacuum and analyze
psql -U user -d prompthub_db -c "VACUUM ANALYZE;"
```

## 🔄 Backup Strategy

### Daily Database Backup

Create `/home/dick_endra/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/dick_endra/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/prompthub_db_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

pg_dump -U user prompthub_db | gzip > $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

Add to crontab:

```bash
crontab -e
# Add: 0 2 * * * /home/dick_endra/backup-db.sh
```

## 📈 Performance Tuning

### Nginx Tuning

```nginx
# In /etc/nginx/nginx.conf, increase worker connections:
events {
    worker_connections 4096;
    use epoll;
}

# Increase open files limit
worker_rlimit_nofile 65535;
```

### Database Connection Pool

In FastAPI config (`app/core/config.py`):

```python
# Adjust for production workload
DATABASE_POOL_SIZE = 20  # Default connections
DATABASE_MAX_OVERFLOW = 10  # Extra connections
```

### Next.js Optimization

In `creatopedia/next.config.ts`:

```typescript
// Enable optimizations
const config: NextConfig = {
  compress: true,
  productionBrowserSourceMaps: false,
  // ... other settings
};
```

## 🆘 Troubleshooting

### Subdomain Not Working

```bash
# Check Nginx is forwarding Host header
sudo nginx -T | grep -A 5 "proxy_set_header Host"

# Test with curl
curl -H "Host: john.creatopedia.tech" http://localhost:3000/
```

### SSL Certificate Issues

```bash
# Check certificate expiration
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Check logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### High Memory Usage

```bash
# Check processes
ps aux --sort=-%mem | head

# Monitor with htop
htop
```

---

**Deployment complete!** Your subdomain multi-tenant system is ready for production. 🎉
