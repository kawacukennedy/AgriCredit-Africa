# AgriCredit Deployment Guide

This guide provides comprehensive instructions for deploying AgriCredit to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Deployment](#database-deployment)
4. [Smart Contract Deployment](#smart-contract-deployment)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Monitoring Setup](#monitoring-setup)
8. [Security Configuration](#security-configuration)
9. [Post-Deployment Verification](#post-deployment-verification)

## Prerequisites

### System Requirements

- **Node.js**: 20.x or later
- **Python**: 3.11 or later
- **Docker**: 24.x or later
- **Git**: 2.x or later

### Cloud Accounts

- **Supabase**: For database hosting
- **Vercel**: For frontend hosting
- **Railway/Heroku**: For backend hosting
- **Infura/Alchemy**: For blockchain RPC
- **PolygonScan**: For contract verification

### API Keys and Secrets

Required environment variables:
```bash
# Database
DATABASE_URL=postgresql://...

# Blockchain
POLYGON_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=your_deployer_private_key

# External APIs
OPENWEATHER_API_KEY=...
INFURA_PROJECT_ID=...

# Cloud Services
VERCEL_TOKEN=...
RAILWAY_TOKEN=...
```

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/agricredit.git
cd agricredit
```

### 2. Install Dependencies

```bash
# Root dependencies
npm ci

# Frontend
cd src && npm ci && cd ..

# Backend
cd backend && pip install -r requirements.txt && cd ..
```

### 3. Configure Environment

Create `.env` files in respective directories:

```bash
# .env (root)
NODE_ENV=production
VERCEL_ENV=production

# backend/.env
DATABASE_URL=...
REDIS_URL=...
SECRET_KEY=...

# src/.env.local
NEXT_PUBLIC_API_URL=...
NEXT_PUBLIC_CONTRACT_ADDRESS=...
```

## Database Deployment

### Using Supabase

1. **Create Supabase Project**
   ```bash
   # Via CLI (if available) or dashboard
   supabase projects create agricredit-prod
   ```

2. **Deploy Schema**
   ```bash
   # Connect to Supabase SQL Editor
   # Execute contents of final_database_schema.sql
   ```

3. **Configure Authentication**
   - Enable email confirmations
   - Set up OAuth providers if needed
   - Configure JWT secrets

4. **Set Up Storage**
   - Create buckets for IPFS fallbacks
   - Configure CORS policies

### Verification

```bash
cd backend
python test_db_connection.py
```

## Smart Contract Deployment

### 1. Configure Networks

Update `hardhat.config.js`:

```javascript
networks: {
  polygon: {
    url: process.env.POLYGON_RPC_URL,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

### 2. Deploy Contracts

```bash
npx hardhat run scripts/deploy.js --network polygon
```

### 3. Verify Contracts

```bash
npx hardhat verify --network polygon CONTRACT_ADDRESS "Constructor Args"
```

### 4. Update Frontend Config

Update contract addresses in `src/lib/contracts.ts`

## Backend Deployment

### Option 1: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init agricredit-backend

# Deploy
railway up
```

### Option 2: Docker

```bash
# Build image
docker build -t agricredit-backend ./backend

# Run container
docker run -p 8000:8000 agricredit-backend
```

### Environment Variables

Set production environment variables in your hosting platform:

```bash
DATABASE_URL=...
REDIS_URL=...
SECRET_KEY=...
CORS_ORIGINS=https://your-frontend-domain.com
```

## Frontend Deployment

### Using Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd src
vercel --prod
```

### Build Configuration

Ensure `vercel.json` is configured:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "out",
  "framework": "nextjs"
}
```

### Environment Variables

Set in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_INFURA_ID`

## Monitoring Setup

### 1. Deploy Monitoring Stack

```bash
cd monitoring
docker-compose up -d
```

### 2. Configure Prometheus

Update `prometheus.yml` with your service endpoints:

```yaml
scrape_configs:
  - job_name: 'agricredit-backend'
    static_configs:
      - targets: ['your-backend-url:8000']
```

### 3. Set Up Alerts

Configure alert rules in `alert_rules.yml`:

```yaml
groups:
  - name: agricredit
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
```

### 4. Grafana Dashboards

Import pre-configured dashboards for:
- Application metrics
- Database performance
- Blockchain interactions
- AI model performance

## Security Configuration

### 1. SSL/TLS

- Enable HTTPS on all services
- Configure SSL certificates
- Set up certificate auto-renewal

### 2. Firewall Rules

```bash
# Allow only necessary ports
ufw allow 80
ufw allow 443
ufw allow 22
ufw --force enable
```

### 3. API Security

- Implement rate limiting
- Enable CORS properly
- Set up API authentication
- Configure API gateways

### 4. Database Security

- Enable RLS policies
- Set up database backups
- Configure connection pooling
- Monitor for security vulnerabilities

## Post-Deployment Verification

### 1. Health Checks

```bash
# Frontend
curl -f https://your-frontend-domain.com

# Backend
curl -f https://your-backend-domain.com/health

# Database
curl -f https://your-supabase-project.supabase.co/rest/v1/
```

### 2. Functional Tests

```bash
# Run integration tests
npm run test:e2e

# Test smart contracts
npx hardhat test --network polygon
```

### 3. Performance Testing

```bash
# Load testing
npm run test:load

# Monitor response times
# Check monitoring dashboards
```

### 4. Security Audit

```bash
# Run security scans
npm run audit

# Check contract vulnerabilities
npx hardhat run scripts/security-audit.js
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify DATABASE_URL
   - Check Supabase project status
   - Ensure IP allowlist

2. **Contract Deployment Failed**
   - Verify RPC URL and private key
   - Check gas prices
   - Ensure sufficient funds

3. **Frontend Build Failed**
   - Check Node.js version
   - Verify environment variables
   - Clear build cache

4. **Backend Startup Failed**
   - Check Python dependencies
   - Verify environment variables
   - Check database connectivity

### Logs and Monitoring

- Check Vercel deployment logs
- Monitor Railway/Heroku logs
- Review Supabase logs
- Check monitoring dashboards

## Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   npm audit fix
   pip install --upgrade -r requirements.txt
   ```

2. **Database Backups**
   - Automated via Supabase
   - Verify backup integrity monthly

3. **Security Updates**
   - Monitor vulnerability alerts
   - Apply patches promptly

4. **Performance Monitoring**
   - Review metrics weekly
   - Optimize slow queries

### Scaling

- **Horizontal Scaling**: Add more backend instances
- **Database Scaling**: Upgrade Supabase plan
- **CDN**: Use Vercel's global edge network
- **Caching**: Implement Redis clusters

## Support

For deployment issues:
- Check documentation
- Review GitHub issues
- Contact DevOps team
- Check monitoring alerts

---

**Last updated**: December 2025
**Version**: 1.0.0