# 🚀 DEPLOYMENT CHECKLIST - Subdomain Multi-Tenant System

Complete checklist for deploying your production system.

## Pre-Deployment

### Backend Setup
- [ ] Created `.env` file in `/home/dick_endra/Documents/Prompthub-backend/`
- [ ] Generated `INTERNAL_API_SECRET` using: `openssl rand -base64 32`
- [ ] Set `ENVIRONMENT=production` in `.env`
- [ ] Set `DEBUG=false` in `.env`
- [ ] Updated `DATABASE_URL` with production database credentials
- [ ] Updated `FRONTEND_URL` to production domain
- [ ] Updated all other critical variables (SMTP, Storage, Stripe, Instagram)

### Frontend Setup
- [ ] Created `.env.local` in `/home/dick_endra/Documents/Prompthub-backend/creatopedia/`
- [ ] Copied `INTERNAL_API_SECRET` from backend `.env` (MUST MATCH!)
- [ ] Set `NEXT_PUBLIC_BASE_DOMAIN=creatopedia.tech`
- [ ] Set `BACKEND_API_URL=https://api.creatopedia.tech`
- [ ] Set `NODE_ENV=production`
- [ ] `.env` and `.env.local` are in `.gitignore`

### Verification
- [ ] Backend secrets verified: `grep INTERNAL_API_SECRET` in both .env files match
- [ ] No `.env` files committed to git: `git status`
- [ ] Database created and empty (no migrations yet)

---

## Database Setup

- [ ] PostgreSQL installed and running: `sudo systemctl status postgresql`
- [ ] Database created: `createdb prompthub_db`
- [ ] User created with permissions
- [ ] Alembic installed: `pip install alembic`
- [ ] Run migrations:
  ```bash
  cd /home/dick_endra/Documents/Prompthub-backend
  alembic upgrade head
  ```
- [ ] Create migration for SubdomainVisit:
  ```bash
  alembic revision --autogenerate -m "add_subdomain_visits"
  alembic upgrade head
  ```
- [ ] Verify tables created: `psql -l | grep prompthub`
- [ ] Backup strategy configured: `backup-db.sh` created
- [ ] Test database connection from app

---

## SSL Certificate Setup

- [ ] Domain DNS A records configured (both `creatopedia.tech` and `*.creatopedia.tech`)
- [ ] Nginx installed: `sudo apt install nginx certbot`
- [ ] DNS propagation verified: `nslookup creatopedia.tech`
- [ ] SSL certificate obtained:
  ```bash
  sudo certbot certonly --standalone --preferred-challenges dns \
    -d creatopedia.tech \
    -d *.creatopedia.tech
  ```
- [ ] Certificate location verified: `/etc/letsencrypt/live/creatopedia.tech/`
- [ ] Auto-renewal configured: `sudo systemctl enable certbot.timer`

---

## Nginx Configuration

- [ ] Nginx config file created at `/etc/nginx/sites-available/creatopedia`
- [ ] Config includes:
  - [ ] HTTPS redirect
  - [ ] SSL certificates configured
  - [ ] Host header forwarding
  - [ ] Security headers
  - [ ] GZIP compression
  - [ ] Rate limiting
  - [ ] Proper logging
- [ ] Site enabled:
  ```bash
  sudo ln -s /etc/nginx/sites-available/creatopedia /etc/nginx/sites-enabled/
  ```
- [ ] Config tested: `sudo nginx -t` (output: "ok")
- [ ] Nginx reloaded: `sudo systemctl reload nginx`
- [ ] Nginx status verified: `sudo systemctl status nginx`

---

## Backend Service Setup

- [ ] Virtual environment activated: `source .venv/bin/activate`
- [ ] Dependencies installed: `pip install -r requirements.txt`
- [ ] Service file created: `/etc/systemd/system/prompthub-backend.service`
- [ ] Service includes:
  - [ ] Correct working directory
  - [ ] EnvironmentFile pointing to `.env`
  - [ ] Correct Python interpreter path
  - [ ] Auto-restart on failure
