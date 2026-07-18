# Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Docker Deployment](#docker-deployment)
4. [AWS Deployment](#aws-deployment)
5. [Vercel (Frontend)](#vercel-frontend)
6. [Mobile App (Expo EAS)](#mobile-app)
7. [SSL/TLS with Let's Encrypt](#ssl-tls)
8. [CI/CD Pipeline](#cicd-pipeline)

---

## Prerequisites

- Domain name configured with DNS
- Ubuntu 22.04 LTS server (minimum 2 vCPU, 4 GB RAM)
- Docker + Docker Compose installed
- AWS account (for S3 storage)
- Stripe account
- Google Cloud Console project (OAuth)

---

## Environment Configuration

```bash
cp .env.example .env
nano .env
```

Critical production values:
```bash
NODE_ENV=production
JWT_SECRET=<minimum-32-char-random-string>
DB_PASSWORD=<strong-database-password>
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
STRIPE_SECRET_KEY=sk_live_...
GOOGLE_CLIENT_ID=<your-google-client-id>
```

---

## Docker Deployment

### 1. Clone and configure
```bash
git clone https://github.com/yourorg/music-app.git
cd music-app
cp .env.example .env
# Edit .env with production values
```

### 2. Build and start
```bash
docker-compose up -d --build

# Check services are healthy
docker-compose ps
```

### 3. Database setup
```bash
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed
```

### 4. Verify deployment
```bash
curl http://localhost:5000/health
```

---

## AWS Deployment

### S3 Bucket Setup
1. Create S3 bucket (e.g., `my-music-app`)
2. Enable CORS:
```json
[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
  "AllowedOrigins": ["https://yourdomain.com"],
  "MaxAgeSeconds": 3000
}]
```

### RDS PostgreSQL
1. Create RDS PostgreSQL 16 instance
2. Enable VPC security group for EC2 access
3. Update `DATABASE_URL` in `.env`

### ElastiCache Redis
1. Create Redis cluster
2. Update `REDIS_URL` in `.env`

---

## Vercel (Frontend)

```bash
cd frontend-web
npx vercel --prod

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Mobile App (Expo EAS)

### Setup
```bash
npm install -g eas-cli
eas login
cd mobile
eas build:configure
```

### Environment
Create `mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### Build & Submit
```bash
# Android
eas build --platform android --profile production
eas submit --platform android

# iOS
eas build --platform ios --profile production
eas submit --platform ios
```

---

## SSL/TLS with Let's Encrypt

```bash
# Install Certbot
apt-get install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

Update `docker/nginx.conf` to redirect HTTP → HTTPS and reference SSL certs.

---

## Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://api.yourdomain.com/api/subscriptions/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

---

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/music-app
            git pull origin main
            docker-compose up -d --build
            docker-compose exec -T backend npm run migrate
```

---

## Performance Tuning

### PostgreSQL
```sql
-- Run in psql after deployment
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
SELECT pg_reload_conf();
```

### Redis
```bash
# In docker-compose.yml, add to redis service:
command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### Node.js (Backend)
```bash
# Set in .env:
NODE_OPTIONS=--max-old-space-size=512
```

---

## Monitoring

### Health check
```bash
curl https://api.yourdomain.com/health
```

### Logs
```bash
docker-compose logs -f backend --tail=100
```

### Database size
```sql
SELECT pg_size_pretty(pg_database_size('musicapp'));
```
