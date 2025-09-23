@echo off
echo 🃏 MTT Poker Solver - Quick Setup
echo ================================
echo.

echo 📦 Installing dependencies...
echo.

echo Installing frontend dependencies...
cd frontend
call npm install --legacy-peer-deps
if %ERRORLEVEL% neq 0 (
    echo ❌ Frontend install failed
    pause
    exit /b 1
)

echo Installing backend dependencies...
cd ..\backend
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Backend install failed
    pause
    exit /b 1
)

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
echo Press any key to exit this setup window...
pause