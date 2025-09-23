# 🚀 MTT Poker Solver - Deployment Guide

## Quick Start (Recommended)

### 1. Docker Deployment (One Command)
```bash
# Navigate to project directory
cd C:\Users\spder\mtt-poker-solver

# Start everything with Docker
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# Database: localhost:5432
```

## Development Setup

### 1. Install Dependencies

#### Backend Setup
```bash
cd C:\Users\spder\mtt-poker-solver\backend
npm install
```

#### Frontend Setup
```bash
cd C:\Users\spder\mtt-poker-solver\frontend
npm install
```

### 2. Environment Configuration

#### Backend Environment (.env)
```bash
cd backend
copy .env.example .env
```

Edit `.env` file:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/mtt_poker
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3000
```

#### Frontend Environment (.env)
```bash
cd frontend
copy .env.example .env.local
```

Edit `.env.local` file:
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

### 3. Database Setup

#### Option A: Docker Database
```bash
# Start only database services
docker-compose up -d postgres redis

# Wait for services to start (30 seconds)
timeout 30

# Run database migrations
cd backend
npm run migrate
```

#### Option B: Local Database
```bash
# Install PostgreSQL 15+ and Redis 7+
# Create database
createdb mtt_poker

# Run migrations
cd backend
npm run migrate
```

### 4. Start Development Servers

#### Terminal 1 - Backend
```bash
cd C:\Users\spder\mtt-poker-solver\backend
npm run dev
```

#### Terminal 2 - Frontend
```bash
cd C:\Users\spder\mtt-poker-solver\frontend
npm run dev
```

#### Access Points
- **Frontend**: http://localhost:3000 (Futuristic poker interface)
- **Backend API**: http://localhost:3001 (API endpoints)
- **API Docs**: http://localhost:3001/api (Swagger documentation)

## Production Deployment

### 1. Docker Production Build
```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 2. Manual Production Build

#### Backend Production
```bash
cd backend
npm install --production
npm run build
npm start
```

#### Frontend Production
```bash
cd frontend
npm install
npm run build

# Serve with nginx or static server
npx serve -s dist -l 3000
```

### 3. Cloud Deployment Options

#### Vercel (Frontend)
```bash
cd frontend
npx vercel --prod
```

#### Railway/Heroku (Backend)
```bash
cd backend
git init
git add .
git commit -m "Initial deployment"

# Railway
npx @railway/cli deploy

# Heroku
heroku create mtt-poker-solver-api
git push heroku main
```

#### AWS/DigitalOcean (Full Stack)
```bash
# Use docker-compose.prod.yml
# Configure load balancer
# Set up SSL certificates
# Configure domain DNS
```

## Testing Before Deployment

### Run Complete Test Suite
```bash
# All tests
./run-tests.sh

# Individual test suites
./run-tests.sh backend      # Backend unit tests
./run-tests.sh frontend     # Frontend component tests
./run-tests.sh integration  # API integration tests
./run-tests.sh security     # Security scans
./run-tests.sh performance  # Performance benchmarks
```

### Health Checks
```bash
# Backend health
curl http://localhost:3001/health

# Frontend health
curl http://localhost:3000

# Database connection
curl http://localhost:3001/api/health/db
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill process (replace PID)
taskkill /PID <PID> /F
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker ps | grep postgres

# Check Redis status
docker ps | grep redis

# Reset database
docker-compose down -v
docker-compose up -d postgres redis
```

#### Node Modules Issues
```bash
# Clear cache and reinstall
cd frontend
rd /s node_modules
del package-lock.json
npm install

cd ../backend
rd /s node_modules
del package-lock.json
npm install
```

#### Frontend Build Errors
```bash
# Clear Vite cache
cd frontend
rd /s node_modules\.vite
npm run dev
```

## Environment Variables Reference

### Backend (.env)
```env
# Server
NODE_ENV=production|development|test
PORT=3001
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port/db

# Security
JWT_SECRET=your-256-bit-secret
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=https://your-domain.com

# Features
ENABLE_CACHING=true
ENABLE_LOGGING=true
LOG_LEVEL=info
```

### Frontend (.env.local)
```env
# API Configuration
VITE_API_URL=https://api.your-domain.com
VITE_WS_URL=wss://api.your-domain.com

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false

# UI Configuration
VITE_THEME=futuristic
VITE_PARTICLE_COUNT=60
```

## Performance Optimization

### Backend Optimizations
- Enable Redis caching for ICM calculations
- Use connection pooling for database
- Implement rate limiting for API endpoints
- Enable gzip compression
- Use CDN for static assets

### Frontend Optimizations
- Code splitting with React.lazy()
- Image optimization and lazy loading
- Service worker for offline support
- Bundle analysis and tree shaking
- CSS purging for smaller builds

## Security Checklist

### Production Security
- [ ] HTTPS enabled with valid SSL certificates
- [ ] Environment variables secured (no secrets in code)
- [ ] Database credentials rotated
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] SQL injection protection enabled
- [ ] XSS protection headers set
- [ ] Security headers (HSTS, CSP) configured

### Monitoring
- [ ] Health check endpoints configured
- [ ] Error tracking (Sentry) setup
- [ ] Performance monitoring enabled
- [ ] Log aggregation configured
- [ ] Uptime monitoring active
- [ ] Database backup strategy implemented

---

## Quick Commands Summary

```bash
# Development
npm install && npm run dev                    # Start dev server
docker-compose up -d                         # Start with Docker
./run-tests.sh                               # Run all tests

# Production
docker-compose -f docker-compose.prod.yml up -d  # Deploy production
npm run build && npm start                   # Manual production build
npx vercel --prod                            # Deploy to Vercel

# Troubleshooting
docker-compose logs                          # View logs
docker-compose down -v && docker-compose up # Reset everything
npm run clean && npm install                # Clean install
```

Your MTT Poker Solver is ready to dominate the poker world! 🃏✨