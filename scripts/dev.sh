#!/bin/bash
# Start both the Next.js frontend and FastAPI backend for local development.
# Usage: bash scripts/dev.sh

set -e

echo "Starting FastAPI backend on :8000..."
cd "$(dirname "$0")/.."
uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!

echo "Starting Next.js frontend..."
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Workshop: http://localhost:3000/workshop"
echo ""
echo "Press Ctrl+C to stop both."

wait