- [ ] Service enabled: `sudo systemctl enable prompthub-backend`
- [ ] Service started: `sudo systemctl start prompthub-backend`
- [ ] Service status verified: `sudo systemctl status prompthub-backend`
- [ ] Logs checked: `sudo journalctl -u prompthub-backend -f` (no errors)

---

## Frontend Service Setup

- [ ] Node.js/npm installed and correct version
- [ ] Dependencies installed: `cd creatopedia && npm install`
- [ ] Build successful: `npm run build` (no errors)
- [ ] Service file created: `/etc/systemd/system/prompthub-frontend.service`
- [ ] Service includes:
  - [ ] Correct working directory
  - [ ] EnvironmentFile pointing to `.env.local`
  - [ ] NODE_ENV=production
  - [ ] Auto-restart on failure
- [ ] Service enabled: `sudo systemctl enable prompthub-frontend`
- [ ] Service started: `sudo systemctl start prompthub-frontend`
- [ ] Service status verified: `sudo systemctl status prompthub-frontend`
- [ ] Logs checked: `sudo journalctl -u prompthub-frontend -f` (no errors)

---

## API Endpoints Verification

### Backend Endpoints
- [ ] Health check: `curl https://creatopedia.tech/api/health`
  - Expected: `{"status": "ok", "app": "PromptHub"}`

- [ ] Get user by subdomain:
  ```bash
  curl -H "X-Internal-Secret: your-secret" \
    https://creatopedia.tech/api/users/by-subdomain/test
  ```
  - Expected: User profile or 404

- [ ] Get public prompts:
  ```bash
  curl https://creatopedia.tech/api/users/{creator_id}/prompts
  ```
  - Expected: Prompts array

- [ ] Track subdomain visit:
  ```bash
  curl -X POST https://creatopedia.tech/api/analytics/track-subdomain-visit \
    -H "X-Internal-Secret: your-secret" \
    -d '{"subdomain":"test","path":"/"}'
  ```
  - Expected: `{"success": true, "visit_id": "..."}`

- [ ] Get analytics:
  ```bash
  curl -H "X-Internal-Secret: your-secret" \
    "https://creatopedia.tech/api/analytics/subdomain-visits?subdomain=test"
  ```
  - Expected: Analytics object with visits, unique_visitors, etc.

### Frontend Functionality
- [ ] Main domain loads: `https://creatopedia.tech/` (no errors)
- [ ] Subdomain routing works: `https://test.creatopedia.tech/` (displays prompts)
- [ ] Analytics tracking works: Visit subdomain, check browser console for successful POST
- [ ] SSL certificate valid: Click lock icon, verify certificate details

---

## Security Verification

- [ ] HTTPS enforced: `curl http://creatopedia.tech` redirects to HTTPS
- [ ] Security headers present:
  ```bash
  curl -I https://creatopedia.tech | grep -i "strict-transport"
  ```
  - Should see: `Strict-Transport-Security`

- [ ] Secrets not in git:
  ```bash
  git status
  git log --all --full-history -- ".env"
  ```
  - Should be clean (no .env files)

- [ ] INTERNAL_API_SECRET validation:
  - [ ] Wrong secret returns 403: 
    ```bash
    curl -H "X-Internal-Secret: wrong" \
      https://creatopedia.tech/api/analytics/subdomain-visits?subdomain=test
    ```

- [ ] X-Frame-Options header present: `curl -I https://creatopedia.tech | grep X-Frame`

---

## Performance & Monitoring

- [ ] CPU usage normal: `top` (not constantly over 80%)
- [ ] Memory usage normal: `free -h` (not full)
- [ ] Disk space sufficient: `df -h /` (at least 20% free)
- [ ] Database connections healthy:
  ```bash
  psql -c "SELECT count(*) FROM pg_stat_activity;"
  ```
  - Should be under DATABASE_POOL_SIZE + DATABASE_MAX_OVERFLOW

