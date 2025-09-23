#!/bin/bash

echo "🃏 MTT Poker Solver - Quick Setup"
echo "================================"
echo ""

echo "📦 Installing dependencies..."
echo ""

echo "Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "❌ Frontend install failed"
    exit 1
fi

echo "Installing backend dependencies..."
cd ../backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend install failed"
    exit 1
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting servers..."
echo ""

# Start backend in background
echo "Starting backend API..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend UI..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "🎉 MTT Poker Solver is starting up!"
echo ""
echo "📱 Frontend: http://localhost:5174"
echo "🔧 Backend:  http://localhost:3001"
echo "📊 API Docs: http://localhost:3001/api"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for user interrupt
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Keep script running
wait