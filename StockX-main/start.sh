#!/bin/bash

echo "🚀 Starting StockX Restaurant Inventory System..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Start database
echo "📦 Starting PostgreSQL database..."
cd "$(dirname "$0")"
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Setup backend
echo "🔧 Setting up backend..."
cd backend

# Generate Prisma client
echo "📝 Generating Prisma client..."
npm run prisma:generate

# Run migrations
echo "🗄️  Running database migrations..."
npm run prisma:migrate

# Start backend in background
echo "🚀 Starting backend server..."
npm run start:dev &
BACKEND_PID=$!

# Setup frontend
echo "🎨 Setting up frontend..."
cd ../frontend

# Start frontend
echo "🚀 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ StockX is starting up!"
echo ""
echo "📍 Frontend: http://localhost:5134"
echo "📍 Backend API: http://localhost:3000"
echo "📍 API Docs: http://localhost:3000/api"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker-compose down; exit" INT TERM
wait