- [ ] Nginx error log clean: `sudo tail /var/log/nginx/creatopedia_error.log`
  - Should have no errors
  
- [ ] Service logs monitored:
  ```bash
  sudo journalctl -u prompthub-backend --since "10 minutes ago"
  sudo journalctl -u prompthub-frontend --since "10 minutes ago"
  ```
  - Should show normal operation

---

## Backup & Recovery

- [ ] Database backup script created: `/home/dick_endra/backup-db.sh`
- [ ] Backup script executable: `chmod +x /home/dick_endra/backup-db.sh`
- [ ] Test backup: `/home/dick_endra/backup-db.sh` (succeeds)
- [ ] Backup location verified: `ls -lh /home/dick_endra/backups/`
- [ ] Cron job configured: `crontab -l | grep backup-db`
  - Should show: `0 2 * * * /home/dick_endra/backup-db.sh`

- [ ] Recovery tested:
  ```bash
  # Simulate recovery (don't actually do this in production!)
  # Just verify you could restore from backup
  ```

---

## Documentation & Handoff

- [ ] Production setup doc reviewed: `PRODUCTION_SETUP.md`
- [ ] Environment variables doc reviewed: `ENV_VARIABLES_REFERENCE.md`
- [ ] Subdomain setup doc reviewed: `docs/SUBDOMAIN_SETUP.md`
- [ ] Quick start guide reviewed: `SUBDOMAIN_QUICK_START.md`
- [ ] Runbook created with:
  - [ ] Common commands (status, logs, restart)
  - [ ] Troubleshooting steps
  - [ ] Emergency procedures
  - [ ] On-call escalation

---

## Final Testing (24 Hours Before Production)

### Day 1 - Functional Testing
- [ ] Create test user with subdomain "test"
- [ ] Publish test prompts for user
- [ ] Visit `https://test.creatopedia.tech`
- [ ] Verify profile loads
- [ ] Verify prompts display
- [ ] Check analytics show visit

### Load Testing (Optional but Recommended)
- [ ] Simulate 100 concurrent users
- [ ] Monitor response times
- [ ] Check for errors or timeouts
- [ ] Verify analytics still tracking

### Security Testing
- [ ] Attempt to access with wrong INTERNAL_API_SECRET
- [ ] Attempt SQL injection in subdomain parameter
- [ ] Check for sensitive data in logs
- [ ] Verify CORS headers correct

---

## Go-Live Checklist

- [ ] Team notified: Production going live
- [ ] DNS cutover (if not already done): Update domain to point to production IP
- [ ] Monitor alerts set up: Get notified of high error rates
- [ ] Status page updated: If you have one
- [ ] Team ready for support: Standby for issues
- [ ] Rollback plan ready: Just in case

### First Hour
- [ ] Monitor error logs: `sudo journalctl -u prompthub-backend -f`
- [ ] Monitor Nginx logs: `sudo tail -f /var/log/nginx/creatopedia_error.log`
- [ ] Check database performance: `psql -c "SELECT * FROM pg_stat_statements;"`
- [ ] Monitor CPU/Memory: `htop`
- [ ] Test with real users: Visit a few subdomains, verify they work

### First 24 Hours
- [ ] Keep monitoring
- [ ] Watch for unusual patterns
- [ ] Document any issues found
- [ ] Gradual traffic increase (if not already at full volume)

---

## Post-Launch (First Week)

- [ ] Monitor analytics data quality
- [ ] Check backup integrity
- [ ] Review logs for any patterns
- [ ] Perform penetration testing
- [ ] Get user feedback
- [ ] Performance baseline established
- [ ] Incident response tested (if there were any)

---

## Sign-Off

- [ ] Deployed by: _________________ Date: _________
- [ ] Verified by: _________________ Date: _________
- [ ] Ready for traffic: [ ] YES [ ] NO

---

**Status:** ✅ READY FOR PRODUCTION

All systems configured, tested, and ready for deployment!
