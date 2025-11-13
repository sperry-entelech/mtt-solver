# Quick Start Guide

Get the MTT Poker Solver running in 5 minutes!

## Prerequisites Check

Make sure you have:
- ✅ Node.js installed ([Download](https://nodejs.org/))
- ✅ Docker Desktop installed and running ([Download](https://www.docker.com/products/docker-desktop/))

Verify installations:
```powershell
node --version
docker --version
```

## Installation

### Windows (Easiest)

1. **Run the installer:**
   ```powershell
   .\install-all.bat
   ```

2. **Start Docker Desktop** (if not already running)

3. **Start the application:**
   ```powershell
   docker-compose up -d
   ```

4. **Wait 30 seconds**, then run migrations:
   ```powershell
   docker-compose exec backend npm run migration:migrate
   ```

5. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/health

### Mac/Linux

1. **Install dependencies:**
   ```bash
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..
   ```

2. **Start Docker Desktop**

3. **Start the application:**
   ```bash
   docker-compose up -d
   ```

4. **Run migrations:**
   ```bash
   docker-compose exec backend npm run migration:migrate
   ```

5. **Access:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Verify It's Working

1. **Check containers are running:**
   ```powershell
   docker ps
   ```
   Should show: postgres, redis, backend, frontend

2. **Check backend health:**
   Visit: http://localhost:3001/health
   Should show: `{"status":"healthy",...}`

3. **Check frontend:**
   Visit: http://localhost:3000
   Should show the MTT Poker Solver dashboard

## Common Issues

**Port already in use?**
- Stop other services using ports 3000, 3001, 5432, 6379
- Or change ports in `docker-compose.yml`

**Docker not running?**
- Start Docker Desktop
- Wait for it to fully start (whale icon in system tray)

**Database errors?**
- Make sure PostgreSQL container is running: `docker ps`
- Try: `docker-compose restart`

## Next Steps

- Read [INSTALLATION.md](./INSTALLATION.md) for detailed setup
- Read [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for development guide
- Explore the API at http://localhost:3001/api

## Stopping the Application

```powershell
docker-compose down
```

To remove all data:
```powershell
docker-compose down -v
```

---

**That's it! You're ready to use the MTT Poker Solver! 🃏**

