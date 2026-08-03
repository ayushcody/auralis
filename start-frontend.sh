#!/bin/bash
# Start frontend Next.js server on port 3000
cd "$(dirname "$0")/frontend"
echo "Starting Next.js Frontend on http://localhost:3000..."
npm run dev
