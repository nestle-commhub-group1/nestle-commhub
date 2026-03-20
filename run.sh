#!/bin/bash

echo ""
echo "Starting Nestlé CommHub..."
echo "========================="

# More aggressive port cleanup
cleanup_port() {
  local port=$1
  local pids=$(lsof -ti:$port 2>/dev/null)
  if [ ! -z "$pids" ]; then
    echo "Killing processes on port $port..."
    echo $pids | xargs kill -9 2>/dev/null
    sleep 1
  fi
}

cleanup_port 5001
cleanup_port 5173

# Kill any lingering node/vite processes
pkill -f "nodemon" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

echo "Starting backend..."
cd backend
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "Waiting for backend..."
for i in {1..10}; do
  sleep 1
  if curl -s http://localhost:5001/api/health \
    > /dev/null 2>&1; then
    echo "Backend ready!"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "Backend failed to start"
    cat /tmp/backend.log
    exit 1
  fi
done

echo "Starting frontend..."
cd app
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 4

echo ""
echo "========================="
echo "System is running!"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:5001"
echo "Dev tool: http://localhost:5173/dev"
echo "========================="
echo ""
echo "Press Ctrl+C to stop"
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
