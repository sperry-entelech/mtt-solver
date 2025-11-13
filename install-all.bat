@echo off
echo ========================================
echo MTT Poker Solver - Installation Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed!
    echo Please install Node.js (npm comes with it) from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/3] Installing Backend Dependencies...
cd backend
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Could not find backend directory!
    pause
    exit /b 1
)
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend dependency installation failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo Backend dependencies installed successfully!
echo.

echo [2/3] Installing Frontend Dependencies...
cd frontend
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Could not find frontend directory!
    pause
    exit /b 1
)
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend dependency installation failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo Frontend dependencies installed successfully!
echo.

echo [3/3] Installing Root Dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Root dependency installation failed (this is optional)
)
echo.

echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next Steps:
echo.
echo 1. Make sure Docker Desktop is installed and running
echo    Download from: https://www.docker.com/products/docker-desktop/
echo.
echo 2. Start all services:
echo    docker-compose up -d
echo.
echo 3. Wait 30 seconds for services to start
echo.
echo 4. Run database migrations:
echo    docker-compose exec backend npm run migration:migrate
echo.
echo 5. Access the application:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:3001
echo    Health Check: http://localhost:3001/health
echo.
echo For detailed instructions, see INSTALLATION.md
echo.
pause

