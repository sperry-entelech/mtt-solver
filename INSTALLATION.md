# Installation Guide - MTT Poker Solver

This guide will help you set up and run the MTT Poker Solver on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

### Required Software

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/ (choose LTS version)
   - Verify installation:
     ```powershell
     node --version
     npm --version
     ```
   - Both commands should show version numbers.

2. **Docker Desktop** (Recommended)
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install and start Docker Desktop
   - Verify installation:
     ```powershell
     docker --version
     docker-compose --version
     ```

### Optional Software

- **Git** - For version control (if cloning from repository)
- **VS Code** or your preferred code editor

## Installation Steps

### Method 1: Quick Install (Using Batch Script)

1. **Run the installation script:**
   ```powershell
   .\install-all.bat
   ```

   This will automatically install all dependencies for both backend and frontend.

### Method 2: Manual Installation

#### Step 1: Install Backend Dependencies

Open PowerShell or Command Prompt in the project root directory:

```powershell
cd backend
npm install
cd ..
```

#### Step 2: Install Frontend Dependencies

```powershell
cd frontend
npm install
cd ..
```

#### Step 3: Install Root Dependencies (Optional)

```powershell
npm install
```

## Running the Application

### Option A: Using Docker (Recommended - Easiest)

This is the easiest way to run everything. Docker will handle all services automatically.

1. **Make sure Docker Desktop is running**
   - Check the system tray for Docker icon
   - If not running, start Docker Desktop

2. **Start all services:**
   ```powershell
   docker-compose up -d
   ```

3. **Wait 30 seconds** for all services to start up

4. **Run database migrations:**
   ```powershell
   docker-compose exec backend npm run migration:migrate
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Health Check: http://localhost:3001/health
   - API Documentation: http://localhost:3001/api

6. **View logs (optional):**
   ```powershell
   docker-compose logs -f
   ```

### Option B: Development Mode (Without Docker)

If you prefer to run services separately or don't want to use Docker:

#### Step 1: Start Database Services (PostgreSQL & Redis)

You can still use Docker for just the databases:

```powershell
docker-compose up -d postgres redis
```

Or install PostgreSQL and Redis manually on your system.

#### Step 2: Configure Backend Environment

Create a `.env` file in the `backend` folder:

```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mtt_poker_solver
DB_USER=postgres
DB_PASSWORD=poker_password_2024
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_2024
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key-here-change-in-production
ENABLE_METRICS=false
RUN_MIGRATIONS=true
```

#### Step 3: Run Database Migrations

```powershell
cd backend
npm run migration:migrate
```

#### Step 4: Start Backend Server

In one terminal window:

```powershell
cd backend
npm run dev
```

The backend should start on http://localhost:3001

#### Step 5: Start Frontend Server

In another terminal window:

```powershell
cd frontend
npm run dev
```

The frontend should start on http://localhost:3000

## Verification

### Check if Everything is Working

1. **Check Docker containers are running:**
   ```powershell
   docker ps
   ```
   You should see containers for: postgres, redis, backend, frontend

2. **Check backend health:**
   ```powershell
   curl http://localhost:3001/health
   ```
   Or visit http://localhost:3001/health in your browser

3. **Check frontend:**
   Open http://localhost:3000 in your browser

## Common Issues & Solutions

### Issue: "npm is not recognized"

**Solution:** 
- Install Node.js from https://nodejs.org/
- Restart your terminal/PowerShell after installation
- Verify with: `node --version`

### Issue: "docker is not recognized"

**Solution:**
- Install Docker Desktop from https://www.docker.com/products/docker-desktop/
- Make sure Docker Desktop is running (check system tray)
- Restart your terminal after installation

### Issue: Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
- Find what's using the port:
  ```powershell
  netstat -ano | findstr :3000
  netstat -ano | findstr :3001
  ```
- Stop the process using that port, or change the port in configuration

### Issue: Database Connection Failed

**Error:** `Error: connect ECONNREFUSED`

**Solution:**
- Make sure Docker containers are running: `docker ps`
- Check if PostgreSQL container is healthy: `docker-compose logs postgres`
- Restart containers: `docker-compose restart`

### Issue: Migration Errors

**Solution:**
- Make sure PostgreSQL is running: `docker ps | findstr postgres`
- Try resetting the database:
  ```powershell
  docker-compose down -v
  docker-compose up -d postgres redis
  docker-compose exec backend npm run migration:migrate
  ```

### Issue: Module Not Found Errors

**Solution:**
- Make sure you ran `npm install` in both backend and frontend folders
- Delete `node_modules` and `package-lock.json`, then reinstall:
  ```powershell
  cd backend
  Remove-Item -Recurse -Force node_modules
  Remove-Item package-lock.json
  npm install
  ```

## Useful Commands

### Docker Commands

```powershell
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Restart a service
docker-compose restart backend

# Stop and remove everything (including data)
docker-compose down -v

# Rebuild containers after code changes
docker-compose up -d --build
```

### Development Commands

```powershell
# Run backend in development mode
cd backend
npm run dev

# Run frontend in development mode
cd frontend
npm run dev

# Run tests
cd backend
npm test

cd frontend
npm test

# Build for production
cd backend
npm run build

cd frontend
npm run build
```

### Database Commands

```powershell
# Run migrations
docker-compose exec backend npm run migration:migrate

# Create a new migration
docker-compose exec backend npm run migration:create <migration-name>

# Rollback last migration
docker-compose exec backend npm run migration:rollback
```

## Project Structure

```
mtt-solver/
├── backend/          # Backend API (Node.js/Express/TypeScript)
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   ├── config/   # Configuration
│   │   └── ...
│   └── package.json
├── frontend/         # Frontend (React/TypeScript)
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── components/ # Reusable components
│   │   └── ...
│   └── package.json
├── docker-compose.yml      # Docker configuration
├── docker-compose.prod.yml # Production Docker config
└── README.md
```

## Next Steps

After installation:

1. **Explore the API:**
   - Visit http://localhost:3001/api for API documentation
   - Try the health endpoint: http://localhost:3001/health

2. **Use the Frontend:**
   - Open http://localhost:3000
   - Try the ICM Calculator
   - Test the Hand Analyzer
   - Explore Range Visualizer

3. **Read the Documentation:**
   - See `README.md` for feature overview
   - See `DEPLOYMENT_GUIDE.md` for production deployment
   - Check API docs at `/api` endpoint

## Getting Help

If you encounter issues:

1. Check the logs: `docker-compose logs`
2. Verify all prerequisites are installed
3. Check that ports 3000, 3001, 5432, 6379 are not in use
4. Ensure Docker Desktop is running
5. Try restarting Docker containers: `docker-compose restart`

## Production Deployment

For production deployment instructions, see `README.DEPLOYMENT.md`

---

**Happy Coding! 🃏✨**

