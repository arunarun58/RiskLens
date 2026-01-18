#!/bin/bash

# RiskLens Stop Script
# Stops both Django backend and Next.js frontend

echo "🛑 Stopping RiskLens..."

# Kill processes by PID if files exist
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill $BACKEND_PID 2>/dev/null && echo "✓ Backend stopped (PID: $BACKEND_PID)" || echo "⚠ Backend process not found"
    rm .backend.pid
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill $FRONTEND_PID 2>/dev/null && echo "✓ Frontend stopped (PID: $FRONTEND_PID)" || echo "⚠ Frontend process not found"
    rm .frontend.pid
fi

# Fallback: kill by port
lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "✓ Cleaned up port 8000" || true
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✓ Cleaned up port 3000" || true

echo "✅ RiskLens stopped"
