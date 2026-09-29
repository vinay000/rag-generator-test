#!/bin/bash

# Trap Ctrl+C (SIGINT) and exit signals to clean up background processes
trap 'echo -e "\nShutting down backend and frontend..."; kill 0' INT TERM EXIT

echo "🚀 Starting Backend and Frontend..."

# Start Backend
(cd backend && npm run dev) &

# Start Frontend
(cd frontend && npm run dev) &

# Wait for background processes
wait
