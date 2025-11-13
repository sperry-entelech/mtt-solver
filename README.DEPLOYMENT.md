# Production Deployment Guide

This guide covers deploying the MTT Poker Solver to production environments.

## Prerequisites

- Docker and Docker Compose installed
- Domain name configured (for SSL)
- Environment variables configured

## Quick Start

### 1. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your production values:

```bash
cp .env.example .env
# Edit .env with your production values
```

### 2. Start Production Services

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 3. Run Database Migrations

```bash
docker-compose exec backend npm run migration:migrate
```

### 4. Verify Deployment

- Frontend: http://your-domain.com
- Backend API: http://your-domain.com/api
- Health Check: http://your-domain.com/health
- Metrics: http://your-domain.com/metrics (if enabled)

## Monitoring Setup

### Enable Monitoring Stack

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile monitoring up -d
```

Access Grafana at http://your-domain.com:3001 (default credentials: admin/admin)

## SSL/TLS Configuration

### Option 1: Let's Encrypt (Recommended)

1. Install certbot
2. Generate certificates:
```bash
certbot certonly --standalone -d your-domain.com
```

3. Copy certificates to `nginx/ssl/`:
```bash
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

4. Restart nginx:
```bash
docker-compose restart nginx
```

### Option 2: Self-Signed (Development Only)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

## Database Backups

### Manual Backup

```bash
docker-compose exec postgres pg_dump -U postgres mtt_poker_solver > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Automated Backups

Set up a cron job or use a backup service to run backups regularly.

## Scaling

### Horizontal Scaling

Update `docker-compose.prod.yml` to increase replicas:

```yaml
backend:
  deploy:
    replicas: 3  # Increase as needed
```

### Resource Limits

Adjust CPU and memory limits in `docker-compose.prod.yml` based on your server capacity.

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:
- Runs tests on push/PR
- Builds Docker images
- Deploys to staging (develop branch)
- Deploys to production (main branch)

Configure deployment secrets in GitHub repository settings.

## Troubleshooting

### Check Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# Database connection
docker-compose exec backend npm run migration:migrate
```

### Reset Everything

```bash
docker-compose down -v
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up monitoring and alerts
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Secrets management in place

## Performance Optimization

1. Enable Redis caching
2. Configure database connection pooling
3. Use CDN for static assets
4. Enable gzip compression (already configured)
5. Set appropriate resource limits
6. Monitor and optimize slow queries

## Support

For issues or questions:
- Check logs: `docker-compose logs`
- Review health endpoint: `/health`
- Check metrics: `/metrics` (if enabled)
- Review monitoring dashboards in Grafana

