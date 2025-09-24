#!/bin/bash

echo "🃏 MTT Poker Solver - Quick Setup"
echo "================================"
echo ""

# Function to check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
        echo "   Download from: https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+ and try again."
        exit 1
    fi

    echo "✅ Node.js $(node -v) detected"
}

# Function to setup environment files
setup_env_files() {
    echo "🔧 Setting up environment files..."

    # Backend environment
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            echo "✅ Created backend/.env from example"
        else
            echo "⚠️  backend/.env.example not found, creating basic .env"
            cat > backend/.env << ENVEOF
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5174
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mtt_poker_solver
DB_USER=postgres
DB_PASSWORD=password
REDIS_HOST=localhost
REDIS_PORT=6379
LOG_LEVEL=info
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
ENCRYPTION_KEY=your-32-character-encryption-key-here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
CACHE_TTL_SECONDS=3600
MAX_CONCURRENT_CALCULATIONS=10
ENVEOF
        fi
    else
        echo "✅ backend/.env already exists"
    fi

    # Frontend environment
    if [ ! -f "frontend/.env" ]; then
        if [ -f "frontend/.env.example" ]; then
            cp frontend/.env.example frontend/.env
            echo "✅ Created frontend/.env from example"
        else
            echo "⚠️  frontend/.env.example not found, creating basic .env"
            cat > frontend/.env << ENVEOF
VITE_API_URL=http://localhost:3001/api
VITE_NODE_ENV=development
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
VITE_APP_NAME=MTT Poker Solver
VITE_APP_VERSION=1.0.0
ENVEOF
        fi
    else
        echo "✅ frontend/.env already exists"
    fi

    echo ""
}

# Function to install dependencies with better error handling
install_dependencies() {
    echo "📦 Installing dependencies..."
    echo ""

    echo "Installing frontend dependencies..."
    cd frontend

    # Remove node_modules if it exists and seems corrupted
    if [ -d "node_modules" ] && [ ! -f "node_modules/.package-lock.json" ]; then
        echo "🧹 Cleaning existing node_modules..."
        rm -rf node_modules package-lock.json
    fi

    npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo "❌ Frontend install failed. Trying with force flag..."
        npm install --legacy-peer-deps --force
        if [ $? -ne 0 ]; then
            echo "❌ Frontend install failed even with force flag"
            exit 1
        fi
    fi
    echo "✅ Frontend dependencies installed"

    echo "Installing backend dependencies..."
    cd ../backend

    # Remove node_modules if it exists and seems corrupted
    if [ -d "node_modules" ] && [ ! -f "node_modules/.package-lock.json" ]; then
        echo "🧹 Cleaning existing node_modules..."
        rm -rf node_modules package-lock.json
    fi

    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Backend install failed. Trying with force flag..."
        npm install --force
        if [ $? -ne 0 ]; then
            echo "❌ Backend install failed even with force flag"
            exit 1
        fi
    fi
    echo "✅ Backend dependencies installed"

    cd ..
    echo ""
}

# Function to test builds
test_builds() {
    echo "🔨 Testing builds..."

    echo "Testing backend build..."
    cd backend
    npm run build
    if [ $? -ne 0 ]; then
        echo "⚠️  Backend build has issues, but continuing with dev setup..."
    else
        echo "✅ Backend build successful"
    fi

    echo "Testing frontend build..."
    cd ../frontend
    npm run build
    if [ $? -ne 0 ]; then
        echo "⚠️  Frontend build has issues, but continuing with dev setup..."
    else
        echo "✅ Frontend build successful"
    fi

    cd ..
    echo ""
}

# Main execution
check_node
setup_env_files
install_dependencies

# Ask if user wants to test builds
read -p "🔨 Would you like to test the builds? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    test_builds
fi

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
echo "💡 Tip: If you encounter database connection errors, make sure PostgreSQL and Redis are running"
echo "💡 Docker users: run 'docker-compose up -d' instead for easier database setup"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for user interrupt
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Keep script running
wait
