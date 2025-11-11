#!/bin/bash

echo "Starting Task Tracker Application..."
echo ""
echo "Starting Backend Server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

sleep 3

echo ""
echo "Starting Frontend Application..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "Both servers are starting..."
echo "Backend will be available at http://localhost:5000"
echo "Frontend will be available at http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
