@echo off
echo 🃏 MTT Poker Solver - Quick Setup
echo ================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ and try again.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected

echo.
echo 🔧 Setting up environment files...

REM Setup backend environment
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo ✅ Created backend\.env from example
    ) else (
        echo ⚠️  backend\.env.example not found, creating basic .env
        (
            echo NODE_ENV=development
            echo PORT=3001
            echo FRONTEND_URL=http://localhost:5174
            echo DB_HOST=localhost
            echo DB_PORT=5432
            echo DB_NAME=mtt_poker_solver
            echo DB_USER=postgres
            echo DB_PASSWORD=password
            echo REDIS_HOST=localhost
            echo REDIS_PORT=6379
            echo LOG_LEVEL=info
            echo JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
            echo ENCRYPTION_KEY=your-32-character-encryption-key-here
            echo RATE_LIMIT_WINDOW_MS=900000
            echo RATE_LIMIT_MAX_REQUESTS=1000
            echo CACHE_TTL_SECONDS=3600
            echo MAX_CONCURRENT_CALCULATIONS=10
        ) > "backend\.env"
    )
) else (
    echo ✅ backend\.env already exists
)

REM Setup frontend environment
if not exist "frontend\.env" (
    if exist "frontend\.env.example" (
        copy "frontend\.env.example" "frontend\.env" >nul
        echo ✅ Created frontend\.env from example
    ) else (
        echo ⚠️  frontend\.env.example not found, creating basic .env
        (
            echo VITE_API_URL=http://localhost:3001/api
            echo VITE_NODE_ENV=development
            echo VITE_ENABLE_DEBUG=true
            echo VITE_ENABLE_ANALYTICS=false
            echo VITE_APP_NAME=MTT Poker Solver
            echo VITE_APP_VERSION=1.0.0
        ) > "frontend\.env"
    )
) else (
    echo ✅ frontend\.env already exists
)

echo.
echo 📦 Installing dependencies...
echo.

echo Installing frontend dependencies...
cd frontend
call npm install --legacy-peer-deps
if %ERRORLEVEL% neq 0 (
    echo ❌ Frontend install failed. Trying with force flag...
    call npm install --legacy-peer-deps --force
    if %ERRORLEVEL% neq 0 (
        echo ❌ Frontend install failed even with force flag
        pause
        exit /b 1
    )
)
echo ✅ Frontend dependencies installed

echo Installing backend dependencies...
cd ..\backend
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Backend install failed. Trying with force flag...
    call npm install --force
    if %ERRORLEVEL% neq 0 (
        echo ❌ Backend install failed even with force flag
        pause
        exit /b 1
    )
)
echo ✅ Backend dependencies installed

cd ..

echo.
echo ✅ Setup complete!
echo.
echo 🚀 Starting servers...
echo.

echo Starting backend API...
start "MTT Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak

echo Starting frontend UI...
start "MTT Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo 🎉 MTT Poker Solver is starting up!
echo.
echo 📱 Frontend: http://localhost:5174 (or check the frontend window)
echo 🔧 Backend:  http://localhost:3001
echo 📊 API Docs: http://localhost:3001/api
echo.
echo 💡 Tip: If you encounter database connection errors, make sure PostgreSQL and Redis are running
echo 💡 Docker users: run 'docker-compose up -d' instead for easier database setup
echo.
echo Press any key to exit this setup window...
pause
