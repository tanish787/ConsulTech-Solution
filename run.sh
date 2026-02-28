#!/usr/bin/env bash
# Run the CIC Network frontend locally (use this from Terminal outside Cursor)
set -e
cd "$(dirname "$0")/frontend"
echo "Installing dependencies..."
npm install
echo "Starting dev server at http://localhost:3000"
npm start
